import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import JobDetailPage from './JobDetailPage';
import { api } from '@/lib/api';
import { makeApp, makeConfig } from '@/test/fixtures';
import type { Application } from '@/types';

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderDetail(id = '1') {
  return render(
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter initialEntries={[`/jobs/${id}`]}>
        <Routes>
          <Route path="/jobs/:id" element={<JobDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('JobDetailPage', () => {
  it('renders the job header, meta, fit score, and description', async () => {
    vi.spyOn(api, 'getApplications').mockResolvedValue([
      makeApp({
        id: 1,
        status: 'applied',
        role: 'Cardiologist',
        company: 'Acme Health',
        fitScore: 92,
        fitSummary: 'strong match',
        description: 'Own the cardiac care program end to end.',
      }),
    ]);
    vi.spyOn(api, 'getConfig').mockResolvedValue(makeConfig());

    renderDetail('1');

    expect(await screen.findByText('Cardiologist')).toBeInTheDocument();
    expect(screen.getByText('Acme Health')).toBeInTheDocument();
    expect(screen.getByText('92/100')).toBeInTheDocument();
    expect(screen.getByText('strong match')).toBeInTheDocument();
    expect(
      screen.getByText(/own the cardiac care program end to end/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /open job posting/i }),
    ).toBeInTheDocument();
  });

  it('cycles the outcome on an applied job', async () => {
    vi.spyOn(api, 'getApplications').mockResolvedValue([
      makeApp({ id: 1, status: 'applied', outcome: '' }),
    ]);
    vi.spyOn(api, 'getConfig').mockResolvedValue(makeConfig());
    const setOutcome = vi
      .spyOn(api, 'setApplicationOutcome')
      .mockResolvedValue(
        makeApp({ id: 1, status: 'applied', outcome: 'replied' }),
      );

    renderDetail('1');

    fireEvent.click(
      await screen.findByRole('button', { name: /cycle outcome → replied/i }),
    );
    await waitFor(() => expect(setOutcome).toHaveBeenCalledWith(1, 'replied'));
  });

  it('shows the not-found state for an unknown id', async () => {
    vi.spyOn(api, 'getApplications').mockResolvedValue([makeApp({ id: 2 })]);
    vi.spyOn(api, 'getConfig').mockResolvedValue(makeConfig());

    renderDetail('999');

    expect(
      await screen.findByText(/application not found/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /back to jobs/i }),
    ).toBeInTheDocument();
  });

  it('shows approve + apply actions for a queued job', async () => {
    vi.spyOn(api, 'getApplications').mockResolvedValue([
      makeApp({ id: 1, status: 'queued', approved: false }),
    ]);
    vi.spyOn(api, 'getConfig').mockResolvedValue(makeConfig());

    renderDetail('1');

    expect(
      await screen.findByRole('button', { name: /approve for apply/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /apply now/i })).toBeDisabled();
  });

  it('approves a queued job from the detail page', async () => {
    const apps: Application[] = [
      makeApp({ id: 1, status: 'queued', approved: false }),
    ];
    vi.spyOn(api, 'getApplications').mockImplementation(async () =>
      apps.map((a) => ({ ...a })),
    );
    vi.spyOn(api, 'getConfig').mockResolvedValue(makeConfig());
    const setApproved = vi
      .spyOn(api, 'setApplicationApproved')
      .mockImplementation(async (id, approved) => {
        const target = apps.find((a) => a.id === id);
        if (target) target.approved = approved;
        return { ...target! };
      });

    renderDetail('1');

    fireEvent.click(
      await screen.findByRole('button', { name: /approve for apply/i }),
    );
    await waitFor(() => expect(setApproved).toHaveBeenCalledWith(1, true));
    // After the refetch the Apply button is enabled.
    const applyNow = screen.getByRole('button', { name: /apply now/i });
    await waitFor(() => expect(applyNow).toBeEnabled());
  });

  it('applies an approved job with in-context consent', async () => {
    const apps: Application[] = [
      makeApp({ id: 1, status: 'queued', approved: true }),
    ];
    vi.spyOn(api, 'getApplications').mockImplementation(async () =>
      apps.map((a) => ({ ...a })),
    );
    vi.spyOn(api, 'getConfig').mockResolvedValue(
      makeConfig({ applyConsent: false, maxAppsPerDay: 25 }),
    );
    const saveConfig = vi
      .spyOn(api, 'saveConfig')
      .mockResolvedValue(makeConfig({ applyConsent: true }));
    const applySelected = vi
      .spyOn(api, 'applySelected')
      .mockResolvedValue({ applied: 1 });

    renderDetail('1');

    fireEvent.click(await screen.findByRole('button', { name: /apply now/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Consent is granted in-context: the checkbox gates the submit button.
    const submit = screen.getByRole('button', {
      name: /submit applications/i,
    });
    expect(submit).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(submit).toBeEnabled();
    fireEvent.click(submit);

    await waitFor(() =>
      expect(saveConfig).toHaveBeenCalledWith(
        expect.objectContaining({ applyConsent: true }),
      ),
    );
    await waitFor(() => expect(applySelected).toHaveBeenCalledWith([1]));
  });
});
