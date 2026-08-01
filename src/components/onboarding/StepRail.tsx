import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = ['Welcome', 'Your profile', 'AI Assist', 'Launch search'];

/** The numbered progress rail for the onboarding wizard. */
export function StepRail({ active }: { active: number }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {STEPS.map((label, i) => {
        const done = i < active;
        const isActive = i === active;
        return (
          <div key={label} className="flex items-center gap-1.5">
            <span
              className={cn(
                'inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all',
                isActive
                  ? 'border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan shadow-glow-soft'
                  : done
                    ? 'border-emerald-400/20 bg-emerald-400/5 text-emerald-300'
                    : 'border-white/5 bg-ink-800/40 text-slate-400',
              )}
            >
              <span
                className={cn(
                  'grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold',
                  isActive
                    ? 'bg-neon-cyan text-ink-950'
                    : done
                      ? 'bg-emerald-400/20 text-emerald-300'
                      : 'bg-white/5 text-slate-500',
                )}
              >
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="text-slate-600">→</span>}
          </div>
        );
      })}
    </div>
  );
}
