import type { Application, Outcome } from '@/types';

/** Pipeline funnel counts for applied applications. */
export interface PipelineFunnel {
  applied: number;
  replied: number;
  interview: number;
  offer: number;
  rejected: number;
  ghosted: number;
}

/** Per-provider pipeline yield. */
export interface ProviderYield {
  provider: string;
  applied: number;
  replied: number;
  interview: number;
  offer: number;
  replyRate: number; // 0-100; 0 when nothing applied
}

/** stage → stage conversion rates (percent, 0-100; NaN-safe → 0). */
export interface ConversionRates {
  appliedToReplied: number;
  repliedToInterview: number;
  interviewToOffer: number;
}

const EMPTY_FUNNEL: PipelineFunnel = {
  applied: 0,
  replied: 0,
  interview: 0,
  offer: 0,
  rejected: 0,
  ghosted: 0,
};

/** Count applied applications by outcome (the pipeline funnel). */
export function pipelineFunnel(apps: Application[]): PipelineFunnel {
  const f = { ...EMPTY_FUNNEL };
  for (const a of apps) {
    if (a.status !== 'applied') continue;
    switch (a.outcome) {
      case 'replied':
        f.replied += 1;
        break;
      case 'interview':
        f.interview += 1;
        break;
      case 'offer':
        f.offer += 1;
        break;
      case 'rejected':
        f.rejected += 1;
        break;
      case 'ghosted':
        f.ghosted += 1;
        break;
      default:
        f.applied += 1;
    }
  }
  return f;
}

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

/** Conversion rates between consecutive pipeline stages. */
export function conversionRates(f: PipelineFunnel): ConversionRates {
  const reachable = f.applied + f.replied + f.interview + f.offer;
  const applied = Math.max(1, reachable);
  return {
    appliedToReplied: pct(f.replied + f.interview + f.offer, applied),
    repliedToInterview: pct(
      f.interview + f.offer,
      Math.max(1, f.replied + f.interview + f.offer),
    ),
    interviewToOffer: pct(
      f.offer,
      Math.max(1, f.interview + f.offer),
    ),
  };
}

/** Per-provider pipeline yield for applied applications. */
export function providerYield(apps: Application[]): ProviderYield[] {
  const byProvider = new Map<string, Application[]>();
  for (const a of apps) {
    if (a.status !== 'applied') continue;
    const list = byProvider.get(a.provider) ?? [];
    list.push(a);
    byProvider.set(a.provider, list);
  }
  const out: ProviderYield[] = [];
  for (const [provider, list] of byProvider) {
    const funnel = pipelineFunnel(list);
    const progressed =
      funnel.replied + funnel.interview + funnel.offer;
    out.push({
      provider,
      applied: list.length,
      replied: funnel.replied,
      interview: funnel.interview,
      offer: funnel.offer,
      replyRate: pct(progressed, list.length),
    });
  }
  return out.sort((a, b) => b.applied - a.applied);
}

/** Escape a single CSV field. */
function csvField(value: string | number | boolean): string {
  const s = String(value ?? '');
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Serialize applications as CSV for the analytics export. Uses a semicolon
 * separator so numbers stay unquoted-friendly and Excel opens it cleanly.
 */
export function toApplicationsCsv(apps: Application[]): string {
  const header = [
    'id',
    'provider',
    'company',
    'role',
    'status',
    'outcome',
    'applied_at',
    'location',
    'remote',
    'fit_score',
  ];
  const rows = apps.map((a) => [
    a.id,
    a.provider,
    a.company,
    a.role,
    a.status,
    a.outcome,
    a.appliedAt,
    a.location,
    a.remote ? 'yes' : 'no',
    a.fitScore,
  ]);
  return [header, ...rows].map((r) => r.map(csvField).join(',')).join('\n');
}

/** Human label for the outcome used in exports/funnels. */
export function outcomeLabel(o: Outcome): string {
  switch (o) {
    case 'replied':
      return 'Replied';
    case 'interview':
      return 'Interview';
    case 'offer':
      return 'Offer';
    case 'rejected':
      return 'Rejected';
    case 'ghosted':
      return 'Ghosted';
    default:
      return 'Applied';
  }
}
