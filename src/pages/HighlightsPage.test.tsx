import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HighlightsPage from './HighlightsPage';
import { api } from '@/lib/api';
import type { Highlight } from '@/types/highlights';

const highlights: Highlight[] = [
  {
    id: '1',
    from: 'recruiter@databricks.com',
    fromName: 'Data Recruiter',
    subject: 'Interview invitation - Senior Backend',
    date: '2026-08-04T10:00:00Z',
    signal: 'interview',
    confidence: 95,
    company: 'Databricks',
    bodyPreview: 'We would love to schedule an interview with you.',
  },
  {
    id: '2',
    from: 'noreply@somewhere.com',
    subject: 'Weekly digest',
    date: '2026-08-03T10:00:00Z',
    signal: 'recruiter',
    confidence: 70,
    domain: 'somewhere.com',
  },
];

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPage() {
  return render(
    <QueryClientProvider client={makeClient()}>
      <HighlightsPage />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('HighlightsPage', () => {
  it('renders hiring signals from the API', async () => {
    vi.spyOn(api, 'getHighlights').mockResolvedValue(highlights);

    renderPage();

    expect(
      await screen.findByRole('heading', { name: /inbox/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/interview invitation - senior backend/i)).toBeInTheDocument();
    expect(screen.getAllByText(/databricks/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/weekly digest/i)).toBeInTheDocument();
  });

  it('shows an empty state when there are no highlights', async () => {
    vi.spyOn(api, 'getHighlights').mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText(/no hiring signals yet/i)).toBeInTheDocument();
  });
});
