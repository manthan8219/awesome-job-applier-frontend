import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OnboardingGate from './OnboardingGate';
import { api } from '@/lib/api';
import { emptyProfile } from '@/lib/onboarding';
import type { NexusConfig } from '@/types';

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderGate() {
  const client = makeClient();
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/onboarding" element={<div>WIZARD</div>} />
          <Route element={<OnboardingGate />}>
            <Route path="/" element={<div>HOME</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('OnboardingGate', () => {
  it('redirects to the wizard for a fresh config', async () => {
    vi.spyOn(api, 'getConfig').mockResolvedValue(emptyProfile());
    renderGate();
    expect(await screen.findByText('WIZARD')).toBeInTheDocument();
  });

  it('lets an onboarded user through to the app', async () => {
    const cfg: NexusConfig = {
      ...emptyProfile(),
      targetJobTitles: 'Backend Engineer',
    };
    vi.spyOn(api, 'getConfig').mockResolvedValue(cfg);
    renderGate();
    expect(await screen.findByText('HOME')).toBeInTheDocument();
  });

  it('does not crash when the backend omits empty fields (jobIntent undefined)', async () => {
    // Mirrors the real API: empty fields with json omitempty are absent.
    vi.spyOn(api, 'getConfig').mockResolvedValue({
      ...emptyProfile(),
      jobIntent: undefined,
    } as NexusConfig);
    renderGate();
    expect(await screen.findByText('WIZARD')).toBeInTheDocument();
  });
});
