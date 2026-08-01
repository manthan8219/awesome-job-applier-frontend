import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import JobNewPage from './JobNewPage';
import { api } from '@/lib/api';
import { makeApp } from '@/test/fixtures';

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPage() {
  return render(
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter initialEntries={['/jobs/new']}>
        <Routes>
          <Route path="/jobs/new" element={<JobNewPage />} />
          <Route path="/jobs" element={<div>JOBS_LIST</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('JobNewPage', () => {
  it('renders the add-a-job form', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { name: /add a job/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /role title/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /company/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /job posting url/i }),
    ).toBeInTheDocument();
  });

  it('keeps submit disabled until the required fields are filled', async () => {
    renderPage();

    const submit = screen.getByRole('button', { name: /add to review queue/i });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByRole('textbox', { name: /role title/i }), {
      target: { value: 'Cardiologist' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /company/i }), {
      target: { value: 'Acme Health' },
    });
    expect(submit).toBeDisabled();

    fireEvent.change(
      screen.getByRole('textbox', { name: /job posting url/i }),
      { target: { value: 'https://acme.health/careers/cardio' } },
    );
    expect(submit).toBeEnabled();
  });

  it('creates the job and navigates back to the jobs list', async () => {
    const create = vi
      .spyOn(api, 'createApplication')
      .mockResolvedValue(
        makeApp({ role: 'Cardiologist', company: 'Acme Health' }),
      );

    renderPage();

    fireEvent.change(
      await screen.findByRole('textbox', { name: /role title/i }),
      { target: { value: 'Cardiologist' } },
    );
    fireEvent.change(screen.getByRole('textbox', { name: /company/i }), {
      target: { value: 'Acme Health' },
    });
    fireEvent.change(
      screen.getByRole('textbox', { name: /job posting url/i }),
      { target: { value: 'https://acme.health/careers/cardio' } },
    );
    fireEvent.click(
      screen.getByRole('button', { name: /add to review queue/i }),
    );

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'Cardiologist',
          company: 'Acme Health',
          url: 'https://acme.health/careers/cardio',
          location: '',
          remote: true,
        }),
      ),
    );
    expect(await screen.findByText('JOBS_LIST')).toBeInTheDocument();
  });
});
