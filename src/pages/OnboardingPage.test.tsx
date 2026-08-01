import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OnboardingPage from './OnboardingPage';
import { api } from '@/lib/api';
import { emptyProfile } from '@/lib/onboarding';

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPage() {
  const client = makeClient();
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/onboarding']}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/dashboard" element={<div>DASH</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('OnboardingPage', () => {
  it('generates editable title chips from one aspiration sentence', async () => {
    vi.spyOn(api, 'getConfig').mockResolvedValue(emptyProfile());
    vi.spyOn(api, 'suggestJobTitles').mockResolvedValue({
      titles: ['Senior Go Engineer', 'Platform Engineer'],
      intent: 'Senior Go Engineer, remote',
    });

    renderPage();

    const input = await screen.findByLabelText(/what job do you want/i);
    fireEvent.change(input, {
      target: { value: 'Senior Go Engineer, remote' },
    });
    fireEvent.click(screen.getByRole('button', { name: /find my roles/i }));

    expect(await screen.findByText('Senior Go Engineer')).toBeInTheDocument();
    expect(screen.getByText('Platform Engineer')).toBeInTheDocument();
    expect(
      screen.getByText(/detected: engineering/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /show me jobs/i }),
    ).toBeInTheDocument();
  });

  it('surfaces an honest error when AI title suggestions are unavailable', async () => {
    vi.spyOn(api, 'getConfig').mockResolvedValue(emptyProfile());
    vi.spyOn(api, 'suggestJobTitles').mockRejectedValue(
      new Error('AI Assist off'),
    );

    renderPage();

    const input = await screen.findByLabelText(/what job do you want/i);
    fireEvent.change(input, {
      target: { value: 'Senior Go Engineer, remote' },
    });
    fireEvent.click(screen.getByRole('button', { name: /find my roles/i }));

    // No fabricated titles — the failure is surfaced and the profile step opens
    // so the user can enter target roles manually.
    expect(
      await screen.findByText(/could not load ai title suggestions/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/does this look right/i)).toBeInTheDocument();
    expect(screen.queryByText('Senior Go Engineer')).not.toBeInTheDocument();
  });

  it('saves the profile and starts a safe dry run on Show me jobs', async () => {
    vi.spyOn(api, 'getConfig').mockResolvedValue(emptyProfile());
    vi.spyOn(api, 'suggestJobTitles').mockResolvedValue({
      titles: ['Go Engineer'],
      intent: 'Go Engineer',
    });
    const saveConfig = vi
      .spyOn(api, 'saveConfig')
      .mockResolvedValue(emptyProfile());
    const startRun = vi.spyOn(api, 'startRun').mockResolvedValue(undefined);

    renderPage();

    const input = await screen.findByLabelText(/what job do you want/i);
    fireEvent.change(input, { target: { value: 'Go Engineer' } });
    fireEvent.click(screen.getByRole('button', { name: /find my roles/i }));

    await screen.findByText('Go Engineer');
    fireEvent.click(screen.getByRole('button', { name: /show me jobs/i }));

    expect(
      await screen.findByText('DASH', undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(saveConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        targetJobTitles: 'Go Engineer',
        workType: 'Remote',
      }),
    );
    expect(startRun).toHaveBeenCalledWith({ dryRun: true, autoApply: false });
  });

  it('shows live suggestions while typing (no click needed)', async () => {
    vi.spyOn(api, 'getConfig').mockResolvedValue(emptyProfile());
    vi.spyOn(api, 'suggestJobTitles').mockResolvedValue({
      titles: ['Senior Go Engineer'],
      intent: 'Senior Go Engineer, remote',
    });

    renderPage();

    const input = await screen.findByLabelText(/what job do you want/i);
    fireEvent.change(input, {
      target: { value: 'Senior Go Engineer, remote' },
    });

    // The chip appears from typing alone — no button press.
    expect(await screen.findByText('Senior Go Engineer')).toBeInTheDocument();
  });

  it('offers to enable AI Assist and saves the installed local model', async () => {
    vi.spyOn(api, 'getConfig').mockResolvedValue(emptyProfile());
    vi.spyOn(api, 'suggestJobTitles').mockRejectedValue(
      new Error('AI Assist off'),
    );
    vi.spyOn(api, 'getLLMStatus').mockResolvedValue({
      reachable: true,
      installed: ['llama3.2:latest', 'llama3.1:latest'],
      machine: { ramGb: 16, cpu: 'Apple M4', goos: 'darwin', goarch: 'arm64' },
      models: [
        {
          name: 'llama3.2:latest',
          displayName: 'Llama 3.2',
          minRamGb: 10,
          fits: true,
          installed: true,
          best: true,
          notes: '',
        },
      ],
    } as Awaited<ReturnType<typeof api.getLLMStatus>>);
    const saveConfig = vi
      .spyOn(api, 'saveConfig')
      .mockResolvedValue(emptyProfile());

    renderPage();

    const input = await screen.findByLabelText(/what job do you want/i);
    fireEvent.change(input, { target: { value: 'Go Engineer' } });

    const enable = await screen.findByRole('button', {
      name: /enable ai assist/i,
    });
    fireEvent.click(enable);

    await waitFor(() => {
      expect(saveConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          aiAssist: true,
          aiProvider: 'local',
          localLLMModel: 'llama3.2:latest',
        }),
      );
    });
  });

  it('shows location autocomplete suggestions in the profile step', async () => {
    vi.spyOn(api, 'getConfig').mockResolvedValue(emptyProfile());
    vi.spyOn(api, 'suggestJobTitles').mockResolvedValue({
      titles: ['Go Engineer'],
      intent: 'Go Engineer',
    });
    vi.spyOn(api, 'geoSearch').mockResolvedValue([
      { label: 'Berlin, Germany', country: 'Germany', iso2: 'DE' },
    ]);

    renderPage();

    const input = await screen.findByLabelText(/what job do you want/i);
    fireEvent.change(input, { target: { value: 'Go Engineer' } });
    fireEvent.click(screen.getByRole('button', { name: /find my roles/i }));

    const locInput = await screen.findByPlaceholderText(
      /Berlin, Germany — press Enter to add/i,
    );
    fireEvent.focus(locInput);
    fireEvent.change(locInput, { target: { value: 'Ber' } });

    // The geo dropdown appears as you type.
    expect(
      await screen.findByRole('button', { name: 'Berlin, Germany' }),
    ).toBeInTheDocument();
  });

  it('uploads a resume PDF and stores the returned path', async () => {
    vi.spyOn(api, 'getConfig').mockResolvedValue(emptyProfile());
    vi.spyOn(api, 'suggestJobTitles').mockResolvedValue({
      titles: ['Go Engineer'],
      intent: 'Go Engineer',
    });
    const uploadResume = vi.spyOn(api, 'uploadResume').mockResolvedValue({
      path: '/Users/me/.nexus/resumes/uploaded-resume.pdf',
      name: 'uploaded-resume.pdf',
    });

    const { container } = renderPage();

    const input = await screen.findByLabelText(/what job do you want/i);
    fireEvent.change(input, { target: { value: 'Go Engineer' } });
    fireEvent.click(screen.getByRole('button', { name: /find my roles/i }));

    await screen.findByText(/drop your pdf resume here/i);
    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(['%PDF-1.4'], 'resume.pdf', {
      type: 'application/pdf',
    });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(await screen.findByText(/uploaded-resume\.pdf/)).toBeInTheDocument();
    expect(uploadResume).toHaveBeenCalledWith(file);
  });

  it('supports the just-exploring path without AI suggestions', async () => {
    vi.spyOn(api, 'getConfig').mockResolvedValue(emptyProfile());
    const saveConfig = vi
      .spyOn(api, 'saveConfig')
      .mockResolvedValue(emptyProfile());

    renderPage();

    await screen.findByLabelText(/what job do you want/i);
    fireEvent.click(screen.getByRole('button', { name: /just exploring/i }));

    expect(
      await screen.findByText(/does this look right/i),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: /skip — go to the dashboard/i }),
    );

    expect(
      await screen.findByText('DASH', undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(saveConfig).toHaveBeenCalledWith(
      expect.objectContaining({ jobIntent: 'exploring' }),
    );
  });

  it('collects name, email, and apply consent into the saved profile', async () => {
    vi.spyOn(api, 'getConfig').mockResolvedValue(emptyProfile());
    vi.spyOn(api, 'suggestJobTitles').mockResolvedValue({
      titles: ['Go Engineer'],
      intent: 'Go Engineer',
    });
    const saveConfig = vi
      .spyOn(api, 'saveConfig')
      .mockResolvedValue(emptyProfile());
    vi.spyOn(api, 'startRun').mockResolvedValue(undefined);

    renderPage();

    const input = await screen.findByLabelText(/what job do you want/i);
    fireEvent.change(input, { target: { value: 'Go Engineer' } });
    fireEvent.click(screen.getByRole('button', { name: /find my roles/i }));

    // The profile step now collects personal details + explicit consent.
    const first = await screen.findByLabelText(/first name/i);
    fireEvent.change(first, { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'Lovelace' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.click(
      screen.getByRole('checkbox', { name: /i consent to nexus/i }),
    );

    fireEvent.click(screen.getByRole('button', { name: /show me jobs/i }));

    await waitFor(() => {
      expect(saveConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Ada',
          lastName: 'Lovelace',
          email: 'ada@example.com',
          applyConsent: true,
        }),
      );
    });
  });
});
