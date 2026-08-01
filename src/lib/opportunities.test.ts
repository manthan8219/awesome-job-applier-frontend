import { describe, expect, it } from 'vitest';
import {
  freshnessFactor,
  scoreReplyProbability,
  topOpportunities,
  whyLine,
} from './opportunities';
import type { Application } from '@/types';

function makeApp(overrides: Partial<Application>): Application {
  return {
    id: 1,
    provider: 'greenhouse',
    company: 'Acme',
    role: 'Engineer',
    url: 'https://example.com/1',
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

describe('freshnessFactor', () => {
  it('decays with posting age', () => {
    const now = Date.now();
    const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();
    expect(freshnessFactor(hoursAgo(1))).toBe(1.0);
    expect(freshnessFactor(hoursAgo(47))).toBe(0.75);
    expect(freshnessFactor(hoursAgo(72))).toBe(0.5);
    expect(freshnessFactor(hoursAgo(72 * 24))).toBe(0.05);
  });

  it('handles missing/invalid timestamps gracefully', () => {
    expect(freshnessFactor('')).toBe(0.6);
    expect(freshnessFactor('not-a-date')).toBe(0.6);
  });
});

describe('scoreReplyProbability', () => {
  it('weights fit, freshness and stage', () => {
    const fresh = new Date(Date.now() - 3600 * 1000).toISOString();
    const high = makeApp({ fitScore: 100, postedAt: fresh, outcome: 'offer' });
    const low = makeApp({ fitScore: 0, postedAt: fresh, outcome: '' });
    expect(scoreReplyProbability(high)).toBeGreaterThan(
      scoreReplyProbability(low),
    );
  });

  it('never returns negative or > 100', () => {
    const app = makeApp({ fitScore: 0, postedAt: '', outcome: 'ghosted' });
    const score = scoreReplyProbability(app);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('topOpportunities', () => {
  it('sorts by score desc and ties by fit', () => {
    const apps = [
      makeApp({ id: 1, role: 'low', fitScore: 10 }),
      makeApp({ id: 2, role: 'high', fitScore: 95 }),
      makeApp({ id: 3, role: 'medium', fitScore: 50 }),
    ];
    const top = topOpportunities(apps);
    expect(top.map((a) => a.role)).toEqual(['high', 'medium', 'low']);
  });

  it('excludes skipped/failed/dry-run and caps at n', () => {
    const apps = [
      makeApp({ id: 1, role: 'ok', fitScore: 80 }),
      makeApp({ id: 2, role: 'skip', status: 'skipped', fitScore: 99 }),
      makeApp({ id: 3, role: 'fail', status: 'failed', fitScore: 99 }),
      makeApp({ id: 4, role: 'dry', status: 'dry-run', fitScore: 99 }),
    ];
    const top = topOpportunities(apps, 1);
    expect(top).toHaveLength(1);
    expect(top[0]?.role).toBe('ok');
  });

  it('returns an empty list for no applications', () => {
    expect(topOpportunities([])).toEqual([]);
  });
  it('prefers the backend responseScore when provided (KAN-19)', () => {
    const app = makeApp({ fitScore: 10, responseScore: 88 });
    expect(scoreReplyProbability(app)).toBe(88);
  });

  it('falls back to the client estimate when responseScore is absent', () => {
    const app = makeApp({ fitScore: 100, outcome: 'offer' });
    expect(scoreReplyProbability(app)).toBe(100);
  });
});

describe('whyLine', () => {
  it('uses the backend responseSummary when present (KAN-19)', () => {
    const line = whyLine(
      makeApp({ responseSummary: 'fit 92 · posted recently · provider reply rate 50%' }),
    );
    expect(line).toBe('fit 92 · posted recently · provider reply rate 50%');
  });

  it('describes fit, freshness and stage', () => {
    const line = whyLine(
      makeApp({
        fitScore: 92,
        postedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
        outcome: 'replied',
      }),
    );
    expect(line).toContain('fit 92');
    expect(line).toContain('posted recently');
    expect(line).toContain('in conversation');
  });

  it('flags queued jobs for review', () => {
    const line = whyLine(makeApp({ status: 'queued' }));
    expect(line).toContain('in your queue');
  });
});
