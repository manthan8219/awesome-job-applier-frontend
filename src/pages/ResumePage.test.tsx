import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ResumePage from './ResumePage';
import { api } from '@/lib/api';
import type { ResumeAnalysis } from '@/types/resume';
import type { WorkProject } from '@/types/resume';

const analysis: ResumeAnalysis = {
  valid: true,
  fileType: 'PDF',
  message: 'PDF · 12 resume keywords found',
  profile: {
    summary:
      'Backend engineer with 7 years of experience shipping distributed systems at scale.',
    whatsGood: ['Clear progression from junior to senior roles'],
    whatsWrong: ['Two projects lack measurable outcomes'],
    strengths: ['Go systems design', 'Mentoring'],
    strengthScores: [
      { name: 'Go systems design', score: 9 },
      { name: 'Mentoring', score: 5 },
    ],
    suitableRoles: ['Senior Backend Engineer'],
    roleFit: [{ name: 'Senior Backend Engineer', score: 9 }],
    skills: ['Go', 'Kubernetes'],
    skillScores: [{ name: 'Go', score: 9 }],
    experienceLevel: 'senior',
    yearsEstimate: 7,
    industries: ['Fintech'],
    improvements: ['Add metrics to the two projects that lack them'],
  },
  contact: { firstName: 'Alex', email: 'alex@example.com' },
};

const projects: WorkProject[] = [
  {
    id: 'p1',
    name: 'Payments API',
    repo: 'github.com/acme/payments-api',
    period: '2024 – Present',
    role: 'Senior Backend Engineer',
    summary: '- Reduced p99 latency from 1200ms to 180ms',
  },
];

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPage() {
  return render(
    <QueryClientProvider client={makeClient()}>
      <ResumePage />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ResumePage', () => {
  it('renders the four-step resume studio', async () => {
    vi.spyOn(api, 'getResumeAnalysis').mockResolvedValue(analysis);
    vi.spyOn(api, 'getResumeProjects').mockResolvedValue(projects);
    vi.spyOn(api, 'getResumeSkills').mockResolvedValue(['Go']);

    renderPage();

    expect(
      await screen.findByRole('heading', { name: /build a stronger resume/i }),
    ).toBeInTheDocument();
    for (const label of ['Review', 'Your work', 'New resume', 'Skills']) {
      expect(
        screen.getByRole('button', { name: new RegExp(label, 'i') }),
      ).toBeInTheDocument();
    }
  });

  it('shows the review analysis on the first step', async () => {
    vi.spyOn(api, 'getResumeAnalysis').mockResolvedValue(analysis);
    vi.spyOn(api, 'getResumeProjects').mockResolvedValue(projects);
    vi.spyOn(api, 'getResumeSkills').mockResolvedValue(['Go']);

    renderPage();

    expect(
      await screen.findByText(/shipping distributed systems at scale/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/clear progression from junior to senior roles/i),
    ).toBeInTheDocument();
  });

  it('navigates to the work tab and lists projects', async () => {
    vi.spyOn(api, 'getResumeAnalysis').mockResolvedValue(analysis);
    vi.spyOn(api, 'getResumeProjects').mockResolvedValue(projects);
    vi.spyOn(api, 'getResumeSkills').mockResolvedValue(['Go']);

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /your work/i }));
    expect(await screen.findByText(/payments api/i)).toBeInTheDocument();
    expect(screen.getByText(/reduced p99 latency/i)).toBeInTheDocument();
  });

  it('navigates to the skills tab', async () => {
    vi.spyOn(api, 'getResumeAnalysis').mockResolvedValue(analysis);
    vi.spyOn(api, 'getResumeProjects').mockResolvedValue(projects);
    vi.spyOn(api, 'getResumeSkills').mockResolvedValue(['Go', 'Kubernetes']);

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /skills/i }));
    expect(await screen.findByText(/step 4 — skills/i)).toBeInTheDocument();
    expect(screen.getByText('Kubernetes')).toBeInTheDocument();
  });
});
