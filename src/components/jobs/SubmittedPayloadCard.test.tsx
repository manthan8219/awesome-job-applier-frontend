import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SubmittedPayloadCard } from './SubmittedPayloadCard';
import type { Application } from '@/types';

function makeApp(overrides: Partial<Application>): Application {
  return {
    id: 1,
    provider: 'ashby',
    company: 'Acme Health',
    role: 'Registered Nurse',
    url: 'https://jobs.ashbyhq.com/acmehealth/3',
    status: 'applied',
    reason: '',
    appliedAt: new Date().toISOString(),
    location: 'Remote',
    remote: true,
    postedAt: new Date().toISOString(),
    fitScore: 81,
    fitSummary: 'solid',
    outcome: '',
    outcomeAt: '',
    ...overrides,
  };
}

describe('SubmittedPayloadCard', () => {
  it('shows a clear empty state when no payload was recorded', () => {
    render(<SubmittedPayloadCard app={makeApp({})} />);

    expect(
      screen.getByRole('heading', { name: /submitted payload/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/no payload recorded/i)).toBeInTheDocument();
  });

  it('reveals profile fields, resume and answers when expanded', () => {
    render(
      <SubmittedPayloadCard
        app={makeApp({
          submittedPayload: {
            profile: {
              first_name: 'Ada',
              last_name: 'Lovelace',
              email: 'ada@example.com',
            },
            resume: { filename: 'resume.pdf', checksum: 'abc123' },
            answers: [
              { question: 'Why this role?', answer: 'because', aiGenerated: true },
            ],
          },
        })}
      />,
    );

    // Collapsed by default — expand to read the audit.
    expect(screen.queryByText('resume.pdf')).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: /toggle submitted payload/i }),
    );

    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('Lovelace')).toBeInTheDocument();
    expect(screen.getByText('resume.pdf')).toBeInTheDocument();
    expect(screen.getByText(/abc123/)).toBeInTheDocument();
    expect(screen.getByText(/why this role/i)).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('because')).toBeInTheDocument();
  });
});
