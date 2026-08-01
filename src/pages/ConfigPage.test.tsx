import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ConfigPage from './ConfigPage';
import { api } from '@/lib/api';
import { makeConfig } from '@/test/fixtures';

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPage() {
  return render(
    <QueryClientProvider client={makeClient()}>
      <ConfigPage />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ConfigPage', () => {
  it('renders all settings sections after loading the config', async () => {
    vi.spyOn(api, 'getConfig').mockResolvedValue(makeConfig());
    vi.spyOn(api, 'saveConfig').mockResolvedValue(makeConfig());

    renderPage();

    expect(
      await screen.findByRole('heading', { name: /all settings/i }),
    ).toBeInTheDocument();
    for (const heading of [
      'Personal Information',
      'Job Preferences',
      'Provider Keys',
      'AI Configuration',
      'Apply Safety',
      'Outreach',
      'Integrations',
      'Career Scraper',
      'Schedule & Notifications',
    ]) {
      expect(screen.getByText(heading)).toBeInTheDocument();
    }
  });

  it('auto-saves a field edit after the debounce', async () => {
    vi.spyOn(api, 'getConfig').mockResolvedValue(makeConfig());
    const saveConfig = vi
      .spyOn(api, 'saveConfig')
      .mockResolvedValue(
        makeConfig({
          discordWebhookURL: 'https://discord.com/api/webhooks/test',
        }),
      );

    renderPage();

    const discord = await screen.findByPlaceholderText(
      /discord\.com\/api\/webhooks/i,
    );
    fireEvent.change(discord, {
      target: { value: 'https://discord.com/api/webhooks/test' },
    });

    await waitFor(
      () =>
        expect(saveConfig).toHaveBeenCalledWith(
          expect.objectContaining({
            discordWebhookURL: 'https://discord.com/api/webhooks/test',
          }),
        ),
      { timeout: 2000 },
    );
  });

  it('saves on the Save now button and shows the success indicator', async () => {
    vi.spyOn(api, 'getConfig').mockResolvedValue(makeConfig());
    const saveConfig = vi
      .spyOn(api, 'saveConfig')
      .mockResolvedValue(makeConfig());

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /save now/i }));
    await waitFor(() => expect(saveConfig).toHaveBeenCalled());
    expect(await screen.findByText(/auto-saved/i)).toBeInTheDocument();
  });
});
