import { motion } from 'framer-motion';
import { Inbox, RefreshCcw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { DotBadge } from '@/components/ui/DotBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useHighlights } from '@/hooks/useHighlights';
import { cn } from '@/lib/utils';
import type { HiringSignal } from '@/types/highlights';

/** Signal badge metadata (literal Tailwind classes so JIT keeps them). */
const SIGNAL_META: Record<
  HiringSignal,
  { label: string; dot: string; badge: string }
> = {
  interview: {
    label: 'interview',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
  },
  offer: {
    label: 'offer',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
  },
  rejection: {
    label: 'rejection',
    dot: 'bg-red-400',
    badge: 'bg-red-400/10 text-red-400 border-red-400/30',
  },
  recruiter: {
    label: 'recruiter',
    dot: 'bg-neon-amber',
    badge: 'bg-neon-amber/10 text-neon-amber border-neon-amber/30',
  },
  assessment: {
    label: 'assessment',
    dot: 'bg-neon-violet',
    badge: 'bg-neon-violet/10 text-neon-violet border-neon-violet/30',
  },
  application: {
    label: 'application',
    dot: 'bg-neon-cyan',
    badge: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30',
  },
  none: {
    label: 'other',
    dot: 'bg-slate-500',
    badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  },
};

function fmtDate(iso?: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function HighlightsPage() {
  const { data, isLoading, isError, refetch, isFetching } = useHighlights();
  const highlights = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-slate-100">Inbox</h1>
          <p className="mt-1 text-sm text-slate-400">
            Hiring-related emails highlighted from your inbox scan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl border border-white/10 bg-ink-800/40 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 disabled:opacity-50',
          )}
        >
          <RefreshCcw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={Inbox}
          title="Couldn't load highlights"
          description="The inbox scan may not have run yet. Run 'nexus --scan-inbox' from the terminal, then refresh."
        />
      ) : highlights.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No hiring signals yet"
          description="Run an inbox scan from the terminal with 'nexus --scan-inbox', then refresh to see interviews, offers, and recruiter outreach here."
        />
      ) : (
        <div className="space-y-3">
          {highlights.map((h, i) => {
            const meta = SIGNAL_META[h.signal] ?? SIGNAL_META.none;
            const company = h.company || h.domain || 'Unknown';
            return (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <DotBadge
                          dot={meta.dot}
                          label={meta.label}
                          badge={meta.badge}
                        />
                        <span className="truncate text-sm font-semibold text-slate-100">
                          {company}
                        </span>
                      </div>
                      <p className="mt-1.5 truncate text-sm text-slate-300">
                        {h.subject}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {h.fromName ? `${h.fromName} <${h.from}>` : h.from}
                      </p>
                      {h.bodyPreview && (
                        <p className="mt-2 line-clamp-2 text-xs text-slate-400">
                          {h.bodyPreview}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                      <span className="text-xs text-slate-400">
                        {fmtDate(h.date)}
                      </span>
                      {h.confidence > 0 && (
                        <span className="text-[10px] uppercase tracking-wider text-slate-600">
                          {h.confidence}% match
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
