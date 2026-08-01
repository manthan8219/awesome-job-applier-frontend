import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AiStep } from './AiStep';

const baseProps = {
  aiEnabled: false,
  aiProvider: '',
  localLLMModel: undefined,
  llmStatus: null,
  enablingAI: false,
  onEnableAI: vi.fn(),
  onStartSearch: vi.fn(),
  onSkip: vi.fn(),
  saving: false,
  error: null,
};

describe('AiStep', () => {
  it('asks for AI Assist and lists what it unlocks', () => {
    render(<AiStep {...baseProps} />);

    expect(
      screen.getByRole('heading', { name: /boost your results with ai assist/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /turn on ai assist/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/fit-score every job against your resume/i),
    ).toBeInTheDocument();
  });

  it('shows the off status pill and enables AI on click', () => {
    const onEnableAI = vi.fn();
    render(<AiStep {...baseProps} onEnableAI={onEnableAI} />);

    expect(screen.getByText(/ai assist is off/i)).toBeInTheDocument();
    screen.getByRole('button', { name: /turn on ai assist/i }).click();
    expect(onEnableAI).toHaveBeenCalledTimes(1);
  });

  it('starts the first search from the primary CTA', () => {
    const onStartSearch = vi.fn();
    render(<AiStep {...baseProps} onStartSearch={onStartSearch} />);

    screen
      .getByRole('button', { name: /start my first search/i })
      .click();
    expect(onStartSearch).toHaveBeenCalledTimes(1);
  });

  it('skips to the dashboard from the ghost CTA', () => {
    const onSkip = vi.fn();
    render(<AiStep {...baseProps} onSkip={onSkip} />);

    screen
      .getByRole('button', { name: /skip — go to the dashboard/i })
      .click();
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('hides the enable button and shows local model readiness when on', () => {
    render(
      <AiStep
        {...baseProps}
        aiEnabled
        aiProvider="local"
        localLLMModel="llama3.2:latest"
        llmStatus={{ reachable: true, installed: ['llama3.2:latest'] }}
      />,
    );

    expect(
      screen.queryByRole('button', { name: /turn on ai assist/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/local ai ready · llama3\.2:latest/i),
    ).toBeInTheDocument();
  });

  it('warns honestly when AI is on but no local model is installed', () => {
    render(
      <AiStep
        {...baseProps}
        aiEnabled
        aiProvider="local"
        llmStatus={{ reachable: true, installed: [] }}
      />,
    );

    expect(
      screen.getByText(/no model is installed/i),
    ).toBeInTheDocument();
  });

  it('warns when AI is on but the local LLM is unreachable', () => {
    render(
      <AiStep
        {...baseProps}
        aiEnabled
        aiProvider="local"
        llmStatus={{ reachable: false, installed: [] }}
      />,
    );

    expect(screen.getByText(/local llm is not reachable/i)).toBeInTheDocument();
  });
});
