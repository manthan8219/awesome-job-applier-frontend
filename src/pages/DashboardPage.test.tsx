import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from './DashboardPage';
import { api } from '@/lib/api';
import { makeApp, makeConfig, makeMission } from '@/test/fixtures';

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPage() {
  return render(
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DashboardPage', () => {
  it('renders mission control with stats, checklist, mode, providers, and feed', async () => {
    vi.spyOn(api, 'getMission').mockResolvedValue(makeMission());
    vi.spyOn(api, 'getApplications').mockResolvedValue([makeApp()]);
    vi.spyOn(api, 'getConfig').mockResolvedValue(makeConfig());

    renderPage();

    expect(
      await screen.findByRole('heading', {
        name: /your job-hunt command center/i,
      }),
    ).toBeInTheDocument();

    // TodayCard stats.
    expect(screen.getByText('Applied today')).toBeInTheDocument();
    expect(screen.getByText('Lifetime applied')).toBeInTheDocument();
    expect(screen.getByText('Skipped')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('0 / 25')).toBeInTheDocument();

    // Ready checklist labels + mode name + provider names + live/recent.
    expect(screen.getByText('Full name')).toBeInTheDocument();
    expect(screen.getByText('Queue only')).toBeInTheDocument();
    expect(screen.getByText('greenhouse')).toBeInTheDocument();
    expect(
      screen.getAllByText('Cardiologist @ Acme Health').length,
    ).toBeGreaterThan(0);
    expect(screen.getByText('Staff Engineer @ Medcorp')).toBeInTheDocument();
  });

  it('starts a queue-only search when Start is pressed', async () => {
    vi.spyOn(api, 'getMission').mockResolvedValue(makeMission());
    vi.spyOn(api, 'getApplications').mockResolvedValue([makeApp()]);
    vi.spyOn(api, 'getConfig').mockResolvedValue(makeConfig());
    const startRun = vi.spyOn(api, 'startRun').mockResolvedValue(undefined);

    renderPage();

    fireEvent.click(
      await screen.findByRole('button', { name: /start search/i }),
    );
    await waitFor(() =>
      expect(startRun).toHaveBeenCalledWith({
        dryRun: false,
        autoApply: false,
      }),
    );
  });

  it('toggles dry run from the Mode card', async () => {
    vi.spyOn(api, 'getMission').mockResolvedValue(makeMission());
    vi.spyOn(api, 'getApplications').mockResolvedValue([makeApp()]);
    vi.spyOn(api, 'getConfig').mockResolvedValue(makeConfig());
    const toggleDryRun = vi
      .spyOn(api, 'toggleDryRun')
      .mockResolvedValue(undefined);

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /dry run/i }));
    await waitFor(() => expect(toggleDryRun).toHaveBeenCalledWith(true));
  });

  it('toggles auto apply from the Mode card', async () => {
    vi.spyOn(api, 'getMission').mockResolvedValue(makeMission());
    vi.spyOn(api, 'getApplications').mockResolvedValue([makeApp()]);
    vi.spyOn(api, 'getConfig').mockResolvedValue(makeConfig());
    const toggleAutoApply = vi
      .spyOn(api, 'toggleAutoApply')
      .mockResolvedValue(undefined);

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /auto apply/i }));
    await waitFor(() => expect(toggleAutoApply).toHaveBeenCalledWith(true));
  });

  it('shows Stop engine while a run is active and stops it', async () => {
    vi.spyOn(api, 'getMission').mockResolvedValue(
      makeMission({ engineStatus: 'running' }),
    );
    vi.spyOn(api, 'getApplications').mockResolvedValue([makeApp()]);
    vi.spyOn(api, 'getConfig').mockResolvedValue(makeConfig());
    const stopRun = vi.spyOn(api, 'stopRun').mockResolvedValue(undefined);

    renderPage();

    fireEvent.click(
      await screen.findByRole('button', { name: /stop engine/i }),
    );
    await waitFor(() => expect(stopRun).toHaveBeenCalled());
  });

  it('flags stale applications and marks them ghosted', async () => {
    const staleDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
    vi.spyOn(api, 'getMission').mockResolvedValue(makeMission());
    vi.spyOn(api, 'getApplications').mockResolvedValue([
      makeApp({ id: 5, status: 'applied', appliedAt: staleDate.toISOString() }),
    ]);
    vi.spyOn(api, 'getConfig').mockResolvedValue(makeConfig());
    const setOutcome = vi
      .spyOn(api, 'setApplicationOutcome')
      .mockResolvedValue(
        makeApp({ id: 5, status: 'applied', outcome: 'ghosted' }),
      );

    renderPage();

    fireEvent.click(
      await screen.findByRole('button', { name: /mark as ghosted/i }),
    );
    await waitFor(() => expect(setOutcome).toHaveBeenCalledWith(5, 'ghosted'));
  });
});
