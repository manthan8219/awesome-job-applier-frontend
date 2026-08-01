import { describe, expect, it } from 'vitest';
import {
  appliedTodayCount,
  isQueueStatus,
  nextOutcome,
  outcomeCounts,
  staleApplications,
} from './applications';
import type { Application } from '@/types';

function app(overrides: Partial<Application>): Application {
  return {
    id: 1,
    provider: 'greenhouse',
    company: 'Acme',
    role: 'Engineer',
    url: '',
    status: 'applied',
    reason: '',
    appliedAt: new Date().toISOString(),
    location: 'Remote',
    remote: true,
    postedAt: new Date().toISOString(),
    fitScore: 80,
    fitSummary: '',
    outcome: '',
    outcomeAt: '',
    ...overrides,
  };
}

const daysAgo = (days: number): string =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

describe('isQueueStatus', () => {
  it('treats queued and dry-run as review-queue statuses', () => {
    expect(isQueueStatus('queued')).toBe(true);
    expect(isQueueStatus('dry-run')).toBe(true);
    expect(isQueueStatus('applied')).toBe(false);
    expect(isQueueStatus('skipped')).toBe(false);
    expect(isQueueStatus('failed')).toBe(false);
  });
});

describe('outcomeCounts', () => {
  it('counts only applied applications by outcome', () => {
    const counts = outcomeCounts([
      app({ id: 1, status: 'applied', outcome: '' }),
      app({ id: 2, status: 'applied', outcome: 'interview' }),
      app({ id: 3, status: 'queued', outcome: '' }),
      app({ id: 4, status: 'skipped', outcome: '' }),
    ]);
    expect(counts['']).toBe(1);
    expect(counts.interview).toBe(1);
    expect(counts.offer).toBe(0);
  });
});

describe('staleApplications', () => {
  const now = new Date('2026-07-31T12:00:00Z');

  it('flags applied jobs with no response older than the threshold', () => {
    const stale = staleApplications(
      [
        app({ id: 1, appliedAt: daysAgo(20) }),
        app({ id: 2, appliedAt: daysAgo(5) }),
        app({ id: 3, appliedAt: daysAgo(20), outcome: 'replied' }),
        app({ id: 4, appliedAt: daysAgo(20), status: 'queued' }),
      ],
      14,
      now,
    );
    expect(stale.map((a) => a.id)).toEqual([1]);
  });
});

describe('appliedTodayCount', () => {
  const now = new Date('2026-07-31T12:00:00Z');

  it('counts applications submitted today only', () => {
    const count = appliedTodayCount(
      [
        app({ id: 1, appliedAt: '2026-07-31T08:00:00Z' }),
        app({ id: 2, appliedAt: '2026-07-30T08:00:00Z' }),
        app({ id: 3, appliedAt: '2026-07-31T09:00:00Z', status: 'queued' }),
      ],
      now,
    );
    expect(count).toBe(1);
  });
});

describe('nextOutcome', () => {
  const cycle = ['replied', 'interview', 'offer', 'rejected', 'ghosted'] as const;

  it('walks the cycle and wraps past the end', () => {
    expect(nextOutcome('', cycle)).toBe('replied');
    expect(nextOutcome('replied', cycle)).toBe('interview');
    expect(nextOutcome('ghosted', cycle)).toBe('');
  });
});
