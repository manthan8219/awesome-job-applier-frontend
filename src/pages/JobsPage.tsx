import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Check,
  ExternalLink,
  Plus,
  Rocket,
  Search,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { DotBadge } from '@/components/ui/DotBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { OutcomeFunnel } from '@/components/jobs/OutcomeFunnel';
import { ConfirmApplyDialog } from '@/components/review/ConfirmApplyDialog';
import { useApplications } from '@/hooks/useApplications';
import { useSetOutcome } from '@/hooks/useSetOutcome';
import { useSetApplicationApproved } from '@/hooks/useSetApplicationApproved';
import { useApplySelected } from '@/hooks/useApplySelected';
import { useConfig } from '@/hooks/useConfig';
import { useUpdateConfig } from '@/hooks/useUpdateConfig';
import { APP_STATUS_META, OUTCOME_CYCLE, OUTCOME_META } from '@/constants';
import {
  appliedTodayCount,
  isQueueStatus,
  nextOutcome,
} from '@/lib/applications';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Application } from '@/types';

const inputCls =
  'w-full rounded-xl border border-white/5 bg-ink-950/60 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 transition-colors focus:border-neon-cyan/40 focus:outline-none';

type Filter = 'all' | 'queue' | 'applied';

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'queue', label: 'Queue' },
  { id: 'applied', label: 'Applied' },
];

function JobRow({
  app,
  onCycle,
  onToggleApproved,
}: {
  app: Application;
  onCycle: (a: Application) => void;
  onToggleApproved: (a: Application) => void;
}) {
  const s = APP_STATUS_META[app.status];
  const o = OUTCOME_META[app.outcome];
  const canApprove = isQueueStatus(app.status);

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/5">
      {canApprove && (
        <button
          type="button"
          onClick={() => onToggleApproved(app)}
          aria-label={
            app.approved ? 'Remove from apply queue' : 'Add to apply queue'
          }
          title={
            app.approved ? 'Remove from apply queue' : 'Add to apply queue'
          }
          className={cn(
            'grid h-6 w-6 shrink-0 place-items-center rounded-md border transition-colors',
            app.approved
              ? 'border-neon-cyan/50 bg-neon-cyan/15 text-neon-cyan'
              : 'border-white/10 text-transparent hover:border-neon-cyan/40 hover:text-slate-500',
          )}
        >
          <Check className="h-3.5 w-3.5" />
        </button>
      )}
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
  const [filter, setFilter] = useState<Filter>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const { data, isLoading } = useApplications(query);
  const setOutcome = useSetOutcome();
  const setApproved = useSetApplicationApproved();
  const applySelected = useApplySelected();
  const { data: cfg } = useConfig();
  const saveConfig = useUpdateConfig();

  const apps = useMemo(() => data ?? [], [data]);

  const queued = useMemo(
    () => apps.filter((a) => isQueueStatus(a.status)),
    [apps],
  );
  const approvedIds = queued.filter((a) => a.approved).map((a) => a.id);
  const appliedToday = appliedTodayCount(apps);
  const remainingToday = Math.max(0, (cfg?.maxAppsPerDay ?? 25) - appliedToday);

  const filtered = useMemo(() => {
    return apps.filter((a) => {
      if (filter === 'queue') return isQueueStatus(a.status);
      if (filter === 'applied') return a.status === 'applied';
      return true;
    });
  }, [apps, filter]);

  function cycle(a: Application) {
    setOutcome.mutate({
      id: a.id,
      outcome: nextOutcome(a.outcome, OUTCOME_CYCLE),
    });
  }

  function toggleApproved(a: Application) {
    setApproved.mutate({ id: a.id, approved: !a.approved });
  }

  function approveAllVisible() {
    const pending = queued.filter((a) => !a.approved);
    for (const a of pending) setApproved.mutate({ id: a.id, approved: true });
  }

  async function handleConfirm(giveConsent: boolean) {
    setApplyError(null);
    try {
      if (giveConsent && cfg) {
        await saveConfig.mutateAsync({ ...cfg, applyConsent: true });
      }
      await applySelected.mutateAsync(approvedIds);
      setDialogOpen(false);
    } catch (e) {
      setApplyError(e instanceof Error ? e.message : 'Apply failed.');
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-neon-cyan/80">
            Jobs
          </p>
          <h1 className="font-display text-3xl font-semibold text-slate-50">
            Review &amp; track applications
          </h1>
          <p className="text-sm text-slate-400">
            Approve found jobs to apply, then track every outcome through the
            pipeline.
          </p>
        </div>
        <Link to="/jobs/new">
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
            Add job
          </Button>
        </Link>
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs transition-all',
                filter === f.id
                  ? 'bg-neon-cyan/15 text-neon-cyan'
                  : 'bg-ink-800/60 text-slate-400 hover:text-slate-200',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        {queued.length > 0 && (
          <Button size="sm" variant="ghost" onClick={approveAllVisible}>
            Approve all in queue ({queued.length})
          </Button>
        )}
      </div>

      {approvedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 px-4 py-3"
        >
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-neon-cyan">
              {approvedIds.length}
            </span>{' '}
            approved — ready to submit
          </p>
          <Button
            size="sm"
            leftIcon={<Rocket className="h-4 w-4" />}
            onClick={() => {
              setApplyError(null);
              setDialogOpen(true);
            }}
          >
            Apply approved ({approvedIds.length})
          </Button>
        </motion.div>
      )}

      <Card className="p-4">
        <OutcomeFunnel apps={apps} />
      </Card>

      {isLoading ? (
        <Card className="space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Briefcase}
            title={
              filter === 'queue'
                ? 'Nothing in your review queue'
                : 'No applications yet'
            }
            description={
              filter === 'queue'
                ? 'Start a dry run from the Dashboard — found jobs land here for your approval.'
                : 'Start a run from the Dashboard to populate your history.'
            }
            className="py-16"
          />
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="divide-y divide-white/5 p-2">
            {filtered.map((a) => (
              <JobRow
                key={a.id}
                app={a}
                onCycle={cycle}
                onToggleApproved={toggleApproved}
              />
            ))}
          </Card>
        </motion.div>
      )}

      <p className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600">
        <ExternalLink className="h-3 w-3" /> Click a row for the full job
        detail.
      </p>

      <ConfirmApplyDialog
        open={dialogOpen}
        count={approvedIds.length}
        remainingToday={remainingToday}
        delaySec={cfg?.applyDelaySec ?? 3}
        consentGiven={cfg?.applyConsent ?? false}
        onConfirm={handleConfirm}
        onCancel={() => setDialogOpen(false)}
        applying={applySelected.isPending}
        error={applyError}
      />
    </div>
  );
}
