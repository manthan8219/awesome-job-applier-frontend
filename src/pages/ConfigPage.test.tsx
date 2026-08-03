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

  it('renders and persists every OpenAI-compatible API key field', async () => {
    vi.spyOn(api, 'getConfig').mockResolvedValue(
      makeConfig({ aiAssist: true, aiProvider: 'api' }),
    );
    const saveConfig = vi
      .spyOn(api, 'saveConfig')
      .mockResolvedValue(makeConfig({ aiAssist: true, aiProvider: 'api' }));

    renderPage();

    // All provider keys render when AI Assist is on with API backend.
    const google = await screen.findByLabelText(/google api key/i);
    expect(google.tagName).toBe('INPUT');
    for (const label of [
      /deepseek api key/i,
      /groq api key/i,
      /mistral api key/i,
      /together ai api key/i,
      /openrouter api key/i,
      /xai api key/i,
    ]) {
      expect(screen.getByLabelText(label).tagName).toBe('INPUT');
    }

    // A Google key edit round-trips through the save payload.
    fireEvent.change(google, { target: { value: 'AIza-test' } });
    await waitFor(() =>
      expect(saveConfig).toHaveBeenCalledWith(
        expect.objectContaining({ googleKey: 'AIza-test' }),
      ),
    );
  });

  it('loads provider models when a key is set and persists the selected model', async () => {
    vi.spyOn(api, 'getConfig').mockResolvedValue(makeConfig({
      aiAssist: true,
      aiProvider: 'api',
      googleKey: 'AIza-test',
    }));
    const saveConfig = vi
      .spyOn(api, 'saveConfig')
      .mockResolvedValue(makeConfig({ aiAssist: true, aiProvider: 'api' }));
    vi.spyOn(api, 'getAIModels').mockResolvedValue({
      provider: 'google',
      models: ['gemini-2.5-flash', 'gemini-2.5-pro'],
    });

    renderPage();

    // The Google model picker gets enabled once the config loads and the
    // models fetch resolves — re-query each poll because the input element is
    // replaced across loading states.
    await waitFor(
      () =>
        expect(
          screen.getByRole('combobox', { name: /google model/i }),
        ).not.toBeDisabled(),
      { timeout: 3000 },
    );
    const picker = screen.getByRole('combobox', { name: /google model/i });
    expect(picker.tagName).toBe('INPUT');

    // Open the combobox and pick a model from the themed dropdown.
    fireEvent.focus(picker);
    fireEvent.click(await screen.findByRole('option', { name: 'gemini-2.5-pro' }));
    await waitFor(
      () =>
        expect(saveConfig).toHaveBeenCalledWith(
          expect.objectContaining({ googleModel: 'gemini-2.5-pro' }),
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
