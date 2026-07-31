import { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Filter, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useLogs } from '@/hooks/useLogs';
import { useClearLogs } from '@/hooks/useClearLogs';
import { useUsage } from '@/hooks/useUsage';
import { cn } from '@/lib/utils';

const inputCls =
  'w-full rounded-xl border border-white/5 bg-ink-950/60 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 transition-colors focus:border-neon-cyan/40 focus:outline-none';

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Mirrors ui.colorizeLog — class chosen by line prefix. */
function logTone(line: string): string {
  if (line.startsWith('  ✓')) return 'text-emerald-400';
  if (line.startsWith('  ✗')) return 'text-red-400';
  if (line.startsWith('  ~')) return 'text-slate-500';
  if (line.startsWith('  →')) return 'text-neon-violet';
  if (
    line.includes('[greenhouse]') ||
    line.includes('[lever]') ||
    line.includes('[ashby]')
  )
    return 'text-neon-violet/80';
  return 'text-slate-300';
}

function UsagePanel() {
  const { data: u, isLoading } = useUsage();
  if (isLoading || !u) {
    return (
      <Card className="space-y-3 p-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-16 w-full" />
      </Card>
    );
  }
  return (
    <Card className="space-y-4 p-5">
      <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-neon-violet/80">
        Usage
      </h3>
      {u.err ? (
        <p className="text-sm text-red-400">error: {u.err}</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">
                Storage
              </p>
              <p className="text-sm text-slate-200">
                {fmtBytes(u.totalBytes)} total
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-slate-500">
                <span>jobs DB {fmtBytes(u.dbBytes)}</span>
                <span>· resumes {fmtBytes(u.resumesBytes)}</span>
                <span>· meta {fmtBytes(u.metaBytes)}</span>
                {u.otherBytes > 0 && (
                  <span>· other {fmtBytes(u.otherBytes)}</span>
                )}
              </div>
              <p className="font-mono text-[11px] text-slate-600">
                {u.dataDir} · {u.jobCount} jobs
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">
                Process
              </p>
              <p className="text-sm text-slate-200">
                heap {fmtBytes(u.heapAlloc)}
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-slate-500">
                <span>reserved {fmtBytes(u.sysBytes)}</span>
                <span>· {u.goroutines} goroutines</span>
              </div>
              <p className="font-mono text-[11px] text-slate-600">
                Fit AI: {u.aiMode || 'off'}
              </p>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

export default function LogsPage() {
  const [filter, setFilter] = useState('');
  const { data } = useLogs(filter);
  const clear = useClearLogs();
  const lines = data?.lines ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <header className="space-y-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-neon-cyan/80">
          Logs
        </p>
        <h1 className="font-display text-3xl font-semibold text-slate-50">
          Engine log
        </h1>
        <p className="text-sm text-slate-400">
          Live engine output — searches, fit scoring, applies, and rate limits.
        </p>
      </header>

      <UsagePanel />

      <div className="flex items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Filter className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
          <input
            className={cn(inputCls, 'pl-10')}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="filter lines…"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          loading={clear.isPending}
          leftIcon={<Trash2 className="h-4 w-4" />}
          onClick={() => clear.mutate()}
        >
          Clear
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
            nexus.log
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600">
            <Database className="h-3 w-3" /> {lines.length} lines
          </span>
        </div>
        <div className="no-scrollbar max-h-[28rem] overflow-auto p-4">
          {lines.length === 0 ? (
            <p className="py-8 text-center font-mono text-sm text-slate-600">
              {filter
                ? 'No lines match the filter.'
                : 'Log cleared. Start a run to stream output.'}
            </p>
          ) : (
            <motion.pre
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="whitespace-pre font-mono text-xs leading-relaxed"
            >
              {lines.map((l, i) => (
                <div key={i} className={cn('py-0.5', logTone(l))}>
                  {l}
                </div>
              ))}
            </motion.pre>
          )}
        </div>
      </Card>

      <p className="font-mono text-[11px] text-slate-600">
        ↑↓ scroll · auto-refreshes every 5s · filter or clear anytime
      </p>
    </div>
  );
}
