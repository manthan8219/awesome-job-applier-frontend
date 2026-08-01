import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmApplyDialog } from './ConfirmApplyDialog';

function renderDialog(overrides?: Partial<Parameters<typeof ConfirmApplyDialog>[0]>) {
  return render(
    <ConfirmApplyDialog
      open
      count={3}
      remainingToday={22}
      delaySec={8}
      consentGiven={false}
      onConfirm={() => undefined}
      onCancel={() => undefined}
      applying={false}
      error={null}
      {...overrides}
    />,
  );
}

describe('ConfirmApplyDialog', () => {
  it('shows the concrete, numbered submission copy', () => {
    renderDialog();
    expect(
      screen.getByText(/submit 3 applications/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/22 of your daily cap remaining · ~8s pause/i),
    ).toBeInTheDocument();
  });

  it('requires an explicit consent checkbox before submitting when consent was never given', () => {
    renderDialog();
    const submit = screen.getByRole('button', { name: /submit applications/i });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox'));
    expect(submit).toBeEnabled();
  });

  it('does not ask for consent again when it was already given', () => {
    renderDialog({ consentGiven: true });
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /submit applications/i }),
    ).toBeEnabled();
  });

  it('reports giveConsent=true only when consent was granted in this dialog', () => {
    const onConfirm = vi.fn();
    renderDialog({ onConfirm });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /submit applications/i }));
    expect(onConfirm).toHaveBeenCalledWith(true);
  });

  it('reports giveConsent=false when consent was already on record', () => {
    const onConfirm = vi.fn();
    renderDialog({ consentGiven: true, onConfirm });
    fireEvent.click(screen.getByRole('button', { name: /submit applications/i }));
    expect(onConfirm).toHaveBeenCalledWith(false);
  });
});
