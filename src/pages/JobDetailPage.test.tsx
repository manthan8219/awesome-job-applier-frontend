import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import JobDetailPage from './JobDetailPage';
import { api } from '@/lib/api';
import { makeApp } from '@/test/fixtures';

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

    renderDetail('999');

    expect(
      await screen.findByText(/application not found/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /back to jobs/i }),
    ).toBeInTheDocument();
  });
});
