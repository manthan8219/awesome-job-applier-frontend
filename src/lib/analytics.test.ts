import { describe, expect, it } from 'vitest';
import {
  conversionRates,
  pipelineFunnel,
  providerYield,
  toApplicationsCsv,
} from './analytics';
import type { Application } from '@/types';

function makeApp(overrides: Partial<Application>): Application {
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

describe('pipelineFunnel', () => {
  it('counts applied applications by outcome', () => {
    const apps = [
      makeApp({ outcome: '' }),
      makeApp({ id: 2, outcome: 'replied' }),
      makeApp({ id: 3, outcome: 'interview' }),
      makeApp({ id: 4, outcome: 'offer' }),
      makeApp({ id: 5, outcome: 'rejected' }),
      makeApp({ id: 6, outcome: 'ghosted' }),
      makeApp({ id: 7, outcome: 'interview', status: 'queued' }), // ignored
    ];
    const f = pipelineFunnel(apps);
    expect(f.applied).toBe(1);
    expect(f.replied).toBe(1);
    expect(f.interview).toBe(1);
    expect(f.offer).toBe(1);
    expect(f.rejected).toBe(1);
    expect(f.ghosted).toBe(1);
  });
});

describe('conversionRates', () => {
  it('computes stage-to-stage conversion percentages', () => {
    const f = pipelineFunnel([
      makeApp({ outcome: '' }),
      makeApp({ id: 2, outcome: 'replied' }),
      makeApp({ id: 3, outcome: 'interview' }),
      makeApp({ id: 4, outcome: 'offer' }),
    ]);
    const r = conversionRates(f);
    // 3 of 4 progressed past applied.
    expect(r.appliedToReplied).toBe(75);
    // 2 of 3 progressed past replied.
    expect(r.repliedToInterview).toBe(67);
    // 1 of 2 progressed past interview.
    expect(r.interviewToOffer).toBe(50);
  });

  it('never divides by zero on an empty funnel', () => {
    const r = conversionRates(pipelineFunnel([]));
    expect(r.appliedToReplied).toBe(0);
    expect(r.repliedToInterview).toBe(0);
    expect(r.interviewToOffer).toBe(0);
  });
});

describe('providerYield', () => {
  it('groups applied jobs by provider with reply rates', () => {
    const apps = [
      makeApp({ provider: 'greenhouse', outcome: '' }),
      makeApp({ id: 2, provider: 'greenhouse', outcome: 'interview' }),
      makeApp({ id: 3, provider: 'lever', outcome: 'offer' }),
      makeApp({ id: 4, provider: 'greenhouse', status: 'queued' }), // ignored
    ];
    const y = providerYield(apps);
    const gh = y.find((p) => p.provider === 'greenhouse')!;
    expect(gh.applied).toBe(2);
    expect(gh.interview).toBe(1);
    expect(gh.replyRate).toBe(50);
    const lv = y.find((p) => p.provider === 'lever')!;
    expect(lv.applied).toBe(1);
    expect(lv.replyRate).toBe(100);
  });
});

describe('toApplicationsCsv', () => {
  it('emits a header + one row per application', () => {
    const csv = toApplicationsCsv([makeApp({ company: 'Acme, Inc.' })]);
    const lines = csv.trim().split('\n');
    expect(lines[0]).toContain('id,provider,company,role,status,outcome');
    expect(lines.length).toBe(2);
    // Commas inside fields are quoted.
    expect(csv).toContain('"Acme, Inc."');
  });
});
