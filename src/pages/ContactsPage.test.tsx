import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ContactsPage from './ContactsPage';
import { api } from '@/lib/api';
import type { OsintContact } from '@/types/contacts';

const contact: OsintContact = {
  id: 1,
  company: 'Stripe',
  domain: 'stripe.com',
  name: 'Sarah Chen',
  title: 'Senior Recruiter',
  email: 'sarah@stripe.com',
  emailType: 'work',
  linkedIn: 'linkedin.com/in/sarahchen',
  source: 'hunter',
  confidence: 92,
  foundAt: new Date().toISOString(),
  notes: 'responsive',
};

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPage() {
  return render(
    <QueryClientProvider client={makeClient()}>
      <ContactsPage />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ContactsPage', () => {
  it('renders the contact finder and searches by company', async () => {
    vi.spyOn(api, 'getSavedContacts').mockResolvedValue([]);
    const searchContacts = vi.spyOn(api, 'searchContacts').mockResolvedValue({
      contacts: [contact],
      sources: ['hunter'],
      errors: [],
    });

    renderPage();

    expect(
      await screen.findByRole('heading', { name: /hr contact finder/i }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/linear, vercel, stripe/i), {
      target: { value: 'Stripe' },
    });
    fireEvent.click(screen.getByRole('button', { name: /search contacts/i }));

    await waitFor(() =>
      expect(searchContacts).toHaveBeenCalledWith('Stripe', ''),
    );
    expect(await screen.findByText(/sarah chen/i)).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
  });

  it('saves a found contact', async () => {
    vi.spyOn(api, 'getSavedContacts').mockResolvedValue([]);
    vi.spyOn(api, 'searchContacts').mockResolvedValue({
      contacts: [contact],
      sources: ['hunter'],
      errors: [],
    });
    const saveContact = vi.spyOn(api, 'saveContact').mockResolvedValue(contact);

    renderPage();

    fireEvent.change(
      await screen.findByPlaceholderText(/linear, vercel, stripe/i),
      { target: { value: 'Stripe' } },
    );
    fireEvent.click(screen.getByRole('button', { name: /search contacts/i }));

    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(saveContact).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'sarah@stripe.com' }),
      ),
    );
  });

  it('shows the saved tab with saved contacts', async () => {
    vi.spyOn(api, 'getSavedContacts').mockResolvedValue([contact]);

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /saved/i }));

    expect(await screen.findByText(/sarah chen/i)).toBeInTheDocument();
    expect(screen.getByText('sarah@stripe.com')).toBeInTheDocument();
  });

  it('shows the empty state when no contacts are found', async () => {
    vi.spyOn(api, 'getSavedContacts').mockResolvedValue([]);
    vi.spyOn(api, 'searchContacts').mockResolvedValue({
      contacts: [],
      sources: [],
      errors: [],
    });

    renderPage();

    fireEvent.change(
      await screen.findByPlaceholderText(/linear, vercel, stripe/i),
      { target: { value: 'Stripe' } },
    );
    fireEvent.click(screen.getByRole('button', { name: /search contacts/i }));

    expect(await screen.findByText(/no contacts found/i)).toBeInTheDocument();
  });

  it('marks the active tab with aria-pressed', async () => {
    vi.spyOn(api, 'getSavedContacts').mockResolvedValue([]);

    renderPage();

    const searchTab = await screen.findByRole('button', { name: /^search$/i });
    expect(searchTab).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /^saved$/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
