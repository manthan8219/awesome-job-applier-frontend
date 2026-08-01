import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProfileStep } from './ProfileStep';

const baseProps = {
  titles: [],
  onTitlesChange: vi.fn(),
  suggestedTitles: [],
  workType: 'Remote',
  onWorkTypeChange: vi.fn(),
  locations: [],
  onLocationsChange: vi.fn(),
  locationSuggestions: [],
  onLocationInput: vi.fn(),
  firstName: '',
  onFirstNameChange: vi.fn(),
  lastName: '',
  onLastNameChange: vi.fn(),
  email: '',
  onEmailChange: vi.fn(),
  applyConsent: false,
  onApplyConsentChange: vi.fn(),
  resumePath: '',
  onResumePathChange: vi.fn(),
  fileSuggestions: [],
  onFileInput: vi.fn(),
  analyzing: false,
  analysisMsg: null,
  onAnalyze: vi.fn(),
  aiEnabled: false,
  onShowJobs: vi.fn(),
  onSkip: vi.fn(),
  onBack: vi.fn(),
  saving: false,
  error: null,
};

describe('ProfileStep profession badge', () => {
  it('shows the detected profession above the suggestion chips', () => {
    render(
      <ProfileStep
        {...baseProps}
        intent="Senior Go Engineer, remote"
        suggestedTitles={['Senior Go Engineer', 'Platform Engineer']}
      />,
    );

    expect(screen.getByText(/detected: engineering/i)).toBeInTheDocument();
  });

  it('detects healthcare from the intent alone', () => {
    render(
      <ProfileStep
        {...baseProps}
        intent="I'm a registered nurse, hospital"
        suggestedTitles={[]}
      />,
    );

    expect(screen.getByText(/detected: healthcare/i)).toBeInTheDocument();
  });

  it('shows nothing when the profession is unknown', () => {
    render(
      <ProfileStep
        {...baseProps}
        intent="exploring"
        suggestedTitles={['Generalist', 'Specialist']}
      />,
    );

    expect(screen.queryByText(/detected:/i)).not.toBeInTheDocument();
  });
});

describe('ProfileStep resume AI nudge', () => {
  it('nudges to enable AI Assist when a resume is set and AI is off', () => {
    render(
      <ProfileStep
        {...baseProps}
        resumePath="/Users/me/resume.pdf"
        aiEnabled={false}
      />,
    );

    expect(
      screen.getByText(/resume analysis is basic/i),
    ).toBeInTheDocument();
  });

  it('hides the nudge when AI Assist is already on', () => {
    render(
      <ProfileStep
        {...baseProps}
        resumePath="/Users/me/resume.pdf"
        aiEnabled={true}
      />,
    );

    expect(
      screen.queryByText(/resume analysis is basic/i),
    ).not.toBeInTheDocument();
  });

  it('hides the nudge when no resume path is set', () => {
    render(
      <ProfileStep {...baseProps} resumePath="" aiEnabled={false} />,
    );

    expect(
      screen.queryByText(/resume analysis is basic/i),
    ).not.toBeInTheDocument();
  });
});
