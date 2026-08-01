import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OutreachPage from './OutreachPage';
import { api } from '@/lib/api';
import type { OutreachSetup } from '@/types/outreach';

const setup: OutreachSetup = {
  consent: false,
  mode: 'confirm',
  maxEmailsPerDay: 10,
  maxLinkedInPerDay: 5,
  aiCompose: false,
  aiReview: false,
};

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPage() {
  return render(
    <QueryClientProvider client={makeClient()}>
      <OutreachPage />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('OutreachPage', () => {
  it('renders the setup tab by default', async () => {
    vi.spyOn(api, 'getOutreachSetup').mockResolvedValue(setup);
    vi.spyOn(api, 'getOutreachItems').mockResolvedValue([]);
    vi.spyOn(api, 'getOutreachLog').mockResolvedValue([]);

    renderPage();

    expect(
      await screen.findByRole('heading', { name: /recruiter outreach/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/opt in to outreach/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /save setup/i }),
    ).toBeInTheDocument();
  });

  it('shows the opt-in gate banner when consent is off and the Email tab is open', async () => {
    vi.spyOn(api, 'getOutreachSetup').mockResolvedValue(setup);
    vi.spyOn(api, 'getOutreachItems').mockResolvedValue([]);
    vi.spyOn(api, 'getOutreachLog').mockResolvedValue([]);

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /^email$/i }));
    expect(await screen.findByText(/outreach is opt-in/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /build email queue/i }),
    ).toBeInTheDocument();
  });

  it('saves the outreach setup', async () => {
    vi.spyOn(api, 'getOutreachSetup').mockResolvedValue(setup);
    vi.spyOn(api, 'getOutreachItems').mockResolvedValue([]);
    vi.spyOn(api, 'getOutreachLog').mockResolvedValue([]);
    const saveSetup = vi
      .spyOn(api, 'saveOutreachSetup')
      .mockResolvedValue(setup);

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /save setup/i }));
    await waitFor(() =>
      expect(saveSetup).toHaveBeenCalledWith(
        expect.objectContaining({ consent: false, mode: 'confirm' }),
      ),
    );
  });

  it('builds the email queue from applied jobs', async () => {
    vi.spyOn(api, 'getOutreachSetup').mockResolvedValue(setup);
    vi.spyOn(api, 'getOutreachItems').mockResolvedValue([]);
    vi.spyOn(api, 'getOutreachLog').mockResolvedValue([]);
    const build = vi.spyOn(api, 'buildOutreachQueue').mockResolvedValue([]);

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /^email$/i }));
    fireEvent.click(
      await screen.findByRole('button', { name: /build email queue/i }),
    );
    await waitFor(() => expect(build).toHaveBeenCalledWith('email'));
  });

  it('marks the active tab with aria-pressed', async () => {
    vi.spyOn(api, 'getOutreachSetup').mockResolvedValue(setup);
    vi.spyOn(api, 'getOutreachItems').mockResolvedValue([]);
    vi.spyOn(api, 'getOutreachLog').mockResolvedValue([]);

    renderPage();

    const setupTab = await screen.findByRole('button', { name: /^setup$/i });
    expect(setupTab).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /^email$/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
