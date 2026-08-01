import { useMemo } from 'react';
import {
  Lightbulb,
  Mail,
  Target,
  TrendingUp,
  Users,
  type Radar,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useApplications } from '@/hooks/useApplications';
import { useOutreachItems } from '@/hooks/useOutreachItems';
import { conversionRates, pipelineFunnel } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import type { AnalyticsProviderYield } from '@/types/analytics';
import type { OutreachItem } from '@/types/outreach';

interface VariantStat {
  variant: string;
  total: number;
  replied: number;
  rate: number;
}

/** Reply stats per A/B variant (an item "replied" counts as a response). */
function variantStats(items: OutreachItem[]): VariantStat[] {
  const byVariant = new Map<string, OutreachItem[]>();
  for (const it of items) {
    const v = (it.variant ?? '').trim();
    if (!v) continue;
    const list = byVariant.get(v) ?? [];
    list.push(it);
    byVariant.set(v, list);
  }
  return [...byVariant.entries()]
    .map(([variant, list]) => ({
      variant,
      total: list.length,
      replied: list.filter((i) => i.status === 'replied').length,
      rate:
        list.length > 0
          ? Math.round(
              (list.filter((i) => i.status === 'replied').length / list.length) *
                100,
            )
          : 0,
    }))
    .sort((a, b) => b.rate - a.rate);
}

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

function funnelWidths(f: ReturnType<typeof pipelineFunnel>) {
  const max = Math.max(1, f.applied, f.replied, f.interview, f.offer);
  return {
    applied: Math.round((f.applied / max) * 100),
    replied: Math.round((f.replied / max) * 100),
    interview: Math.round((f.interview / max) * 100),
    offer: Math.round((f.offer / max) * 100),
  };
}

function recommendationCards(
  rates: ReturnType<typeof conversionRates>,
  providers: AnalyticsProviderYield[],
  variants: VariantStat[],
  overallReply: number,
): string[] {
  const recs: string[] = [];
  if (overallReply > 0 && overallReply < 15) {
    recs.push(
      `Your overall reply probability is only ${overallReply}% — prioritize fresh, high-fit postings and tailor each resume before applying.`,
    );
  } else if (rates.appliedToReplied > 0 && rates.appliedToReplied < 20) {
    recs.push(
      `Applied → Replied is ${rates.appliedToReplied}% — target recent postings and add missing keywords before you apply.`,
    );
  }
  if (rates.repliedToInterview > 0 && rates.repliedToInterview < 50) {
    recs.push(
      `Replies convert to interviews at only ${rates.repliedToInterview}% — sharpen the fit-to-role signal in your replies.`,
    );
  }
  const best = providers
    .filter((p) => p.applied >= 2)
    .sort((a, b) => b.replyProbability - a.replyProbability)[0];
  if (best && best.replyProbability > 0) {
    recs.push(
      `${best.provider} replies at ${best.replyProbability}% — raise its priority and double down there.`,
    );
  }
  if (variants.length === 0) {
    recs.push(
      'Tag outreach drafts as Variant A or B on the Outreach page — the Response Center will compare their reply rates.',
    );
  } else {
    const first = variants[0];
    const second = variants[1];
    if (first && second && first.rate !== second.rate) {
      recs.push(
        `Variant ${first.variant} replies at ${first.rate}% vs ${second.variant} at ${second.rate}% — run the winner.`,
      );
    }
  }
  return recs;
}


