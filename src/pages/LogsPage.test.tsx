import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LogsPage from './LogsPage';
import { api } from '@/lib/api';
import type { UsageSnapshot } from '@/types/usage';

const usage: UsageSnapshot = {
  dataDir: '/tmp/nexus-home/.nexus',
  totalBytes: 1024 * 1024,
  dbBytes: 800 * 1024,
  resumesBytes: 200 * 1024,
  metaBytes: 24 * 1024,
  otherBytes: 0,
  jobCount: 6,
  heapAlloc: 5 * 1024 * 1024,
  sysBytes: 8 * 1024 * 1024,
  goroutines: 42,
  aiMode: 'off',
  collectedAt: new Date().toISOString(),
  err: '',
};

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPage() {
  return render(
    <QueryClientProvider client={makeClient()}>
      <LogsPage />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LogsPage', () => {
  it('renders the engine log, usage panel, and log lines', async () => {
    vi.spyOn(api, 'getLogs').mockResolvedValue({
      lines: ['  ✓ greenhouse searched', '  → lever searching'],
      filter: '',
    });
    vi.spyOn(api, 'getUsage').mockResolvedValue(usage);

    renderPage();

    expect(
      await screen.findByRole('heading', { name: /engine log/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/usage/i)).toBeInTheDocument();
    expect(screen.getByText(/nexus\.log/i)).toBeInTheDocument();
    expect(screen.getByText('✓ greenhouse searched')).toBeInTheDocument();
    expect(screen.getByText('2 lines')).toBeInTheDocument();
  });

  it('refetches with the filter as the user types', async () => {
    const getLogs = vi.spyOn(api, 'getLogs').mockResolvedValue({
      lines: ['  ✓ greenhouse searched'],
      filter: '',
    });
    vi.spyOn(api, 'getUsage').mockResolvedValue(usage);

    renderPage();

    const input = await screen.findByPlaceholderText(/filter lines/i);
    fireEvent.change(input, { target: { value: 'greenhouse' } });

    await waitFor(() => expect(getLogs).toHaveBeenCalledWith('greenhouse'));
  });

  it('clears the log buffer', async () => {
    vi.spyOn(api, 'getLogs').mockResolvedValue({
      lines: ['a line'],
      filter: '',
    });
    vi.spyOn(api, 'getUsage').mockResolvedValue(usage);
    const clearLogs = vi.spyOn(api, 'clearLogs').mockResolvedValue(undefined);

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /clear/i }));
    await waitFor(() => expect(clearLogs).toHaveBeenCalled());
  });
});
