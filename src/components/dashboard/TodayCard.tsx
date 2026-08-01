import { memo } from 'react';
import { FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from './SectionLabel';
import { AnimatedNumber } from './AnimatedNumber';

function Stat({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: string;
}) {
  return (
    <div className="flex flex-col">
      <span className={`font-display text-2xl font-semibold tabular-nums ${tone}`}>
        <AnimatedNumber value={value} />
      </span>
      <span className="text-[11px] uppercase tracking-wider text-slate-500">
        {label}
      </span>
    </div>
  );
}

export const TodayCard = memo(function TodayCard({
  applied,
  skipped,
  failed,
  appliedToday,
  maxPerDay,
  resumePath,
}: {
  applied: number;
  skipped: number;
  failed: number;
  appliedToday: number;
  maxPerDay: number;
  resumePath: string;
}) {
  const pct = maxPerDay > 0 ? Math.min(100, (appliedToday / maxPerDay) * 100) : 0;
  const resumeName = resumePath ? resumePath.split(/[\\/]/).pop() ?? resumePath : '(none)';
  return (
    <Card className="p-5">
      <SectionLabel>Today</SectionLabel>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat value={appliedToday} label="Applied today" tone="text-emerald-400" />
        <Stat value={applied} label="Lifetime applied" tone="text-emerald-400" />
        <Stat value={skipped} label="Skipped" tone="text-slate-300" />
        <Stat value={failed} label="Failed" tone="text-red-400" />
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Daily cap</span>
          <span className="font-mono text-slate-300">
            {appliedToday} / {maxPerDay}
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-violet transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
        <FileText className="h-4 w-4 text-neon-cyan/70" />
        <span className="text-slate-500">Active resume:</span>
        <span className="font-mono text-slate-200">{resumeName}</span>
      </div>
    </Card>
  );
});
