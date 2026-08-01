import type { Application, MissionSnapshot, NexusConfig } from '@/types';

/** A ready-to-render MissionSnapshot (mirrors the backend /api/mission shape). */
export function makeMission(
  overrides: Partial<MissionSnapshot> = {},
): MissionSnapshot {
  return {
    engineStatus: 'idle',
    lastJob: '',
    errMsg: '',
    dryRun: false,
    autoApply: false,
    hasConsent: false,
    applied: 2,
    skipped: 1,
    failed: 1,
    appliedToday: 0,
    maxPerDay: 25,
    resumePath: '~/.nexus/resumes/ada.pdf',
    checks: [
      {
        key: 'name',
        ok: true,
        label: 'Full name',
        hint: 'Fill your name in Config',
      },
      {
        key: 'email',
        ok: true,
        label: 'Email address',
        hint: 'Fill your email in Config',
      },
      {
        key: 'resume',
        ok: true,
        label: 'Resume path',
        hint: 'Set resume path in Config',
      },
      {
        key: 'titles',
        ok: true,
        label: 'Job titles',
        hint: 'Set target job titles in Config',
      },
    ],
    resumeReady: true,
    hasTitles: true,
    aiOn: false,
    onboardingComplete: true,
    modeName: 'Queue only',
    modeHint: 'Search & queue matches for your review.',
    nextAction: 'Next: press start to search & queue (manual links).',
    providers: ['greenhouse', 'lever', 'ashby'],
    progress: {},
    foundCount: 12,
    liveFeed: [{ label: 'Cardiologist @ Acme Health', status: 'found' }],
    recent: [
      { label: 'Cardiologist @ Acme Health', status: 'applied' },
      { label: 'Staff Engineer @ Medcorp', status: 'queued' },
    ],
    ...overrides,
  };
}

/** A full profile, mostly filled out. */
export function makeConfig(overrides: Partial<NexusConfig> = {}): NexusConfig {
  return {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    phone: '+1 555 0100',
    linkedinId: 'adalovelace',
    resumePath: '~/.nexus/resumes/ada.pdf',
    city: 'London',
    yearsOfExperience: '7',
    skills: ['Go', 'SQL'],
    targetJobTitles: 'Cardiologist, Staff Engineer',
    jobIntent: 'find a job',
    workType: 'Remote',
    targetLocations: 'London, UK',
    applyConsent: true,
    applyConsentAt: new Date().toISOString(),
    maxAppsPerRun: 10,
    maxAppsPerDay: 25,
    applyDelaySec: 8,
    minFitScore: 60,
    aiAssist: false,
    aiProvider: '',
    dailyRunEnabled: false,
    dailyRunAt: '09:00',
    ...overrides,
  };
}

/** A minimal application (the JobsPage.test.tsx shape, shared). */
export function makeApp(overrides: Partial<Application> = {}): Application {
  return {
    id: 1,
    provider: 'greenhouse',
    company: 'Acme Health',
    role: 'Cardiologist',
    url: 'https://boards.greenhouse.io/acmehealth/1',
    status: 'queued',
    reason: 'awaiting your approval',
    appliedAt: new Date().toISOString(),
    location: 'Remote',
    remote: true,
    postedAt: new Date().toISOString(),
    fitScore: 92,
    fitSummary: 'strong match',
    outcome: '',
    outcomeAt: '',
    approved: false,
    ...overrides,
  };
}
