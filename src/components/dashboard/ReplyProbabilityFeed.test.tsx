import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReplyProbabilityFeed } from './ReplyProbabilityFeed';
import { api } from '@/lib/api';
import type { Application } from '@/types';

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function makeApp(overrides: Partial<Application>): Application {
  return {
    id: 1,
    provider: 'greenhouse',
    company: 'Acme Health',
    role: 'Cardiologist',
    url: 'https://boards.greenhouse.io/acmehealth/1',
    status: 'queued',
    reason: '',
    appliedAt: new Date().toISOString(),
    location: 'Remote',
    remote: true,
    postedAt: new Date().toISOString(),
    fitScore: 92,
    fitSummary: 'strong match',
    outcome: '',
    outcomeAt: '',
    ...overrides,
  };
}

function renderFeed() {
  return render(
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter>
        <ReplyProbabilityFeed />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ReplyProbabilityFeed', () => {
  it('renders the top jobs ranked with a why line', async () => {
    vi.spyOn(api, 'getApplications').mockResolvedValue([
      makeApp({ id: 1, role: 'Cardiologist', fitScore: 92 }),
      makeApp({ id: 2, role: 'Nurse', fitScore: 40 }),
    ]);

    renderFeed();

    expect(
      await screen.findByRole('heading', {
        name: /top reply-probability jobs/i,
      }),
    ).toBeInTheDocument();

    // The high-fit Cardiologist ranks first and carries a why line.
    const link = await screen.findByRole('link', {
      name: /cardiologist @ acme health/i,
    });
    expect(link).toBeInTheDocument();
    expect(screen.getByText(/fit 92/i)).toBeInTheDocument();
    expect(screen.getAllByText(/in your queue/i).length).toBeGreaterThan(0);
  });

  it('shows an empty state without applications', async () => {
    vi.spyOn(api, 'getApplications').mockResolvedValue([]);

    renderFeed();

    expect(
      await screen.findByText(/no jobs to target yet/i),
    ).toBeInTheDocument();
  });

  it('shows an honest error when applications cannot load', async () => {
    vi.spyOn(api, 'getApplications').mockRejectedValue(new Error('down'));

    renderFeed();

    expect(
      await screen.findByText(/could not load applications/i),
    ).toBeInTheDocument();
  });
});
