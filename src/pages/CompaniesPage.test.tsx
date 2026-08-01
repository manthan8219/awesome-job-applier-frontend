import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CompaniesPage from './CompaniesPage';
import { api } from '@/lib/api';
import type { Company } from '@/types/companies';

const company: Company = {
  id: 1,
  name: 'Acme Health',
  website: 'https://acme.health',
  ats: 'greenhouse',
  board: 'acmehealth',
  boardURL: 'https://boards.greenhouse.io/acmehealth',
  hireCountries: ['Remote'],
  hqCountry: '—',
  kind: 'startup',
  industry: 'Healthcare',
  source: 'manual',
  updatedAt: new Date().toISOString(),
};

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPage() {
  return render(
    <QueryClientProvider client={makeClient()}>
      <CompaniesPage />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CompaniesPage', () => {
  it('renders the company index with an empty state', async () => {
    vi.spyOn(api, 'getCompanies').mockResolvedValue({
      items: [],
      total: 0,
      counts: {},
    });

    renderPage();

    expect(
      await screen.findByRole('heading', { name: /company index/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/no companies/i)).toBeInTheDocument();
  });

  it('adds a company through the form', async () => {
    vi.spyOn(api, 'getCompanies').mockResolvedValue({
      items: [],
      total: 0,
      counts: {},
    });
    const saveCompany = vi.spyOn(api, 'saveCompany').mockResolvedValue(company);

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /^add$/i }));

    fireEvent.change(screen.getByRole('textbox', { name: /company name/i }), {
      target: { value: 'Acme Health' },
    });
    fireEvent.change(
      screen.getByRole('textbox', { name: /ats \/ careers url/i }),
      { target: { value: 'https://boards.greenhouse.io/acmehealth' } },
    );
    fireEvent.click(screen.getByRole('button', { name: /add company/i }));

    await waitFor(() =>
      expect(saveCompany).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Acme Health',
          boardURL: 'https://boards.greenhouse.io/acmehealth',
        }),
      ),
    );
  });

  it('refreshes companies from the network', async () => {
    vi.spyOn(api, 'getCompanies').mockResolvedValue({
      items: [],
      total: 0,
      counts: {},
    });
    const refreshCompanies = vi
      .spyOn(api, 'refreshCompanies')
      .mockResolvedValue(3);

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /refresh/i }));
    await waitFor(() => expect(refreshCompanies).toHaveBeenCalled());
    expect(
      await screen.findByText(/3 companies upserted from network/i),
    ).toBeInTheDocument();
  });
});
