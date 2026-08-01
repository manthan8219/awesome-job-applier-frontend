import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ConfirmApplyDialogProps {
  open: boolean;
  count: number;
  remainingToday: number;
  delaySec: number;
  consentGiven: boolean;
  onConfirm: (giveConsent: boolean) => void;
  onCancel: () => void;
  applying: boolean;
  error?: string | null;
}

/**
 * The in-context consent moment: the user approves a concrete, numbered list
 * of real submissions — never an abstract toggle. When consent was never
 * given, the dialog itself is where they give it.
 */
export function ConfirmApplyDialog({
  open,
  count,
  remainingToday,
  delaySec,
  consentGiven,
  onConfirm,
  onCancel,
  applying,
  error,
}: ConfirmApplyDialogProps) {
  const [consent, setConsent] = useState(consentGiven);

  useEffect(() => {
    if (open) setConsent(consentGiven);
  }, [open, consentGiven]);

  if (!open || count <= 0) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/70 p-4 backdrop-blur-sm">
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Confirm applications"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-900 p-6 shadow-panel"
      >
        <h2 className="font-display text-lg font-semibold text-slate-50">
          Submit {count} application{count === 1 ? '' : 's'}?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Nexus will submit real applications to{' '}
          <span className="font-semibold text-slate-200">
            {count} compan{count === 1 ? 'y' : 'ies'}
          </span>{' '}
          ({remainingToday} of your daily cap remaining · ~{delaySec}s pause
          between each). This cannot be undone.
        </p>

        {!consentGiven && (
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-neon-amber/20 bg-neon-amber/5 px-3.5 py-3">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-neon-cyan"
            />
            <span className="text-xs leading-relaxed text-slate-300">
              I understand Nexus will submit real applications on my behalf,
              within my daily and per-run caps.
            </span>
          </label>
        )}

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={applying}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={applying}
            disabled={!consent}
            leftIcon={<ShieldCheck className="h-4 w-4" />}
            onClick={() => onConfirm(!consentGiven && consent)}
          >
            Submit applications
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