export default function ResponsePage() {
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();
  const { data: appsData, isLoading: appsLoading } = useApplications('');
  const { data: itemsData, isLoading: itemsLoading } = useOutreachItems();

  const loading = analyticsLoading || appsLoading || itemsLoading;

  const funnel = useMemo(() => pipelineFunnel(appsData ?? []), [appsData]);
  const rates = useMemo(() => conversionRates(funnel), [funnel]);
  const widths = useMemo(() => funnelWidths(funnel), [funnel]);
  const variants = useMemo(() => variantStats(itemsData ?? []), [itemsData]);
  const providers = useMemo(() => analytics?.perProvider ?? [], [analytics]);
  const overallReply = analytics?.responseProbability ?? 0;

  const recs = useMemo(
    () => recommendationCards(rates, providers, variants, overallReply),
    [rates, providers, variants, overallReply],
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <header className="space-y-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-neon-cyan/80">
          Response Center
        </p>
        <h1 className="font-display text-3xl font-semibold text-slate-50">
          Is anyone replying — and what should you change?
        </h1>
        <p className="text-sm text-slate-400">
          Reply probability, funnel conversion, provider yield, and A/B template
          results — so you act on the weakest step, not the loudest one.
        </p>
      </header>

      {loading ? (
        <Card className="space-y-3 p-5">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-8 w-40" />
        </Card>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-3">
            <StatCard
              icon={Target}
              label="Overall reply probability"
              value={overallReply > 0 ? `${overallReply}%` : '—'}
              hint={
                overallReply === 0
                  ? 'Needs applied jobs with outcomes'
                  : 'replied + interview + offer'
              }
            />
            <StatCard
              icon={TrendingUp}
              label="Applied → Replied"
              value={`${rates.appliedToReplied}%`}
              hint={`${funnel.applied} applied`}
            />
            <StatCard
              icon={Mail}
              label="A/B variants tracked"
              value={String(variants.length)}
              hint={
                variants.length === 0
                  ? 'Tag drafts on Outreach'
                  : 'tagged outreach items'
              }
            />
          </div>

          {recs.length > 0 && (
            <Card className="space-y-2.5 p-5">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-neon-amber" />
                <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-neon-violet/80">
                  Recommendations
                </h2>
              </div>
              <ul className="space-y-1.5">
                {recs.map((r, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-300"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon-amber" />
                    {r}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="space-y-3 p-5">
            <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-neon-violet/80">
              Pipeline funnel
            </h2>
            {funnel.applied === 0 ? (
              <EmptyState
                icon={Users}
                title="No applied jobs yet"
                description="Applied jobs with outcomes power the funnel and reply rates."
                className="py-12"
              />
            ) : (
              <div className="space-y-2">
                {FUNNEL_STAGES.map((s) => (
                  <div key={s.key} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs text-slate-400">
                      {s.label}
                    </span>
                    <div className="h-5 flex-1 overflow-hidden rounded-md bg-ink-800/60">
                      <div
                        className={cn('h-full rounded-md', s.dot)}
                        style={{ width: `${widths[s.key]}%` }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right font-mono text-xs text-slate-300">
                      {funnel[s.key]}
                    </span>
                  </div>
                ))}
                <p className="text-xs text-slate-500">
                  {funnel.rejected} rejected · {funnel.ghosted} ghosted
                </p>
              </div>
            )}
          </Card>

          <Card className="space-y-3 p-5">
            <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-neon-violet/80">
              Per-provider reply probability
            </h2>
            {providers.length === 0 ? (
              <EmptyState
                icon={Target}
                title="No provider data"
                description="Applied jobs carry a provider tag that shows up here."
                className="py-12"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="py-2 pr-3">Provider</th>
                      <th className="py-2 pr-3 text-right">Applied</th>
                      <th className="py-2 pr-3 text-right">Replied</th>
                      <th className="py-2 text-right">Reply probability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {providers.map((p) => (
                      <tr key={p.provider} className="text-slate-300">
                        <td className="py-2 pr-3 font-mono text-xs text-neon-cyan">
                          {p.provider}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums">
                          {p.applied}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums">
                          {p.replied}
                        </td>
                        <td className="py-2 text-right font-mono tabular-nums">
                          {p.replyProbability}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>


          <Card className="space-y-3 p-5">
            <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-neon-violet/80">
              A/B template results
            </h2>
            {variants.length === 0 ? (
              <EmptyState
                icon={Mail}
                title="No tagged variants"
                description="Tag outreach drafts as Variant A or B on the Outreach page — reply rates will compare here."
                className="py-12"
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {variants.map((v) => (
                  <div
                    key={v.variant}
                    className="rounded-xl border border-white/5 bg-ink-950/60 px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-semibold text-slate-100">
                        Variant {v.variant}
                      </span>
                      <span className="font-mono text-2xl font-semibold text-emerald-400">
                        {v.rate}
                        <span className="text-sm text-slate-500">%</span>
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {v.replied} replied · {v.total} tagged
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Radar;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="space-y-1 p-5">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" />
        <p className="text-[11px] uppercase tracking-wider">{label}</p>
      </div>
      <p className="font-mono text-3xl font-semibold text-slate-50">{value}</p>
      <p className="text-xs text-slate-500">{hint}</p>
    </Card>
  );
}

