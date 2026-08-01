import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, ExternalLink } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { useSetOutcome } from '@/hooks/useSetOutcome';
import { OUTCOME_META } from '@/constants';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Application, Outcome } from '@/types';

/** A board column: the pipeline stage it represents + the outcomes in it. */
interface BoardStage {
  id: string;
  title: string;
  outcomes: Outcome[];
  dot: string;
}

const BOARD_STAGES: BoardStage[] = [
  { id: 'applied', title: 'Applied', outcomes: [''], dot: 'bg-slate-600' },
  {
    id: 'replied',
    title: 'Replied',
    outcomes: ['replied'],
    dot: 'bg-neon-cyan',
  },
  {
    id: 'interview',
    title: 'Interview',
    outcomes: ['interview'],
    dot: 'bg-emerald-400',
  },
  { id: 'offer', title: 'Offer', outcomes: ['offer'], dot: 'bg-neon-amber' },
  {
    id: 'closed',
    title: 'Closed',
    outcomes: ['rejected', 'ghosted'],
    dot: 'bg-red-400',
  },
];

const ALL_OUTCOMES: Outcome[] = [
  '',
  'replied',
  'interview',
  'offer',
  'rejected',
  'ghosted',
];

/**
 * Kanban pipeline: applied applications grouped by outcome. Move a card to a
 * stage via its select — the outcome persists to the backend through
 * useSetOutcome (which invalidates the jobs + mission caches).
 */
export const PipelineBoard = memo(function PipelineBoard({
  apps,
}: {
  apps: Application[];
}) {
  const setOutcome = useSetOutcome();

  const byStage = useMemo(() => {
    const map = new Map<string, Application[]>(BOARD_STAGES.map((s) => [s.id, []]));
    for (const app of apps) {
      const stage = BOARD_STAGES.find((s) => s.outcomes.includes(app.outcome));
      const key = stage?.id ?? 'applied';
      map.get(key)!.push(app);
    }
    return map;
  }, [apps]);

  const pending = setOutcome.isPending;

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {BOARD_STAGES.map((stage) => {
        const cards = byStage.get(stage.id) ?? [];
        return (
          <section
            key={stage.id}
            aria-label={`${stage.title} pipeline column`}
            className="flex min-h-[12rem] flex-col gap-2 rounded-2xl border border-white/5 bg-ink-900/40 p-3"
          >
            <header className="flex items-center gap-2 px-1">
              <span className={cn('h-2 w-2 rounded-full', stage.dot)} />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                {stage.title}
              </h2>
              <span className="ml-auto font-mono text-xs tabular-nums text-slate-500">
                {cards.length}
              </span>
            </header>

            {cards.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="Empty"
                description="No applications here."
                className="py-8"
              />
            ) : (
              <div className="space-y-2">
                {cards.map((app) => (
                  <PipelineCard
                    key={app.id}
                    app={app}
                    pending={pending}
                    onMove={(outcome) =>
                      setOutcome.mutate({ id: app.id, outcome })
                    }
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
});


function PipelineCard({
  app,
  pending,
  onMove,
}: {
  app: Application;
  pending: boolean;
  onMove: (outcome: Outcome) => void;
}) {
  const current = OUTCOME_META[app.outcome];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/5 bg-ink-950/60 p-3 transition-colors hover:border-white/10"
    >
      <div className="flex items-start justify-between gap-2">
        <Link to={`/jobs/${app.id}`} className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-100">
            {app.role}
          </p>
          <p className="truncate text-xs text-slate-400">{app.company}</p>
        </Link>
        {app.fitScore > 0 && (
          <span className="shrink-0 rounded-md bg-neon-cyan/10 px-1.5 py-0.5 font-mono text-[10px] text-neon-cyan">
            {app.fitScore}
          </span>
        )}
      </div>
      <p className="mt-1 text-[10px] text-slate-600">
        {formatRelativeTime(app.appliedAt)}
      </p>

      <div className="mt-2 flex items-center gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2">
          <span className="sr-only">Move {app.role} to stage</span>
          <select
            aria-label={`Move ${app.role} to stage`}
            value={app.outcome}
            disabled={pending}
            onChange={(e) => onMove(e.target.value as Outcome)}
            className="w-full rounded-lg border border-white/10 bg-ink-800/60 px-2 py-1.5 text-xs text-slate-200 focus:border-neon-cyan/40 focus:outline-none disabled:opacity-50"
          >
            {ALL_OUTCOMES.map((o) => (
              <option key={o || 'none'} value={o}>
                {OUTCOME_META[o].label}
              </option>
            ))}
          </select>
        </label>
        <Link
          to={`/jobs/${app.id}`}
          aria-label={`Open ${app.role} details`}
          className="shrink-0 rounded-md border border-transparent p-1.5 text-slate-500 transition-colors hover:border-white/10 hover:text-slate-300"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {app.outcome !== '' && (
        <p
          className={cn(
            'mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[10px]',
            current.badge,
          )}
        >
          {current.label}
        </p>
      )}
    </motion.div>
  );
}
