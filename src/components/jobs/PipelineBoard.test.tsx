import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PipelineBoard } from './PipelineBoard';
import { api } from '@/lib/api';
import type { Application, Outcome } from '@/types';

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

function renderBoard(apps: Application[]) {
  return render(
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter>
        <PipelineBoard apps={apps} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PipelineBoard', () => {
  it('renders every stage column with its count', () => {
    renderBoard([
      makeApp({ outcome: '' }),
      makeApp({ id: 2, role: 'Nurse', outcome: 'interview' }),
    ]);

    for (const title of ['Applied', 'Replied', 'Interview', 'Offer', 'Closed']) {
      expect(
        screen.getByRole('heading', { name: title }),
      ).toBeInTheDocument();
    }
    // Applied column shows 1, Interview shows 1, others empty.
    expect(screen.getByText('Engineer', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('Nurse', { selector: 'p' })).toBeInTheDocument();
  });

  it('moves a card to another stage via the select', async () => {
    const spy = vi.spyOn(api, 'setApplicationOutcome').mockResolvedValue(
      makeApp({ outcome: 'interview' }),
    );
    renderBoard([makeApp({ outcome: '' })]);

    const select = screen.getByLabelText(/move engineer to stage/i);
    fireEvent.change(select, { target: { value: 'interview' } });

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(1, 'interview' as Outcome);
    });
  });

  it('shows an empty state for an empty column', () => {
    renderBoard([makeApp({ outcome: 'offer' })]);
    // Closed and Replied columns have no cards → empty states.
    expect(screen.getAllByText('Empty').length).toBeGreaterThan(0);
  });
});
