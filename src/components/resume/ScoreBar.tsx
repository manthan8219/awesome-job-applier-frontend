import { cn } from '@/lib/utils';
import type { ScoredItem } from '@/types/resume';

/**
 * A horizontal score bar mirroring the TUI renderBarChart. Scores are 1–10;
 * bar fill = score/10, color intensity ramps from slate (weak) → amber → cyan
 * (strong) so the chart reads at a glance without relying on color alone (the
 * numeric score is always shown).
 */
const toneFor = (score: number): string => {
  if (score >= 8) return 'bg-gradient-to-r from-neon-cyan to-neon-azure';
  if (score >= 6) return 'bg-gradient-to-r from-neon-amber to-neon-cyan';
  return 'bg-gradient-to-r from-slate-500 to-neon-amber';
};

const textFor = (score: number): string => {
  if (score >= 8) return 'text-neon-cyan';
  if (score >= 6) return 'text-neon-amber';
  return 'text-slate-400';
};

export function ScoreBar({ item }: { item: ScoredItem }) {
  const score = Math.max(0, Math.min(10, item.score));
  const pct = (score / 10) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 truncate text-xs text-slate-300 sm:w-44">
        {item.name}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-700">
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-500',
            toneFor(score),
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={cn(
          'w-10 shrink-0 text-right font-mono text-xs tabular-nums',
          textFor(score),
        )}
      >
        {score}/10
      </span>
    </div>
  );
}
