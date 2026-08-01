import { fireEvent, render, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { makeApp } from '@/test/fixtures';
import { useApplySelected } from './useApplySelected';
import { useSetApplicationApproved } from './useSetApplicationApproved';
import { useSetOutcome } from './useSetOutcome';

function makeClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  return { client, invalidate };
}

function renderWith(client: QueryClient, node: ReactNode) {
  return render(
    <QueryClientProvider client={client}>{node}</QueryClientProvider>,
  );
}

function ApplyHarness() {
  const m = useApplySelected();
  return <button onClick={() => m.mutate([1, 2])}>apply</button>;
}

function OutcomeHarness() {
  const m = useSetOutcome();
  return (
    <button onClick={() => m.mutate({ id: 1, outcome: 'replied' })}>
      outcome
    </button>
  );
}

function ApprovedHarness() {
  const m = useSetApplicationApproved();
  return (
    <button onClick={() => m.mutate({ id: 1, approved: true })}>approve</button>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('mutation hooks invalidate caches', () => {
  it('useApplySelected posts the ids and invalidates jobs + mission', async () => {
    const { client, invalidate } = makeClient();
    const applySelected = vi.spyOn(api, 'applySelected').mockResolvedValue({
      applied: 2,
    });

    renderWith(client, <ApplyHarness />);
    fireEvent.click(document.querySelector('button')!);

    await waitFor(() => expect(applySelected).toHaveBeenCalledWith([1, 2]));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['jobs'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['mission'] });
  });

  it('useSetOutcome patches the outcome and invalidates jobs + mission', async () => {
    const { client, invalidate } = makeClient();
    const setOutcome = vi
      .spyOn(api, 'setApplicationOutcome')
      .mockResolvedValue(makeApp({ id: 1, outcome: 'replied' }));

    renderWith(client, <OutcomeHarness />);
    fireEvent.click(document.querySelector('button')!);

    await waitFor(() => expect(setOutcome).toHaveBeenCalledWith(1, 'replied'));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['jobs'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['mission'] });
  });

  it('useSetApplicationApproved toggles approval and invalidates jobs + mission', async () => {
    const { client, invalidate } = makeClient();
    const setApproved = vi
      .spyOn(api, 'setApplicationApproved')
      .mockResolvedValue(makeApp({ id: 1, approved: true }));

    renderWith(client, <ApprovedHarness />);
    fireEvent.click(document.querySelector('button')!);

    await waitFor(() => expect(setApproved).toHaveBeenCalledWith(1, true));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['jobs'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['mission'] });
  });
});
