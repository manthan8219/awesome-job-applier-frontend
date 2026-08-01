import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Target } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useApplications } from '@/hooks/useApplications';
import {
  scoreReplyProbability,
  topOpportunities,
  whyLine,
} from '@/lib/opportunities';
import type { Application } from '@/types';

/**
 * Guided reply-probability feed (KAN-29): the top five jobs most likely to
 * produce a reply, ranked by fit × freshness × pipeline stage, each with a
 * one-line why and a direct next action.
 */
export const ReplyProbabilityFeed = memo(function ReplyProbabilityFeed() {
  const { data, isLoading, isError } = useApplications('');
  const top = useMemo(() => topOpportunities(data ?? []), [data]);

  return (
    <Card className="space-y-3 p-5">
      <header className="flex items-center justify-between gap-2">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-neon-violet/80">
          Top reply-probability jobs
        </h2>
        <Target className="h-4 w-4 text-neon-cyan" />
      </header>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-red-400">Could not load applications.</p>
      ) : top.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No jobs to target yet"
          description="Run a dry run — found jobs land here ranked by reply probability."
          className="py-10"
        />
      ) : (
        <ul className="divide-y divide-white/5">
          {top.map((app, i) => (
            <FeedRow key={app.id} rank={i + 1} app={app} />
          ))}
        </ul>
      )}

      <p className="font-mono text-[11px] text-slate-600">
        Scored by fit × freshness × stage — quality over volume.
      </p>
    </Card>
  );
});

function FeedRow({ rank, app }: { rank: number; app: Application }) {
  const score = scoreReplyProbability(app);
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="w-5 shrink-0 font-mono text-xs tabular-nums text-slate-600">
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <Link
          to={`/jobs/${app.id}`}
          className="truncate text-sm font-medium text-slate-100 transition-colors hover:text-neon-cyan"
        >
          {app.role} @ {app.company}
        </Link>
        <p className="truncate text-[11px] text-slate-500">{whyLine(app)}</p>
      </div>
      <span className="shrink-0 rounded-md bg-neon-cyan/10 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-neon-cyan">
        {score}
      </span>
      <a
        href={app.url}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open ${app.role} posting`}
        className="shrink-0 rounded-md border border-transparent p-1.5 text-slate-500 transition-colors hover:border-white/10 hover:text-slate-300"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </li>
  );
}
