import { describe, expect, it } from 'vitest';
import { localDayKey, nextRunAt, shouldFireDailyRun } from './schedule';

describe('localDayKey', () => {
  it('formats a stable local date key', () => {
    expect(localDayKey(new Date(2026, 6, 31, 23, 59))).toBe('2026-07-31');
  });
});

describe('nextRunAt', () => {
  it('returns today when the time has not passed yet', () => {
    const now = new Date(2026, 6, 31, 8, 0);
    const next = nextRunAt('09:00', now);
    expect(next.getDate()).toBe(31);
    expect(next.getHours()).toBe(9);
    expect(next.getMinutes()).toBe(0);
  });

  it('rolls to tomorrow when the time has passed', () => {
    const now = new Date(2026, 6, 31, 10, 0);
    const next = nextRunAt('09:00', now);
    expect(next.getDate()).toBe(1); // Aug 1
    expect(next.getHours()).toBe(9);
  });
});

describe('shouldFireDailyRun', () => {
  const now = new Date(2026, 6, 31, 10, 0);
  const today = localDayKey(now);

  it('fires once the scheduled time has passed and the day is fresh', () => {
    expect(shouldFireDailyRun('09:00', now, '')).toBe(true);
  });

  it('does not fire twice on the same day', () => {
    expect(shouldFireDailyRun('09:00', now, today)).toBe(false);
  });

  it('does not fire before the scheduled time', () => {
    expect(shouldFireDailyRun('11:00', now, '')).toBe(false);
  });

  it('never fires when no time is configured', () => {
    expect(shouldFireDailyRun('', now, '')).toBe(false);
  });
});
