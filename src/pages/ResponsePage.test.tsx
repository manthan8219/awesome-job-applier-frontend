import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ResponsePage from './ResponsePage';
import { api } from '@/lib/api';
import type { AnalyticsSnapshot } from '@/types/analytics';
import type { Application } from '@/types';
import type { OutreachItem } from '@/types/outreach';

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPage() {
  return render(
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter>
        <ResponsePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const snapshot: AnalyticsSnapshot = {
  statusTotals: { applied: 2 },
  funnel: { applied: 2, replied: 1, interview: 0, offer: 0, rejected: 0, ghosted: 0 },
  perProvider: [
    { provider: 'greenhouse', applied: 2, replied: 1, interview: 0, offer: 0, replyProbability: 50 },
  ],
  appliedLast7Days: [],
  appliedLast30Days: [],
  responseProbability: 50,
  generatedAt: new Date().toISOString(),
};

function makeApp(overrides: Partial<Application>): Application {
  return {
    id: 1,
    provider: 'greenhouse',
    company: 'Acme',
    role: 'Engineer',
    url: 'https://example.com/1',
    status: 'applied',
    reason: '',
    appliedAt: new Date().toISOString(),
    location: 'Remote',
    remote: true,
    postedAt: new Date().toISOString(),
    fitScore: 80,
    fitSummary: '',
    outcome: 'replied',
    outcomeAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeItem(overrides: Partial<OutreachItem>): OutreachItem {
  return {
    id: '1',
    channel: 'email',
    jobURL: 'https://example.com/1',
    company: 'Acme',
    role: 'Engineer',
    body: 'hi',
    status: 'replied',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ResponsePage', () => {
  it('renders reply probability, funnel, providers and A/B results', async () => {
    vi.spyOn(api, 'getAnalytics').mockResolvedValue(snapshot);
    vi.spyOn(api, 'getApplications').mockResolvedValue([
      makeApp({ id: 1, outcome: 'replied' }),
      makeApp({ id: 2, outcome: '' }),
    ]);
    vi.spyOn(api, 'getOutreachItems').mockResolvedValue([
      makeItem({ id: 'a', variant: 'A', status: 'replied' }),
      makeItem({ id: 'b', variant: 'B', status: 'sent' }),
    ]);

    renderPage();

    expect(
      await screen.findByRole('heading', { name: /is anyone replying/i }),
    ).toBeInTheDocument();

    // Wait for data to load, then assert the stats.
    await screen.findByText(/overall reply probability/i);
    expect(screen.getAllByText('50%').length).toBeGreaterThan(0);

    // Funnel renders with counts.
    expect(screen.getByText(/pipeline funnel/i)).toBeInTheDocument();

    // Provider table.
    expect(screen.getByText(/per-provider reply probability/i)).toBeInTheDocument();
    expect(screen.getByText('greenhouse')).toBeInTheDocument();

    // A/B variants: A replied (100%), B did not (0%).
    expect(screen.getByText('Variant A')).toBeInTheDocument();
    expect(screen.getByText('Variant B')).toBeInTheDocument();

    // Recommendation about the winning variant.
    expect(
      screen.getByText(/variant a replies at 100%.*run the winner/i),
    ).toBeInTheDocument();
  });

  it('shows honest empty states without data', async () => {
    vi.spyOn(api, 'getAnalytics').mockResolvedValue({
      ...snapshot,
      perProvider: [],
      responseProbability: 0,
    });
    vi.spyOn(api, 'getApplications').mockResolvedValue([]);
    vi.spyOn(api, 'getOutreachItems').mockResolvedValue([]);

    renderPage();

    expect(
      await screen.findByText(/no applied jobs yet/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/no provider data/i)).toBeInTheDocument();
    expect(screen.getByText(/no tagged variants/i)).toBeInTheDocument();
  });
});
