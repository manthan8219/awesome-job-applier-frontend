import { useMemo } from 'react';
import { Download, TrendingUp, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useApplications } from '@/hooks/useApplications';
import {
  conversionRates,
  pipelineFunnel,
  providerYield,
  toApplicationsCsv,
} from '@/lib/analytics';

const FUNNEL_STAGES: Array<{
  key: 'applied' | 'replied' | 'interview' | 'offer';
  label: string;
  dot: string;
}> = [
  { key: 'applied', label: 'Applied', dot: 'bg-slate-600' },
  { key: 'replied', label: 'Replied', dot: 'bg-neon-cyan' },
  { key: 'interview', label: 'Interview', dot: 'bg-emerald-400' },
  { key: 'offer', label: 'Offer', dot: 'bg-neon-amber' },
];

function funnelWidths(funnel: ReturnType<typeof pipelineFunnel>) {
  const max = Math.max(
    1,
    funnel.applied,
    funnel.replied,
    funnel.interview,
    funnel.offer,
  );
  return {
    applied: Math.round((funnel.applied / max) * 100),
    replied: Math.round((funnel.replied / max) * 100),
    interview: Math.round((funnel.interview / max) * 100),
    offer: Math.round((funnel.offer / max) * 100),
  };
}

export default function AnalyticsPage() {
  const { data, isLoading } = useApplications('');
  const apps = useMemo(() => data ?? [], [data]);

  const funnel = useMemo(() => pipelineFunnel(apps), [apps]);
  const rates = useMemo(() => conversionRates(funnel), [funnel]);
  const yields = useMemo(() => providerYield(apps), [apps]);
  const widths = useMemo(() => funnelWidths(funnel), [funnel]);
  const totals = useMemo(
    () => apps.filter((a) => a.status === 'applied').length,
    [apps],
  );

  function downloadCsv() {
    const csv = toApplicationsCsv(apps);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-applications-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-neon-cyan/80">
            Analytics
          </p>
          <h1 className="font-display text-3xl font-semibold text-slate-50">
            Job search analytics
          </h1>
          <p className="text-sm text-slate-400">
            Response rates, conversion, per-provider yield — and a CSV of every
            application.
          </p>
        </div>
        <Button
          size="sm"
          leftIcon={<Download className="h-4 w-4" />}
          disabled={apps.length === 0}
          onClick={downloadCsv}
        >
          Export CSV ({apps.length})
        </Button>
      </header>

      {isLoading ? (
        <Card className="space-y-3 p-5">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-8 w-48" />
        </Card>
      ) : totals === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No applied jobs yet"
            description="Applications you submit will show up here as a pipeline funnel with conversion rates."
            className="py-16"
          />
        </Card>
      ) : (
        <>
          <Card className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-neon-cyan" />
              <h2 className="font-display text-lg font-semibold text-slate-100">
                Pipeline funnel
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              {FUNNEL_STAGES.map((stage) => (
                <div key={stage.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <span className={`h-2 w-2 rounded-full ${stage.dot}`} />
                      {stage.label}
                    </span>
                    <span className="font-mono text-slate-200">
                      {funnel[stage.key]}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink-700">
                    <div
                      className={`h-full rounded-full transition-[width] duration-700 ${stage.dot}`}
                      style={{ width: `${widths[stage.key]}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <RateCard
                label="Applied → Replied"
                value={rates.appliedToReplied}
              />
              <RateCard
                label="Replied → Interview"
                value={rates.repliedToInterview}
              />
              <RateCard
                label="Interview → Offer"
                value={rates.interviewToOffer}
              />
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full border border-white/5 px-2 py-0.5">
                {funnel.rejected} rejected
              </span>
              <span className="rounded-full border border-white/5 px-2 py-0.5">
                {funnel.ghosted} ghosted
              </span>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-lg font-semibold text-slate-100">
              Per-provider yield
            </h2>
            {yields.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No provider data"
                description="Applied jobs carry a provider tag that shows up here."
                className="py-12"
              />
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="py-2 pr-3">Provider</th>
                      <th className="py-2 pr-3 text-right">Applied</th>
                      <th className="py-2 pr-3 text-right">Replied</th>
                      <th className="py-2 pr-3 text-right">Interview</th>
                      <th className="py-2 pr-3 text-right">Offer</th>
                      <th className="py-2 text-right">Reply rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {yields.map((y) => (
                      <tr key={y.provider} className="text-slate-300">
                        <td className="py-2 pr-3 font-mono text-xs text-neon-cyan">
                          {y.provider || '—'}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums">
                          {y.applied}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums">
                          {y.replied}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums">
                          {y.interview}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums">
                          {y.offer}
                        </td>
                        <td className="py-2 text-right font-mono tabular-nums">
                          {y.replyRate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function RateCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/5 bg-ink-950/60 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-semibold text-neon-cyan">
        {value}
        <span className="text-sm text-slate-500">%</span>
      </p>
    </div>
  );
}

