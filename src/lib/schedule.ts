/** A stable local-date key like "2026-07-31" (used for once-per-day guards). */
export function localDayKey(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

/**
 * The next scheduled daily run as an absolute Date ("HH:MM", 24h). If the
 * time has already passed today, the run is tomorrow.
 */
export function nextRunAt(at: string, now: Date = new Date()): Date {
  const [h, m] = at.split(':').map(Number);
  const target = new Date(now);
  target.setHours(h || 0, m || 0, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

/**
 * Whether the daily dry-run should fire now: the scheduled time has passed
 * and it has not fired on this local day yet.
 */
export function shouldFireDailyRun(
  at: string,
  now: Date,
  lastFiredDay: string,
): boolean {
  if (!at) return false;
  if (lastFiredDay === localDayKey(now)) return false;
  const [h, m] = at.split(':').map(Number);
  const target = new Date(now);
  target.setHours(h || 0, m || 0, 0, 0);
  return now.getTime() >= target.getTime();
}
