import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, ExternalLink, Search } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { DotBadge } from '@/components/ui/DotBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useApplications } from '@/hooks/useApplications';
import { useSetOutcome } from '@/hooks/useSetOutcome';
import { APP_STATUS_META, OUTCOME_CYCLE, OUTCOME_META } from '@/constants';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Application, Outcome } from '@/types';

const inputCls =
  'w-full rounded-xl border border-white/5 bg-ink-950/60 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 transition-colors focus:border-neon-cyan/40 focus:outline-none';

function nextOutcome(cur: Outcome): Outcome {
  const idx = OUTCOME_CYCLE.indexOf(cur);
  if (idx < 0 || idx >= OUTCOME_CYCLE.length - 1) return '';
  return OUTCOME_CYCLE[idx + 1] ?? '';
}

function Funnel({ apps }: { apps: Application[] }) {
  const counts = useMemo(() => {
    const c: Record<Outcome, number> = {
      '': 0,
      replied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
      ghosted: 0,
    };
    for (const a of apps) if (a.status === 'applied') c[a.outcome]++;
    return c;
  }, [apps]);
  const items: Outcome[] = [
    '',
    'replied',
    'interview',
    'offer',
    'rejected',
    'ghosted',
  ];
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {items.map((o) => (
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
    </Card>
  );
}

function JobRow({
  app,
  onCycle,
}: {
  app: Application;
  onCycle: (a: Application) => void;
}) {
  const s = APP_STATUS_META[app.status];
  const o = OUTCOME_META[app.outcome];
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/5">
      <Link to={`/jobs/${app.id}`} className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-slate-100">
            {app.role}
          </span>
          <span className="text-slate-600">·</span>
          <span className="truncate text-sm text-slate-300">{app.company}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
          <span className="font-mono">{app.provider}</span>
          <span>·</span>
          <span>{app.location || (app.remote ? 'Remote' : '—')}</span>
          <span>·</span>
          <span>{formatRelativeTime(app.appliedAt)}</span>
          {app.fitScore > 0 && (
            <>
              <span>·</span>
              <span className="font-mono text-neon-cyan">
                {app.fitScore}/100
              </span>
            </>
          )}
        </div>
      </Link>
      <DotBadge dot={s.dot} label={s.label} badge={s.badge} />
      {app.status === 'applied' && (
        <button
          type="button"
          onClick={() => onCycle(app)}
          title="Cycle outcome"
          className={cn(
            'rounded-full border px-2 py-0.5 text-[10px] transition-colors',
            o.badge,
            'hover:brightness-125',
          )}
        >
          {o.label}
        </button>
      )}
    </div>
  );
}

export default function JobsPage() {
  const [query, setQuery] = useState('');
  const { data, isLoading } = useApplications(query);
  const setOutcome = useSetOutcome();
  const apps = data ?? [];

  function cycle(a: Application) {
    setOutcome.mutate({ id: a.id, outcome: nextOutcome(a.outcome) });
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <header className="space-y-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-neon-cyan/80">
          Jobs
        </p>
        <h1 className="font-display text-3xl font-semibold text-slate-50">
          Application history
        </h1>
        <p className="text-sm text-slate-400">
          Every job Nexus applied to, skipped, or failed — with post-apply
          outcomes.
        </p>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
        <input
          className={cn(inputCls, 'pl-10')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="company, role, provider, status, location…"
        />
      </div>

      <Funnel apps={apps} />

      {isLoading ? (
        <Card className="space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </Card>
      ) : apps.length === 0 ? (
        <Card>
          <EmptyState
            icon={Briefcase}
            title={query ? 'No matching applications' : 'No applications yet'}
            description={
              query
                ? 'Try a different search term.'
                : 'Start a run from the Dashboard to populate your history.'
            }
            className="py-16"
          />
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="divide-y divide-white/5 p-2">
            {apps.map((a) => (
              <JobRow key={a.id} app={a} onCycle={cycle} />
            ))}
          </Card>
        </motion.div>
      )}

      <p className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600">
        <ExternalLink className="h-3 w-3" /> Click a row for the full job
        detail.
      </p>
    </div>
  );
}
