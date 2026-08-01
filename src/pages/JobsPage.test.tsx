import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import JobsPage from './JobsPage';
import { api } from '@/lib/api';
import { emptyProfile } from '@/lib/onboarding';
import type { Application } from '@/types';

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function makeApp(overrides: Partial<Application>): Application {
  return {
    id: 1,
    provider: 'greenhouse',
    company: 'Acme',
    role: 'Engineer',
    url: '',
    status: 'applied',
    reason: '',
    appliedAt: new Date().toISOString(),
    location: 'Remote',
    remote: true,
    postedAt: new Date().toISOString(),
    fitScore: 80,
    fitSummary: '',
    outcome: '',
    outcomeAt: '',
    ...overrides,
  };
}

function renderPage() {
  return render(
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter initialEntries={['/jobs']}>
        <Routes>
          <Route path="*" element={<JobsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('JobsPage review flow', () => {
  it('approves a queued job and submits it with in-context consent', async () => {
    const apps: Application[] = [
      makeApp({
        id: 1,
        status: 'queued',
        role: 'Backend Engineer',
        company: 'Acme',
        fitScore: 87,
      }),
      makeApp({
        id: 2,
        status: 'applied',
        role: 'Platform Engineer',
        company: 'Globex',
      }),
    ];

    vi.spyOn(api, 'getApplications').mockImplementation(async () =>
      apps.map((a) => ({ ...a })),
    );
    vi.spyOn(api, 'getConfig').mockResolvedValue({
      ...emptyProfile(),
      applyConsent: false,
      applyDelaySec: 3,
      maxAppsPerDay: 25,
    });
    vi.spyOn(api, 'setApplicationApproved').mockImplementation(
      async (id, approved) => {
        const target = apps.find((a) => a.id === id);
        if (!target) throw new Error('not found');
        target.approved = approved;
        return { ...target };
      },
    );
    const saveConfig = vi
      .spyOn(api, 'saveConfig')
      .mockResolvedValue(emptyProfile());
    const applySelected = vi
      .spyOn(api, 'applySelected')
      .mockResolvedValue({ applied: 1 });

    renderPage();

    // The queued job exposes an approve toggle; the applied job does not.
    const approve = await screen.findByRole('button', {
      name: /add to apply queue/i,
    });
    expect(
      screen.queryByRole('button', { name: /remove from apply queue/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(approve);

    // Approved → the apply bar appears with the count.
    expect(
      await screen.findByRole('button', { name: /apply approved \(1\)/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /apply approved \(1\)/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Consent is given in context: checkbox gates the submit button.
    const submit = screen.getByRole('button', { name: /submit applications/i });
    expect(submit).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(submit).toBeEnabled();
    fireEvent.click(submit);

    await waitFor(() => {
      expect(saveConfig).toHaveBeenCalledWith(
        expect.objectContaining({ applyConsent: true }),
      );
      expect(applySelected).toHaveBeenCalledWith([1]);
    });
  });

  it('does not offer approval controls for already-applied jobs', async () => {
    vi.spyOn(api, 'getApplications').mockResolvedValue([
      makeApp({ id: 5, status: 'applied', outcome: 'interview' }),
    ]);
    vi.spyOn(api, 'getConfig').mockResolvedValue({
      ...emptyProfile(),
      applyConsent: true,
    });

    renderPage();

    await screen.findByText('Engineer');
    expect(
      screen.queryByRole('button', { name: /add to apply queue/i }),
    ).not.toBeInTheDocument();
    // Applied jobs expose the outcome cycle instead.
    expect(
      screen.getByRole('button', { name: /interview/i }),
    ).toBeInTheDocument();
  });
});
