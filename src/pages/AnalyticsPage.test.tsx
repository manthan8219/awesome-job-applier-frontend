import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AnalyticsPage from './AnalyticsPage';
import { api } from '@/lib/api';
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
      <AnalyticsPage />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AnalyticsPage', () => {
  it('renders the pipeline funnel + conversion rates', async () => {
    vi.spyOn(api, 'getApplications').mockResolvedValue([
      makeApp({ outcome: '' }),
      makeApp({ id: 2, outcome: 'interview' }),
      makeApp({ id: 3, outcome: 'offer' }),
    ]);

    renderPage();

    expect(
      await screen.findByRole('heading', { name: /job search analytics/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Pipeline funnel')).toBeInTheDocument();
    // Funnel labels + counts (labels appear once per column row).
    expect(screen.getAllByText('Applied').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Interview').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Offer').length).toBeGreaterThan(0);
    // Conversion rate cards.
    expect(screen.getByText('Applied → Replied')).toBeInTheDocument();
    expect(screen.getByText('Replied → Interview')).toBeInTheDocument();
    // Rejected/ghosted chips.
    expect(screen.getByText(/0 rejected/)).toBeInTheDocument();
  });

  it('renders the per-provider yield table', async () => {
    vi.spyOn(api, 'getApplications').mockResolvedValue([
      makeApp({ provider: 'greenhouse', outcome: 'interview' }),
      makeApp({ id: 2, provider: 'lever', outcome: '' }),
    ]);

    renderPage();

    expect(
      await screen.findByText('Per-provider yield'),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('cell', { name: /greenhouse/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: /lever/i })).toBeInTheDocument();
  });

  it('exports a CSV when there are applications', async () => {
    vi.spyOn(api, 'getApplications').mockResolvedValue([
      makeApp({ provider: 'greenhouse' }),
    ]);
    // jsdom has no createObjectURL/revokeObjectURL — stub them for download.
    URL.createObjectURL = vi.fn(() => 'blob:fake');
    URL.revokeObjectURL = vi.fn();
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    renderPage();
    const button = await screen.findByRole('button', {
      name: /export csv \(1\)/i,
    });
    fireEvent.click(button);

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });

  it('shows an empty state with no applied jobs', async () => {
    vi.spyOn(api, 'getApplications').mockResolvedValue([]);
    renderPage();
    expect(
      await screen.findByText(/no applied jobs yet/i),
    ).toBeInTheDocument();
  });
});
