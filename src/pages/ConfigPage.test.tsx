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
      'Tailoring',
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

  it('associates field labels with their inputs (a11y)', async () => {
    vi.spyOn(api, 'getConfig').mockResolvedValue(makeConfig());
    vi.spyOn(api, 'saveConfig').mockResolvedValue(makeConfig());

    renderPage();

    // Previously these labels were not linked to their inputs, so the
    // accessible name was missing. Now getByLabelText resolves the input.
    const firstName = await screen.findByLabelText(/first name/i);
    expect(firstName.tagName).toBe('INPUT');
    const email = screen.getByLabelText(/^email$/i);
    expect(email.tagName).toBe('INPUT');
    const targetTitles = screen.getByLabelText(/target job titles/i);
    expect(targetTitles.tagName).toBe('INPUT');
  });

  it('renders toggles as switches with aria-checked (a11y)', async () => {
    vi.spyOn(api, 'getConfig').mockResolvedValue(makeConfig());
    vi.spyOn(api, 'saveConfig').mockResolvedValue(makeConfig());

    renderPage();

    const dailyRun = await screen.findByRole('switch', {
      name: /run a daily dry-run search/i,
    });
    expect(dailyRun).toHaveAttribute('aria-checked', 'false');
  });

  it('persists the tailoring knobs through a save round-trip', async () => {
    vi.spyOn(api, 'getConfig').mockResolvedValue(makeConfig());
    const saveConfig = vi
      .spyOn(api, 'saveConfig')
      .mockResolvedValue(makeConfig({ tailorPerJob: true, tailorMaxRounds: 5 }));

    renderPage();

    const tailor = await screen.findByRole('switch', {
      name: /auto-tailor each high-fit application/i,
    });
    expect(tailor).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(tailor);
    const rounds = await screen.findByLabelText(/max tailoring rounds/i);
    fireEvent.change(rounds, { target: { value: '5' } });

    fireEvent.click(await screen.findByRole('button', { name: /save now/i }));
    await waitFor(() =>
      expect(saveConfig).toHaveBeenCalledWith(
        expect.objectContaining({ tailorPerJob: true, tailorMaxRounds: 5 }),
      ),
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
