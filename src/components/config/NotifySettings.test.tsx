import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NotifySettings } from './NotifySettings';
import { ApiError, api } from '@/lib/api';
import type { NotifyChannel, NotifyTestResult } from '@/types/notifications';

const channels: NotifyChannel[] = [
  { id: 'discord', name: 'Discord', enabled: true },
  { id: 'telegram', name: 'Telegram', enabled: true },
  { id: 'email', name: 'Email', enabled: false },
];

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderSettings() {
  return render(
    <QueryClientProvider client={makeClient()}>
      <NotifySettings />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('NotifySettings', () => {
  it('lists the configured channels as friendly badges', async () => {
    vi.spyOn(api, 'getNotifyChannels').mockResolvedValue(channels);

    renderSettings();

    expect(await screen.findByText('Discord')).toBeInTheDocument();
    expect(screen.getByText('Telegram')).toBeInTheDocument();
    // Disabled channels are not "configured" → not listed.
    expect(screen.queryByText('Email')).not.toBeInTheDocument();
  });

  it('shows the empty state when no channels are configured', async () => {
    vi.spyOn(api, 'getNotifyChannels').mockResolvedValue([
      { id: 'discord', name: 'Discord', enabled: false },
      { id: 'telegram', name: 'Telegram', enabled: false },
      { id: 'email', name: 'Email', enabled: false },
    ]);

    renderSettings();

    expect(
      await screen.findByText(/no notification channels configured/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /add discord webhook, telegram bot, or gmail app password/i,
      ),
    ).toBeInTheDocument();
    const button = screen.getByRole('button', {
      name: /send test notification/i,
    });
    expect(button).toBeDisabled();
  });

  it('reports "Sent to N channel(s)" after a successful test', async () => {
    vi.spyOn(api, 'getNotifyChannels').mockResolvedValue(channels);
    const testNotification = vi
      .spyOn(api, 'testNotification')
      .mockResolvedValue({ sent: 2 });

    renderSettings();

    const button = await screen.findByRole('button', {
      name: /send test notification/i,
    });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);

    expect(await screen.findByText(/sent to 2 channel/i)).toBeInTheDocument();
    expect(testNotification).toHaveBeenCalledTimes(1);
  });

  it('disables the button while the test request is pending', async () => {
    vi.spyOn(api, 'getNotifyChannels').mockResolvedValue(channels);
    let resolveTest!: (v: NotifyTestResult) => void;
    vi.spyOn(api, 'testNotification').mockReturnValue(
      new Promise<NotifyTestResult>((resolve) => {
        resolveTest = resolve;
      }),
    );

    renderSettings();

    const button = await screen.findByRole('button', {
      name: /send test notification/i,
    });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);
    await waitFor(() => expect(button).toBeDisabled());

    resolveTest({ sent: 2 });
    await waitFor(() =>
      expect(screen.getByText(/sent to 2 channel/i)).toBeInTheDocument(),
    );
  });

  it('shows the backend error message inline when the test fails', async () => {
    vi.spyOn(api, 'getNotifyChannels').mockResolvedValue(channels);
    vi.spyOn(api, 'testNotification').mockRejectedValue(
      new ApiError(400, 'no notification channels configured'),
    );

    renderSettings();

    const button = await screen.findByRole('button', {
      name: /send test notification/i,
    });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);

    expect(
      await screen.findByText('no notification channels configured'),
    ).toBeInTheDocument();
  });

  it('sends a run-summary digest and reports the channel count', async () => {
    vi.spyOn(api, 'getNotifyChannels').mockResolvedValue(channels);
    const sendSummary = vi
      .spyOn(api, 'sendNotifySummary')
      .mockResolvedValue({ sent: 2 });

    renderSettings();

    const button = await screen.findByRole('button', {
      name: /send run summary/i,
    });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);

    expect(await screen.findByText(/digest sent to 2 channel/i)).toBeInTheDocument();
    expect(sendSummary).toHaveBeenCalledTimes(1);
  });

  it('disables the run-summary button when no channels are enabled', async () => {
    vi.spyOn(api, 'getNotifyChannels').mockResolvedValue([
      { id: 'discord', name: 'Discord', enabled: false },
    ]);

    renderSettings();

    const button = await screen.findByRole('button', {
      name: /send run summary/i,
    });
    expect(button).toBeDisabled();
  });
});
