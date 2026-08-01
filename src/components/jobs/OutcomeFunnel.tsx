import { memo, useMemo } from 'react';
import { OUTCOME_META } from '@/constants';
import { outcomeCounts } from '@/lib/applications';
import { cn } from '@/lib/utils';
import type { Application, Outcome } from '@/types';

const ORDER: Outcome[] = [
  '',
  'replied',
  'interview',
  'offer',
  'rejected',
  'ghosted',
];

/** The applied → replied → interview → offer funnel (mirrors the TUI). */
export const OutcomeFunnel = memo(function OutcomeFunnel({
  apps,
}: {
  apps: Application[];
}) {
  const counts = useMemo(() => outcomeCounts(apps), [apps]);
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      {ORDER.map((o) => (
        <div key={o || 'none'} className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', OUTCOME_META[o].dot)} />
          <span className="font-mono text-sm tabular-nums text-slate-200">
            {counts[o]}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-slate-500">
            {OUTCOME_META[o].label}
          </span>
        </div>
      ))}
    </div>
  );
});
