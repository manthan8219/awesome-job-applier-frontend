import type { Application } from '@/types';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Freshness factor for reply probability (KAN-29): recent postings reply much
 * more often than stale ones. 1.0 under 24h → 0.05 past 30d.
 */
export function freshnessFactor(postedAt: string): number {
  if (!postedAt) return 0.6;
  const posted = new Date(postedAt).getTime();
  if (Number.isNaN(posted)) return 0.6;
  const ageDays = Math.max(0, (Date.now() - posted) / DAY_MS);
  if (ageDays < 1) return 1.0;
  if (ageDays < 3) return 0.75;
  if (ageDays < 7) return 0.5;
  if (ageDays < 30) return 0.25;
  return 0.05;
}

const STAGE_FACTOR: Record<Application['outcome'], number> = {
  '': 0.4,
  replied: 0.7,
  interview: 0.85,
  offer: 1.0,
  rejected: 0,
  ghosted: 0,
};

/**
 * Reply probability = 50% fit × 30% freshness × 20% pipeline stage.
 * Returns 0-100; degrades gracefully when history is empty (0 fit).
 * Prefers the backend-computed responseScore (KAN-19) when the API provides
 * one — it factors in the provider's observed reply probability.
 */
export function scoreReplyProbability(app: Application): number {
  const backend = app.responseScore;
  if (typeof backend === 'number' && backend > 0) return backend;
  const fit = Math.max(0, Math.min(100, app.fitScore ?? 0)) / 100;
  const fresh = freshnessFactor(app.postedAt);
  const stage = STAGE_FACTOR[app.outcome] ?? 0.4;
  return Math.round((0.5 * fit + 0.3 * fresh + 0.2 * stage) * 100);
}

const EXCLUDED_STATUSES = new Set(['skipped', 'failed', 'dry-run']);

/** The top reply-probability opportunities (tie-break: higher fit first). */
export function topOpportunities(
  apps: Application[],
  n = 5,
): Application[] {
  return apps
    .filter((a) => !EXCLUDED_STATUSES.has(a.status))
    .slice()
    .sort((a, b) => {
      const scoreDiff = scoreReplyProbability(b) - scoreReplyProbability(a);
      if (scoreDiff !== 0) return scoreDiff;
      return (b.fitScore ?? 0) - (a.fitScore ?? 0);
    })
    .slice(0, n);
}

const OUTCOME_WHY: Record<Application['outcome'], string> = {
  '': 'awaiting reply',
  replied: 'in conversation',
  interview: 'interviewing',
  offer: 'offer on the table',
  rejected: 'rejected',
  ghosted: 'no reply yet',
};

/** A one-line "why this job" for the guided feed. */
export function whyLine(app: Application): string {
  const fromBackend = app.responseSummary;
  if (fromBackend?.trim()) return fromBackend;
  const bits: string[] = [];
  if ((app.fitScore ?? 0) > 0) bits.push(`fit ${app.fitScore}`);
  const fresh = freshnessFactor(app.postedAt);
  if (fresh >= 1) bits.push('posted recently');
  else if (fresh >= 0.5) bits.push('recent posting');
  else if (fresh >= 0.25) bits.push('older posting');
  else bits.push('stale posting');
  if (app.status === 'queued') bits.push('in your queue');
  else if (app.outcome) bits.push(OUTCOME_WHY[app.outcome]);
  else bits.push('awaiting reply');
  return bits.join(' · ');
}
