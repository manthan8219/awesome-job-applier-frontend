import type { AppStatus, Application, Outcome } from '@/types';

/** Statuses that mean "found but not yet applied" — the review queue. */
export function isQueueStatus(status: AppStatus): boolean {
  return status === 'queued' || status === 'dry-run';
}

export type OutcomeCounts = Record<Outcome, number>;

/** Count applied applications by pipeline outcome (the funnel). */
export function outcomeCounts(apps: Application[]): OutcomeCounts {
  const counts: OutcomeCounts = {
    '': 0,
    replied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    ghosted: 0,
  };
  for (const a of apps) {
    if (a.status === 'applied') counts[a.outcome] += 1;
  }
  return counts;
}

/** Applied applications with no response for longer than `days`. */
export function staleApplications(
  apps: Application[],
  days: number,
  now: Date = new Date(),
): Application[] {
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
  return apps.filter(
    (a) =>
      a.status === 'applied' &&
      a.outcome === '' &&
      new Date(a.appliedAt).getTime() < cutoff,
  );
}

/** How many applications were submitted today (daily-cap accounting). */
export function appliedTodayCount(
  apps: Application[],
  now: Date = new Date(),
): number {
  return apps.filter(
    (a) => a.status === 'applied' && isSameLocalDay(a.appliedAt, now),
  ).length;
}

function isSameLocalDay(iso: string, now: Date): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * The next outcome in the cycle (mirrors store.NextOutcome): from the
 * no-response state it advances to the first stage ("replied"), and after
 * the last stage it wraps back to no response.
 */
export function nextOutcome(cur: Outcome, cycle: readonly Outcome[]): Outcome {
  const idx = cycle.indexOf(cur);
  if (idx < 0) return cycle[0] ?? '';
  if (idx >= cycle.length - 1) return '';
  return cycle[idx + 1] ?? '';
}
