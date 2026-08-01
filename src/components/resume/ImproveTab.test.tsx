import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ImproveTab } from './ImproveTab';
import { api } from '@/lib/api';
import { makeConfig } from '@/test/fixtures';
import { RESUME_TEMPLATES } from '@/types/resume';
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

function mockTemplates() {
  vi.spyOn(api, 'getResumeTemplates').mockResolvedValue(RESUME_TEMPLATES);
}

async function enableAndClickGenerate() {
  const button = await screen.findByRole('button', { name: /generate resume/i });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
}

beforeEach(() => {
  // jsdom does not implement URL.createObjectURL — stub it so the inline PDF
  // preview ("Preview with my data") can render.
  Object.assign(URL, {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn(),
  });
});

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
    mockTemplates();

    renderTab();

    await enableAndClickGenerate();

    expect(await screen.findByText(/assessor verdict/i)).toBeInTheDocument();
    expect(screen.getByText('87/100')).toBeInTheDocument();
    expect(screen.getByText(/shipped 3 payment systems/i)).toBeInTheDocument();
    expect(
      screen.getByText(/strong resume with clear impact metrics/i),
    ).toBeInTheDocument();
  });

  it('shows the generated template name in the verdict', async () => {
    vi.spyOn(api, 'getConfig').mockResolvedValue(
      makeConfig({ aiAssist: true, resumePath: '~/.nexus/resumes/ada.pdf' }),
    );
    vi.spyOn(api, 'getResumeProjects').mockResolvedValue([project]);
    vi.spyOn(api, 'improveResume').mockResolvedValue({
      ...validOutput,
      templateId: 'modern',
      templateName: 'Modern',
    });
    mockTemplates();

    renderTab();

    await enableAndClickGenerate();

    expect(await screen.findByText(/template: modern/i)).toBeInTheDocument();
  });

  it('renders the fit report when the backend returns one', async () => {
    vi.spyOn(api, 'getConfig').mockResolvedValue(
      makeConfig({ aiAssist: true, resumePath: '~/.nexus/resumes/ada.pdf' }),
    );
    vi.spyOn(api, 'getResumeProjects').mockResolvedValue([project]);
    vi.spyOn(api, 'improveResume').mockResolvedValue({
      ...validOutput,
      fit: {
        templateId: 'compact',
        layout: 'single',
        plannedLines: 42,
        targetLines: 54,
        estimatedPages: 1,
        pages: 1,
        fitScore: 100,
        trimmedSections: ['each role capped at 3 bullets'],
        warnings: ['content was trimmed to fit the template'],
      },
    });
    mockTemplates();

    renderTab();

    await enableAndClickGenerate();

    expect(await screen.findByText(/fit report/i)).toBeInTheDocument();
    expect(screen.getByText('100/100')).toBeInTheDocument();
    expect(screen.getAllByText(/1 page/).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/trimmed to fit the template/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(/each role capped at 3 bullets/i),
    ).toBeInTheDocument();
  });

  it('shows each template content budget on its card', async () => {
    vi.spyOn(api, 'getConfig').mockResolvedValue(
      makeConfig({ aiAssist: true, resumePath: '~/.nexus/resumes/ada.pdf' }),
    );
    vi.spyOn(api, 'getResumeProjects').mockResolvedValue([project]);
    vi.spyOn(api, 'improveResume').mockResolvedValue(validOutput);
    mockTemplates();

    renderTab();

    // Classic et al cap at 5 roles; sidebar/split/minimal/dev cap at 4;
    // compact caps bullets at 3. The chips make the template's capacity legible.
    await waitFor(() =>
      expect(screen.getAllByText('≤5 roles').length).toBeGreaterThan(0),
    );
    expect(screen.getAllByText('≤4 roles').length).toBeGreaterThan(0);
    expect(screen.getAllByText('≤3 bullets').length).toBeGreaterThan(0);
  });

  it('shows an inline PDF pane for the generated resume and a markdown fallback', async () => {
    vi.spyOn(api, 'getConfig').mockResolvedValue(
      makeConfig({ aiAssist: true, resumePath: '~/.nexus/resumes/ada.pdf' }),
    );
    vi.spyOn(api, 'getResumeProjects').mockResolvedValue([project]);
    vi.spyOn(api, 'improveResume').mockResolvedValue({
      ...validOutput,
      pdfId: '20260101-120000',
    });
    mockTemplates();

    renderTab();
    await enableAndClickGenerate();

    // The inline PDF object points at the library PDF stream.
    const pdfObject = await screen.findByLabelText('Generated resume PDF');
    expect(pdfObject).toHaveAttribute(
      'data',
      expect.stringContaining('/resume/library/20260101-120000/pdf'),
    );
    expect(
      screen.getByRole('link', { name: /open pdf in a new tab/i }),
    ).toHaveAttribute(
      'href',
      expect.stringContaining('/resume/library/20260101-120000/pdf'),
    );

    // Flipping to Markdown reveals the editable source.
    fireEvent.click(screen.getByRole('button', { name: /^markdown$/i }));
    expect(screen.getByText(/shipped 3 payment systems/i)).toBeInTheDocument();
  });

  it('preview with my data posts the assembled resume and renders it inline', async () => {
    vi.spyOn(api, 'getConfig').mockResolvedValue(
      makeConfig({ aiAssist: true, resumePath: '~/.nexus/resumes/ada.pdf' }),
    );
    vi.spyOn(api, 'getResumeProjects').mockResolvedValue([project]);
    vi.spyOn(api, 'improveResume').mockResolvedValue(validOutput);
    vi.spyOn(api, 'getResumeAnalysis').mockResolvedValue({
      valid: true,
      fileType: 'pdf',
      message: 'ok',
      profile: {
        summary: 'Backend engineer with 6 years shipping Go services.',
        skills: ['Go', 'PostgreSQL'],
        suitableRoles: ['Senior Backend Engineer'],
      },
      contact: { firstName: 'Ada', lastName: 'Lovelace' },
    } as never);
    const preview = vi
      .spyOn(api, 'previewTemplateWithData')
      .mockResolvedValue(new Blob(['%PDF-fake'], { type: 'application/pdf' }));
    mockTemplates();

    renderTab();

    const button = await screen.findByRole('button', {
      name: /preview with my data/i,
    });
    // Enabled once the template registry resolves from the API.
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);

    await waitFor(() =>
      expect(preview).toHaveBeenCalledWith('classic', {
        fullName: 'Ada Lovelace',
        headline: 'Senior Backend Engineer',
        summary: 'Backend engineer with 6 years shipping Go services.',
        skills: ['Go', 'PostgreSQL'],
        experience: [
          {
            title: 'Senior Backend Engineer',
            org: 'Payments API',
            period: '2024 – Present',
            bullets: ['Reduced p99 latency from 1200ms to 180ms'],
          },
        ],
      }),
    );

    const previewObject = await screen.findByLabelText('Your resume preview');
    expect(previewObject).toHaveAttribute('data', 'blob:mock-url');
  });

  it('renders template cards, defaults to Classic, and passes the selection', async () => {
    vi.spyOn(api, 'getConfig').mockResolvedValue(
      makeConfig({ aiAssist: true, resumePath: '~/.nexus/resumes/ada.pdf' }),
    );
    vi.spyOn(api, 'getResumeProjects').mockResolvedValue([project]);
    const improve = vi.spyOn(api, 'improveResume').mockResolvedValue(validOutput);
    mockTemplates();

    renderTab();

    // All templates are offered; Classic is selected by default.
    // (/^classic/ so Monochrome's "quiet, classic" copy doesn't collide.)
    const classic = await screen.findByRole('button', { name: /^classic/i });
    expect(classic).toHaveAttribute('aria-pressed', 'true');
    for (const name of ['Modern', 'Sidebar', 'Compact', 'Executive', 'Developer', 'Split']) {
      expect(screen.getByRole('button', { name: new RegExp(name, 'i') })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    }

    // Picking Sidebar flips the selection and is passed to the backend.
    fireEvent.click(screen.getByRole('button', { name: /sidebar/i }));
    expect(classic).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /sidebar/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await enableAndClickGenerate();
    await waitFor(() =>
      expect(improve).toHaveBeenCalledWith(
        expect.objectContaining({ templateId: 'sidebar' }),
      ),
    );
  });

  it('does not crash when the backend returns an incomplete shape', async () => {
    vi.spyOn(api, 'getConfig').mockResolvedValue(
      makeConfig({ aiAssist: true, resumePath: '~/.nexus/resumes/ada.pdf' }),
    );
    vi.spyOn(api, 'getResumeProjects').mockResolvedValue([project]);
    mockTemplates();
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
    mockTemplates();

    renderTab();

    const button = await screen.findByRole('button', { name: /generate resume/i });
    expect(button).toBeDisabled();
    expect(screen.getByText(/ai assist on/i)).toBeInTheDocument();
    expect(screen.getByText(/resume path set in config/i)).toBeInTheDocument();
  });
});
