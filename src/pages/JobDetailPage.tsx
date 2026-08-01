import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DotBadge } from '@/components/ui/DotBadge';
import { PageLoader } from '@/components/ui/PageLoader';
import { useApplications } from '@/hooks/useApplications';
import { useSetOutcome } from '@/hooks/useSetOutcome';
import { APP_STATUS_META, OUTCOME_CYCLE, OUTCOME_META } from '@/constants';
import { nextOutcome } from '@/lib/applications';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import type { Application } from '@/types';

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <span className="block text-[11px] uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span className="text-sm text-slate-200">{value}</span>
    </div>
  );
}

function jobDescription(a: Application): string {
  if (a.description?.trim()) return a.description;
  return `${a.company} is hiring a ${a.role} (${a.location || (a.remote ? 'Remote' : 'On-site')}). You'll build and operate ${a.provider}-sourced backend systems, own services end-to-end, and partner with product on roadmap. Strong Go and distributed systems experience expected. This role is sourced via ${a.provider} and was posted ${formatRelativeTime(a.postedAt)}.`;
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: apps, isLoading } = useApplications('');
  const setOutcome = useSetOutcome();

  const app = apps?.find((a) => String(a.id) === id);

  if (isLoading) return <PageLoader label="Loading application" />;
  if (!app) {
    return (
      <div className="mx-auto w-full max-w-2xl py-24 text-center">
        <p className="text-slate-400">Application not found.</p>
        <Link to="/jobs">
          <Button variant="outline" size="sm" className="mt-4">
            Back to Jobs
          </Button>
        </Link>
      </div>
    );
  }

  const s = APP_STATUS_META[app.status];
  const o = OUTCOME_META[app.outcome];
  const isApplied = app.status === 'applied';

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <Link
        to="/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Jobs
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5"
      >
        <Card className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-semibold text-slate-50">
                {app.role}
              </h1>
              <p className="text-sm text-slate-300">{app.company}</p>
            </div>
            <div className="flex items-center gap-2">
              <DotBadge dot={s.dot} label={s.label} badge={s.badge} />
              {isApplied && (
                <DotBadge dot={o.dot} label={o.label} badge={o.badge} />
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Meta label="Provider" value={app.provider} />
            <Meta
              label="Location"
              value={app.location || (app.remote ? 'Remote' : 'On-site')}
            />
            <Meta label="Applied" value={formatRelativeTime(app.appliedAt)} />
            <Meta label="Posted" value={formatRelativeTime(app.postedAt)} />
          </div>

          {app.fitScore > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-slate-500">
                <span>Fit score</span>
                <span className="font-mono text-neon-cyan">
                  {app.fitScore}/100
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-ink-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-violet"
                  style={{ width: `${app.fitScore}%` }}
                />
              </div>
              {app.fitSummary && (
                <p className="text-sm text-slate-400">{app.fitSummary}</p>
              )}
            </div>
          )}

          {app.reason && (
            <div className="rounded-xl border border-white/5 bg-ink-800/40 px-4 py-3 text-sm text-slate-300">
              <span className="text-slate-500">Reason: </span>
              {app.reason}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <a href={app.url} target="_blank" rel="noreferrer">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ExternalLink className="h-4 w-4" />}
              >
                Open job posting
              </Button>
            </a>
            {isApplied && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<RotateCcw className="h-4 w-4" />}
                loading={setOutcome.isPending}
                onClick={() =>
                  setOutcome.mutate({
                    id: app.id,
                    outcome: nextOutcome(app.outcome, OUTCOME_CYCLE),
                  })
                }
              >
                Cycle outcome →{' '}
                {nextOutcome(app.outcome, OUTCOME_CYCLE)
                  ? OUTCOME_META[nextOutcome(app.outcome, OUTCOME_CYCLE)].label
                  : 'clear'}
              </Button>
            )}
          </div>
        </Card>

        <Card className="space-y-3 p-6">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-neon-violet/80">
            Description
          </h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
            {jobDescription(app)}
          </p>
        </Card>

        {isApplied && app.outcomeAt && (
          <p className="font-mono text-xs text-slate-600">
            Outcome set {formatDateTime(app.outcomeAt)}.
          </p>
        )}
      </motion.div>
    </div>
  );
}
