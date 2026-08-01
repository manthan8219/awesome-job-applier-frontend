import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ImproveTab } from './ImproveTab';
import { api } from '@/lib/api';
import { makeConfig } from '@/test/fixtures';
import type { ImproveOutput, WorkProject } from '@/types/resume';

const project: WorkProject = {
  id: 'p1',
  name: 'Payments API',
  repo: 'github.com/acme/payments-api',
  period: '2024 – Present',
  role: 'Senior Backend Engineer',
  summary: '- Reduced p99 latency from 1200ms to 180ms',
};

const validOutput: ImproveOutput = {
  previewMD: '# Ada Lovelace\n\n## Summary\nShipped 3 payment systems.',
  dir: '~/.nexus/resumes/ada-senior-backend',
  review: { summary: 'Strong resume with clear impact metrics', atsScore: 87, qualityScore: 82 },
};

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderTab() {
  return render(
    <QueryClientProvider client={makeClient()}>
      <ImproveTab />
    </QueryClientProvider>,
  );
}

async function enableAndClickGenerate() {
  const button = await screen.findByRole('button', { name: /generate resume/i });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ImproveTab', () => {
  it('renders the assessor verdict and preview for a valid response', async () => {
    vi.spyOn(api, 'getConfig').mockResolvedValue(
      makeConfig({ aiAssist: true, resumePath: '~/.nexus/resumes/ada.pdf' }),
    );
    vi.spyOn(api, 'getResumeProjects').mockResolvedValue([project]);
    vi.spyOn(api, 'improveResume').mockResolvedValue(validOutput);

    renderTab();

    await enableAndClickGenerate();

    expect(await screen.findByText(/assessor verdict/i)).toBeInTheDocument();
    expect(screen.getByText('87/100')).toBeInTheDocument();
    expect(screen.getByText(/shipped 3 payment systems/i)).toBeInTheDocument();
    expect(
      screen.getByText(/strong resume with clear impact metrics/i),
    ).toBeInTheDocument();
  });

  it('does not crash when the backend returns an incomplete shape', async () => {
    vi.spyOn(api, 'getConfig').mockResolvedValue(
      makeConfig({ aiAssist: true, resumePath: '~/.nexus/resumes/ada.pdf' }),
    );
    vi.spyOn(api, 'getResumeProjects').mockResolvedValue([project]);
    // The current backend /resume/improve handler returns this stub shape.
    vi.spyOn(api, 'improveResume').mockResolvedValue({
      analysis: null,
      formats: [],
      pdfNote: null,
    } as unknown as ImproveOutput);

    renderTab();

    await enableAndClickGenerate();

    expect(
      await screen.findByText(/incomplete response/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/assessor verdict/i)).not.toBeInTheDocument();
  });

  it('keeps the generate button disabled until prerequisites are met', async () => {
    vi.spyOn(api, 'getConfig').mockResolvedValue(
      makeConfig({ aiAssist: false, resumePath: '' }),
    );
    vi.spyOn(api, 'getResumeProjects').mockResolvedValue([]);

    renderTab();

    const button = await screen.findByRole('button', { name: /generate resume/i });
    expect(button).toBeDisabled();
    expect(screen.getByText(/ai assist on/i)).toBeInTheDocument();
    expect(screen.getByText(/resume path set in config/i)).toBeInTheDocument();
  });
});
