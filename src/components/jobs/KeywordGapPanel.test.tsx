import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KeywordGapPanel } from './KeywordGapPanel';
import { api } from '@/lib/api';

const DESCRIPTION =
  'We are hiring a Go engineer. Kafka, SQL and AWS are a plus. Go experience is essential.';

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPanel(description = DESCRIPTION) {
  return render(
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter>
        <KeywordGapPanel description={description} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('KeywordGapPanel', () => {
  it('renders matched and missing counts from the resume skill list', async () => {
    vi.spyOn(api, 'getResumeSkills').mockResolvedValue(['Go', 'AWS']);
    renderPanel();

    expect(
      await screen.findByRole('heading', { name: /keyword gap/i }),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/2 matched · 7 missing/i)).toBeInTheDocument());

    // "go" and "aws" are covered by the skill list.
    expect(screen.getByText('go')).toBeInTheDocument();
    expect(screen.getByText('aws')).toBeInTheDocument();
    // kafka and sql are missing; the chips carry an add button.
    expect(screen.getByRole('button', { name: /add kafka to skills/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add sql to skills/i })).toBeInTheDocument();
  });

  it('adds a missing keyword to the resume skills in one click', async () => {
    vi.spyOn(api, 'getResumeSkills').mockResolvedValue(['Go']);
    const save = vi.spyOn(api, 'saveResumeSkills').mockResolvedValue(['Go', 'kafka']);
    renderPanel();

    const addKafka = await screen.findByRole('button', {
      name: /add kafka to skills/i,
    });
    fireEvent.click(addKafka);

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(expect.arrayContaining(['kafka'])),
    );
  });

  it('does not add a skill that is already present', async () => {
    vi.spyOn(api, 'getResumeSkills').mockResolvedValue(['Go']);
    const save = vi.spyOn(api, 'saveResumeSkills').mockResolvedValue(['Go']);
    renderPanel();

    // Wait for the loaded state ("go" is a matched chip), then assert there is
    // no add button for it.
    await screen.findByText('go');
    expect(
      screen.queryByRole('button', { name: /add go to skills/i }),
    ).not.toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
  });

  it('shows an empty state when there is no description', async () => {
    vi.spyOn(api, 'getResumeSkills').mockResolvedValue([]);
    renderPanel('');

    expect(
      await screen.findByText(/no description to analyze/i),
    ).toBeInTheDocument();
  });

  it('shows an honest error when skills cannot be loaded', async () => {
    vi.spyOn(api, 'getResumeSkills').mockRejectedValue(
      new Error('backend down'),
    );
    renderPanel();

    expect(await screen.findByText(/could not load resume skills/i)).toBeInTheDocument();
    expect(screen.getByText(/backend down/i)).toBeInTheDocument();
  });
});
