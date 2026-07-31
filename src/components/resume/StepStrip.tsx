import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ResumeStep {
  index: number;
  label: string;
  done: boolean;
}

/**
 * The numbered step strip mirroring the TUI ResumeHub renderSteps. Steps are
 * clickable; the active one is highlighted, done ones get a check, and an
 * in-progress one gets a dot. Arrows separate steps like the TUI "→".
 */
export function StepStrip({
  steps,
  active,
  onSelect,
}: {
  steps: ResumeStep[];
  active: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {steps.map((step, i) => {
        const isActive = step.index === active;
        return (
          <div key={step.label} className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSelect(step.index)}
              className={cn(
                'group inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all',
                isActive
                  ? 'border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan shadow-glow-soft'
                  : step.done
                    ? 'border-emerald-400/20 bg-emerald-400/5 text-emerald-300 hover:bg-emerald-400/10'
                    : 'border-white/5 bg-ink-800/40 text-slate-400 hover:bg-white/5 hover:text-slate-100',
              )}
            >
              <span
                className={cn(
                  'grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold',
                  isActive
                    ? 'bg-neon-cyan text-ink-950'
                    : step.done
                      ? 'bg-emerald-400/20 text-emerald-300'
                      : 'bg-white/5 text-slate-500',
                )}
              >
                {step.done && !isActive ? (
                  <Check className="h-3 w-3" />
                ) : (
                  step.index + 1
                )}
              </span>
              {step.label}
            </button>
            {i < steps.length - 1 && <span className="text-slate-600">→</span>}
          </div>
        );
      })}
    </div>
  );
}
