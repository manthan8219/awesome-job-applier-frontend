import type {
  AppStatus,
  Application,
  DashRecent,
  EngineStatus,
  LiveStatus,
  MissionSnapshot,
  NexusConfig,
  Outcome,
  ProviderStatus,
  ReadyCheck,
} from '@/types';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(
  /\/$/,
  '',
);

/**
 * When VITE_USE_MOCK is not "false", the UI serves a synthetic Mission Control
 * that mirrors the TUI dashboard. Swap to the real backend by setting the flag
 * to false — every method below already has a real-HTTP branch.
 */
const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false';

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = (await res.json()) as { message?: string };
      message = body.message ?? message;
    } catch {
      // body was not JSON; keep the status text
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/* -------------------------------------------------------------------------- */
/*                              Mock dataset                                  */
/* -------------------------------------------------------------------------- */

const PROVIDERS = [
  'greenhouse',
  'lever',
  'ashby',
  'workday',
  'remoteok',
  'hackernews',
  'remotive',
  'himalayas',
  'weworkremotely',
] as const;

const ROLES = [
  'Senior Backend Engineer',
  'Staff Platform Engineer',
  'Backend (Go)',
  'Distributed Systems Engineer',
  'Site Reliability Engineer',
  'Full-Stack Engineer',
  'Infra Engineer',
  'API Engineer',
];

const COMPANIES = [
  'Stripe',
  'Vercel',
  'Linear',
  'Datadog',
  'Supabase',
  'PostHog',
  'Render',
  'Fly.io',
  'Sentry',
  'PlanetScale',
  'Tailscale',
  'Cloudflare',
];

const mockConfig: NexusConfig = {
  firstName: 'Alex',
  lastName: 'Morgan',
  email: 'alex@example.com',
  phone: '+1 555 0100',
  linkedinId: 'alexmorgan',
  resumePath: 'resume.pdf',
  city: 'Remote',
  yearsOfExperience: '7',
  targetJobTitles: 'Backend Engineer, Platform Engineer',
  jobIntent: 'Go-heavy backend / platform roles, remote, async teams',
  workType: 'Remote',
  targetLocations: 'Worldwide',
  applyConsent: true,
  applyConsentAt: new Date(Date.now() - 86_400_000).toISOString(),
  maxAppsPerRun: 10,
  maxAppsPerDay: 25,
  applyDelaySec: 8,
  minFitScore: 70,
  aiAssist: true,
  aiProvider: 'local',
  anthropicKey: '',
  openAIKey: '',
  localLLMURL: '',
  localLLMModel: '',
  companyBlocklist: '',
  gmailAppPassword: '',
  hunterKey: '',
  apolloKey: '',
  linkedInSessionCookie: '',
  discordWebhookURL: '',
  telegramBotToken: '',
  telegramChatID: '',
  linkedInKey: '',
  indeedKey: '',
  currency: 'USD',
  minSalary: '120000',
  workAuth: 'authorized',
  noticePeriodDays: 30,
  officeDaysPerWeek: 3,
  coverLetterMode: 'off',
  coverLetterText: '',
  scraperTargets: '',
};

function isoAgoMin(min: number): string {
  return new Date(Date.now() - min * 60_000).toISOString();
}

function makeApp(
  id: number,
  provider: string,
  company: string,
  role: string,
  status: AppStatus,
  appliedAt: string,
  fitScore: number,
  reason: string,
): Application {
  return {
    id,
    provider,
    company,
    role,
    url: `https://${provider}.example/${company.toLowerCase()}/${id}`,
    status,
    reason,
    appliedAt,
    location: company === 'PostHog' ? 'Berlin' : 'Remote',
    remote: true,
    postedAt: appliedAt,
    fitScore,
    fitSummary: fitScore ? `strong Go/systems match (${fitScore})` : '',
    outcome: '',
    outcomeAt: '',
  };
}

const mockApps: Application[] = [
  makeApp(
    1,
    'greenhouse',
    'Stripe',
    'Senior Backend Engineer',
    'applied',
    isoAgoMin(12),
    88,
    '',
  ),
  makeApp(
    2,
    'lever',
    'Linear',
    'Staff Platform Engineer',
    'applied',
    isoAgoMin(40),
    91,
    '',
  ),
  makeApp(
    3,
    'ashby',
    'Datadog',
    'Distributed Systems Engineer',
    'skipped',
    isoAgoMin(70),
    0,
    'fit 61 < min 70',
  ),
  makeApp(
    4,
    'remoteok',
    'Supabase',
    'Backend (Go)',
    'applied',
    isoAgoMin(180),
    83,
    '',
  ),
  makeApp(
    5,
    'hackernews',
    'PostHog',
    'Full-Stack Engineer',
    'failed',
    isoAgoMin(320),
    0,
    'form captcha stop',
  ),
  makeApp(
    6,
    'remotive',
    'Render',
    'Infra Engineer',
    'applied',
    isoAgoMin(500),
    79,
    '',
  ),
  makeApp(
    7,
    'greenhouse',
    'Sentry',
    'Site Reliability Engineer',
    'skipped',
    isoAgoMin(700),
    0,
    'location mismatch',
  ),
  makeApp(
    8,
    'lever',
    'PlanetScale',
    'API Engineer',
    'applied',
    isoAgoMin(900),
    85,
    '',
  ),
];

/* -------------------------------------------------------------------------- */
/*                          Mock run state machine                             */
/* -------------------------------------------------------------------------- */

interface RunState {
  status: EngineStatus;
  dryRun: boolean;
  autoApply: boolean;
  foundCount: number;
  liveFeed: DashRecent[];
  progress: Record<string, ProviderStatus>;
  lastJob: string;
  errMsg: string;
  pending: string[];
  current: string | null;
  timer: ReturnType<typeof setInterval> | null;
}

const run: RunState = {
  status: 'idle',
  dryRun: false,
  autoApply: false,
  foundCount: 0,
  liveFeed: [],
  progress: {},
  lastJob: '',
  errMsg: '',
  pending: [],
  current: null,
  timer: null,
};

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function computeChecks(cfg: NexusConfig): ReadyCheck[] {
  const resumeReady = cfg.resumePath.trim() !== '';
  const hasTitles =
    cfg.targetJobTitles.trim() !== '' || cfg.jobIntent.trim() !== '';
  const hasConsent = cfg.applyConsent === true;
  const aiOn = cfg.aiAssist === true;
  return [
    {
      key: 'resume',
      ok: resumeReady,
      label: 'Resume ready',
      hint: 'Resume missing or invalid — set in Config',
    },
    {
      key: 'titles',
      ok: hasTitles,
      label: 'Target titles set',
      hint: 'Config → describe the job you want (AI fills titles)',
    },
    {
      key: 'consent',
      ok: hasConsent,
      label: 'Apply consent given',
      hint: 'Give Apply Consent in Config → Apply Safety',
    },
    {
      key: 'ai',
      ok: aiOn,
      label: 'AI Assist on',
      hint: 'AI Assist off (optional — better answers when on)',
    },
  ];
}

function modeCopy(
  s: RunState,
  hasConsent: boolean,
): { name: string; hint: string } {
  if (s.status === 'running')
    return {
      name: 'Running',
      hint: 'Engine is searching / applying — press stop to halt',
    };
  if (s.dryRun)
    return {
      name: 'Dry run',
      hint: 'Searches boards and logs matches — does not submit applications',
    };
  if (s.autoApply && hasConsent)
    return {
      name: 'Auto apply (armed)',
      hint: 'Will submit real applications within your daily/run caps',
    };
  return {
    name: 'Queue only',
    hint: 'Finds jobs and records “apply manually” links — safe default',
  };
}

function nextAction(
  s: RunState,
  resumeReady: boolean,
  hasTitles: boolean,
  hasConsent: boolean,
): string {
  if (s.status === 'running')
    return 'Running… watch Providers below, or press stop';
  if (!resumeReady)
    return 'Next: set a valid Resume Path in Config (or pick a Nexus PDF)';
  if (!hasTitles)
    return 'Next: in Config, describe the job you want — AI fills titles';
  if (!hasConsent)
    return 'Next: open Config → Apply Safety → set Apply Consent to Yes';
  if (s.dryRun)
    return 'Next: press start to dry-run (safe). Turn dry run off when ready to queue/apply';
  if (s.autoApply && hasConsent)
    return 'Next: press start to run with Auto Apply armed — real submissions';
  return 'Next: press start to search & queue (manual links). Toggle Auto Apply only when ready';
}

function computeStats(apps: Application[]): {
  applied: number;
  skipped: number;
  failed: number;
  appliedToday: number;
} {
  let applied = 0;
  let skipped = 0;
  let failed = 0;
  let appliedToday = 0;
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  for (const a of apps) {
    if (a.status === 'applied') {
      applied++;
      if (new Date(a.appliedAt) >= startToday) appliedToday++;
    } else if (a.status === 'skipped') skipped++;
    else if (a.status === 'failed') failed++;
  }
  return { applied, skipped, failed, appliedToday };
}

function toRecent(a: Application): DashRecent {
  return { label: `${a.role} @ ${a.company}`, status: a.status as LiveStatus };
}

function buildSnapshot(): MissionSnapshot {
  const cfg = mockConfig;
  const checks = computeChecks(cfg);
  const resumeReady = checks[0]!.ok;
  const hasTitles = checks[1]!.ok;
  const hasConsent = checks[2]!.ok;
  const aiOn = checks[3]!.ok;
  const stats = computeStats(mockApps);
  const recent = [...mockApps]
    .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))
    .slice(0, 6)
    .map(toRecent);
  const mode = modeCopy(run, hasConsent);
  return {
    engineStatus: run.status,
    lastJob: run.lastJob,
    errMsg: run.errMsg,
    dryRun: run.dryRun,
    autoApply: run.autoApply,
    hasConsent,
    applied: stats.applied,
    skipped: stats.skipped,
    failed: stats.failed,
    appliedToday: stats.appliedToday,
    maxPerDay: cfg.maxAppsPerDay || 25,
    resumePath: cfg.resumePath,
    checks,
    resumeReady,
    hasTitles,
    aiOn,
    onboardingComplete: resumeReady && hasTitles && hasConsent,
    modeName: mode.name,
    modeHint: mode.hint,
    nextAction: nextAction(run, resumeReady, hasTitles, hasConsent),
    providers: [...PROVIDERS],
    progress: { ...run.progress },
    foundCount: run.foundCount,
    liveFeed: run.liveFeed.slice(0, 10),
    recent,
  };
}

function beginRun(input: { dryRun: boolean; autoApply: boolean }): void {
  if (run.status === 'running') return;
  run.dryRun = input.dryRun;
  run.autoApply = input.autoApply && mockConfig.applyConsent;
  run.status = 'running';
  run.foundCount = 0;
  run.liveFeed = [];
  run.progress = {};
  run.lastJob = '';
  run.errMsg = '';
  run.pending = [...PROVIDERS];
  run.current = null;
  if (run.timer) clearInterval(run.timer);
  run.timer = setInterval(tick, 1200);
}

function haltRun(): void {
  if (run.timer) {
    clearInterval(run.timer);
    run.timer = null;
  }
  run.status = 'stopped';
  run.current = null;
  run.pending = [];
}

function tick(): void {
  if (run.current) {
    run.progress[run.current] = 'done';
    const found = 1 + Math.floor(Math.random() * 3);
    run.foundCount += found;
    const label = `${pick(ROLES)} @ ${pick(COMPANIES)}`;
    run.lastJob = label;
    let st: LiveStatus;
    if (run.dryRun) st = 'dry-run';
    else if (run.autoApply) {
      const r = Math.random();
      st = r < 0.6 ? 'applied' : r < 0.8 ? 'skipped' : 'failed';
    } else st = 'queued';
    const feed: DashRecent[] = [
      { label, status: 'found' },
      { label, status: st },
    ];
    run.liveFeed = [...feed, ...run.liveFeed].slice(0, 40);
    run.current = null;
  } else if (run.pending.length > 0) {
    run.current = run.pending.shift() ?? null;
    if (run.current) run.progress[run.current] = 'searching';
  } else {
    if (run.timer) {
      clearInterval(run.timer);
      run.timer = null;
    }
    run.status = 'done';
  }
}

/* -------------------------------------------------------------------------- */
/*                              Public API surface                            */
/* -------------------------------------------------------------------------- */

export const api = {
  async getMission(): Promise<MissionSnapshot> {
    if (USE_MOCK) {
      await delay(200);
      return buildSnapshot();
    }
    return request<MissionSnapshot>('/mission');
  },

  async getConfig(): Promise<NexusConfig> {
    if (USE_MOCK) {
      await delay(150);
      return { ...mockConfig };
    }
    return request<NexusConfig>('/config');
  },

  async startRun(input: {
    dryRun: boolean;
    autoApply: boolean;
  }): Promise<void> {
    if (USE_MOCK) {
      await delay(250);
      beginRun(input);
      return;
    }
    await request('/run', { method: 'POST', body: JSON.stringify(input) });
  },

  async stopRun(): Promise<void> {
    if (USE_MOCK) {
      await delay(150);
      haltRun();
      return;
    }
    await request('/run', { method: 'DELETE' });
  },

  async toggleDryRun(on: boolean): Promise<void> {
    if (USE_MOCK) {
      await delay(120);
      run.dryRun = on;
      run.errMsg = '';
      return;
    }
    await request('/config', {
      method: 'PATCH',
      body: JSON.stringify({ dry_run: on }),
    });
  },

  async toggleAutoApply(on: boolean): Promise<void> {
    if (USE_MOCK) {
      await delay(120);
      if (on && !mockConfig.applyConsent) {
        run.errMsg = 'Auto Apply needs Apply Consent in Config';
        run.autoApply = false;
        return;
      }
      run.autoApply = on;
      run.errMsg = '';
      return;
    }
    await request('/config', {
      method: 'PATCH',
      body: JSON.stringify({ auto_apply: on }),
    });
  },

  async saveConfig(cfg: NexusConfig): Promise<NexusConfig> {
    if (USE_MOCK) {
      await delay(200);
      Object.assign(mockConfig, cfg);
      return { ...mockConfig };
    }
    return request<NexusConfig>('/config', {
      method: 'PUT',
      body: JSON.stringify(cfg),
    });
  },

  /* ---------------------------- Resume surface ---------------------------- */

  async getResumeAnalysis(): Promise<ResumeAnalysis> {
    if (USE_MOCK) {
      await delay(150);
      return structuredClone(mockResumeAnalysis);
    }
    return request<ResumeAnalysis>('/resume/analyze');
  },

  async reanalyzeResume(): Promise<ResumeAnalysis> {
    if (USE_MOCK) {
      // Simulate the AI re-reading the resume.
      await delay(1400);
      return structuredClone(mockResumeAnalysis);
    }
    return request<ResumeAnalysis>('/resume/analyze', { method: 'POST' });
  },

  async getResumeProjects(): Promise<WorkProject[]> {
    if (USE_MOCK) {
      await delay(120);
      return mockProjects.map((p) => ({ ...p }));
    }
    return request<WorkProject[]>('/resume/projects');
  },

  async saveResumeProject(project: WorkProject): Promise<WorkProject> {
    if (USE_MOCK) {
      await delay(180);
      const id = project.id || `p${Date.now()}`;
      const idx = mockProjects.findIndex((p) => p.id === project.id);
      const next: WorkProject = { ...project, id };
      if (idx >= 0) {
        mockProjects[idx] = next;
      } else {
        mockProjects = [next, ...mockProjects];
      }
      return { ...next };
    }
    return request<WorkProject>('/resume/projects', {
      method: 'PUT',
      body: JSON.stringify(project),
    });
  },

  async deleteResumeProject(id: string): Promise<void> {
    if (USE_MOCK) {
      await delay(150);
      mockProjects = mockProjects.filter((p) => p.id !== id);
      return;
    }
    await request(`/resume/projects/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async getResumeSkills(): Promise<string[]> {
    if (USE_MOCK) {
      await delay(100);
      return [...mockSkills];
    }
    return request<string[]>('/resume/skills');
  },

  async saveResumeSkills(skills: string[]): Promise<string[]> {
    if (USE_MOCK) {
      await delay(160);
      mockSkills = [...skills];
      // Mirror the TUI: skills live on the persisted config so the engine
      // and resume rewriter can read them.
      mockConfig.skills = [...skills];
      return [...mockSkills];
    }
    return request<string[]>('/resume/skills', {
      method: 'PUT',
      body: JSON.stringify({ skills }),
    });
  },

  async improveResume(input: ImproveRequest): Promise<ImproveOutput> {
    if (USE_MOCK) {
      // Simulate the polish loop writing files to ~/.nexus/resumes/.
      await delay(1800);
      const note = input.formats.includes('pdf')
        ? 'PDF rendered via native fallback'
        : undefined;
      return { ...mockImproveOutput, pdfNote: note };
    }
    return request<ImproveOutput>('/resume/improve', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  /* ------------------------------ Jobs surface ------------------------------ */

  async getApplications(query?: string): Promise<Application[]> {
    if (USE_MOCK) {
      await delay(150);
      const tokens = (query ?? '')
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
      let out = mockApps.map((a) => ({ ...a }));
      if (tokens.length) {
        out = out.filter((a) => {
          const hay = [
            a.company,
            a.role,
            a.provider,
            a.status,
            a.location,
            a.url,
            a.reason,
            a.fitSummary,
            String(a.fitScore),
          ]
            .join(' ')
            .toLowerCase();
          return tokens.every((t) => hay.includes(t));
        });
      }
      return out.sort((x, y) => y.appliedAt.localeCompare(x.appliedAt));
    }
    const q = query ? `?q=${encodeURIComponent(query)}` : '';
    return request<Application[]>(`/jobs${q}`);
  },

  async setApplicationOutcome(
    id: number,
    outcome: Outcome,
  ): Promise<Application> {
    if (USE_MOCK) {
      await delay(120);
      const a = mockApps.find((x) => x.id === id);
      if (!a) throw new ApiError(404, 'application not found');
      a.outcome = outcome;
      a.outcomeAt = outcome ? new Date().toISOString() : '';
      return { ...a };
    }
    return request<Application>(`/jobs/${id}/outcome`, {
      method: 'PATCH',
      body: JSON.stringify({ outcome }),
    });
  },

  /* ---------------------------- Companies surface --------------------------- */

  async getCompanies(
    query?: string,
    country?: string,
  ): Promise<CompaniesResult> {
    if (USE_MOCK) {
      await delay(140);
      const q = (query ?? '').trim().toLowerCase();
      const c = (country ?? '').trim().toLowerCase();
      let items = mockCompanies.map((x) => ({
        ...x,
        hireCountries: [...x.hireCountries],
      }));
      if (q)
        items = items.filter(
          (x) =>
            x.name.toLowerCase().includes(q) ||
            x.ats.toLowerCase().includes(q) ||
            x.boardURL.toLowerCase().includes(q),
        );
      if (c)
        items = items.filter((x) =>
          x.hireCountries.some((h) => h.toLowerCase().includes(c)),
        );
      const counts: Record<string, number> = {};
      for (const x of items)
        counts[companyKey(x.name)] = mockApps.filter(
          (a) => a.company.toLowerCase() === x.name.toLowerCase(),
        ).length;
      return { items, total: mockCompanies.length, counts };
    }
    const qs = new URLSearchParams();
    if (query) qs.set('q', query);
    if (country) qs.set('country', country);
    const s = qs.toString();
    return request<CompaniesResult>(`/companies${s ? `?${s}` : ''}`);
  },

  async saveCompany(input: CompanyInput): Promise<Company> {
    if (USE_MOCK) {
      await delay(180);
      const id = input.id ?? Date.now();
      const existing = mockCompanies.find((x) => x.id === input.id);
      const next: Company = {
        id,
        name: input.name,
        website: input.website,
        ats: input.ats,
        board: '',
        boardURL: input.boardURL,
        hireCountries: input.countries
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        hqCountry: existing?.hqCountry ?? '',
        kind: existing?.kind ?? '',
        industry: existing?.industry ?? '',
        source: 'manual',
        updatedAt: new Date().toISOString(),
      };
      if (existing) Object.assign(existing, next);
      else mockCompanies = [next, ...mockCompanies];
      return { ...next };
    }
    return request<Company>('/companies', {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  async refreshCompanies(): Promise<number> {
    if (USE_MOCK) {
      await delay(900);
      return 12; // simulated network upserts
    }
    return request<number>('/companies/refresh', { method: 'POST' });
  },

  async getCompanyJobs(name: string): Promise<Application[]> {
    if (USE_MOCK) {
      await delay(120);
      return mockApps
        .filter((a) => a.company.toLowerCase() === name.toLowerCase())
        .map((a) => ({ ...a }));
    }
    return request<Application[]>(
      `/companies/${encodeURIComponent(name)}/jobs`,
    );
  },

  /* ---------------------------- Contacts surface --------------------------- */

  async searchContacts(
    company: string,
    domain: string,
  ): Promise<ContactSearchResult> {
    if (USE_MOCK) {
      await delay(1300);
      const base =
        domain || `${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
      const seed = mockContactSeed(company, base);
      return {
        contacts: seed,
        sources: ['hunter', 'apollo', 'github', 'osint', 'pattern'],
        errors: [],
      };
    }
    return request<ContactSearchResult>('/contacts/search', {
      method: 'POST',
      body: JSON.stringify({ company, domain }),
    });
  },

  async getSavedContacts(): Promise<OsintContact[]> {
    if (USE_MOCK) {
      await delay(100);
      return mockSavedContacts.map((c) => ({ ...c }));
    }
    return request<OsintContact[]>('/contacts');
  },

  async saveContact(c: OsintContact): Promise<OsintContact> {
    if (USE_MOCK) {
      await delay(150);
      const id = c.id || Date.now();
      const next = { ...c, id };
      const idx = mockSavedContacts.findIndex((x) => x.id === id);
      if (idx >= 0) mockSavedContacts[idx] = next;
      else mockSavedContacts = [next, ...mockSavedContacts];
      return { ...next };
    }
    return request<OsintContact>('/contacts', {
      method: 'PUT',
      body: JSON.stringify(c),
    });
  },

  async deleteContact(id: number): Promise<void> {
    if (USE_MOCK) {
      await delay(120);
      mockSavedContacts = mockSavedContacts.filter((c) => c.id !== id);
      return;
    }
    await request(`/contacts/${id}`, { method: 'DELETE' });
  },

  /* ---------------------------- Outreach surface ---------------------------- */

  async getOutreachItems(): Promise<OutreachItem[]> {
    if (USE_MOCK) {
      await delay(120);
      return mockOutreachItems.map((i) => ({ ...i }));
    }
    return request<OutreachItem[]>('/outreach/items');
  },

  async getOutreachSetup(): Promise<OutreachSetup> {
    if (USE_MOCK) {
      await delay(100);
      return {
        consent: Boolean(mockConfig.outreachConsent),
        mode: (mockConfig.outreachMode ?? 'confirm') as OutreachMode,
        maxEmailsPerDay: mockConfig.maxEmailsPerDay ?? 20,
        maxLinkedInPerDay: mockConfig.maxLinkedInPerDay ?? 15,
        aiCompose: Boolean(mockConfig.outreachAICompose),
        aiReview: Boolean(mockConfig.outreachAIReview),
      };
    }
    return request<OutreachSetup>('/outreach/setup');
  },

  async saveOutreachSetup(setup: OutreachSetup): Promise<OutreachSetup> {
    if (USE_MOCK) {
      await delay(160);
      Object.assign(mockConfig, {
        outreachConsent: setup.consent,
        outreachMode: setup.mode,
        maxEmailsPerDay: setup.maxEmailsPerDay,
        maxLinkedInPerDay: setup.maxLinkedInPerDay,
        outreachAICompose: setup.aiCompose,
        outreachAIReview: setup.aiReview,
      });
      return { ...setup };
    }
    return request<OutreachSetup>('/outreach/setup', {
      method: 'PUT',
      body: JSON.stringify(setup),
    });
  },

  async buildOutreachQueue(channel: OutreachChannel): Promise<OutreachItem[]> {
    if (USE_MOCK) {
      await delay(1500);
      const made: OutreachItem[] = mockApps
        .filter((a) => a.status === 'applied')
        .slice(0, 4)
        .map((a, i) => ({
          id: `o-${channel}-${Date.now()}-${i}`,
          channel,
          jobURL: a.url,
          company: a.company,
          role: a.role,
          provider: a.provider,
          contactName: 'Hiring Team',
          contactEmail:
            channel === 'email'
              ? `careers@${a.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
              : '',
          contactSource: 'pattern',
          subject:
            channel === 'email' ? `Interest in ${a.role} at ${a.company}` : '',
          body:
            channel === 'email'
              ? mockEmailBody(a.company, a.role)
              : `Open ${a.company} ${a.role} role and connect with the recruiter.`,
          status: 'draft',
          auto: false,
          reviewScore: 0,
          attempts: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
      mockOutreachItems = [...made, ...mockOutreachItems];
      return made.map((i) => ({ ...i }));
    }
    return request<OutreachItem[]>('/outreach/build', {
      method: 'POST',
      body: JSON.stringify({ channel }),
    });
  },

  async sendOutreachItem(id: string): Promise<OutreachItem> {
    if (USE_MOCK) {
      await delay(700);
      const it = mockOutreachItems.find((x) => x.id === id);
      if (!it) throw new ApiError(404, 'outreach item not found');
      it.status = it.channel === 'email' ? 'sent' : 'opened';
      it.sentAt = new Date().toISOString();
      it.updatedAt = it.sentAt;
      it.attempts = (it.attempts ?? 0) + 1;
      mockOutreachLog = [
        {
          id: Date.now(),
          channel: it.channel,
          jobURL: it.jobURL,
          company: it.company,
          role: it.role,
          contactName: it.contactName ?? '',
          contactEmail: it.contactEmail ?? '',
          contactSource: it.contactSource ?? '',
          subject: it.subject ?? '',
          body: it.body,
          status: it.channel === 'email' ? 'sent' : 'opened',
          error: '',
          reviewScore: it.reviewScore ?? 0,
          attempts: it.attempts,
          createdAt: it.createdAt,
          sentAt: it.sentAt,
        } as OutreachLogEntry,
        ...mockOutreachLog,
      ];
      return { ...it };
    }
    return request<OutreachItem>(`/outreach/items/${id}/send`, {
      method: 'POST',
    });
  },

  async getOutreachLog(): Promise<OutreachLogEntry[]> {
    if (USE_MOCK) {
      await delay(120);
      return mockOutreachLog.map((e) => ({ ...e }));
    }
    return request<OutreachLogEntry[]>('/outreach/log');
  },

  /* ------------------------------ Logs surface ------------------------------ */

  async getLogs(filter?: string): Promise<{ lines: string[]; filter: string }> {
    if (USE_MOCK) {
      await delay(100);
      const f = (filter ?? '').trim().toLowerCase();
      const lines = f
        ? mockLogLines.filter((l) => l.toLowerCase().includes(f))
        : [...mockLogLines];
      return { lines, filter: f };
    }
    const q = filter ? `?q=${encodeURIComponent(filter)}` : '';
    return request<{ lines: string[]; filter: string }>(`/logs${q}`);
  },

  async clearLogs(): Promise<void> {
    if (USE_MOCK) {
      await delay(80);
      mockLogLines = [];
      return;
    }
    await request('/logs', { method: 'DELETE' });
  },

  async getUsage(): Promise<UsageSnapshot> {
    if (USE_MOCK) {
      await delay(120);
      return { ...mockUsage, collectedAt: new Date().toISOString() };
    }
    return request<UsageSnapshot>('/usage');
  },
};

/* -------------------------------------------------------------------------- */
/*  Resume mock data                                                          */
/* -------------------------------------------------------------------------- */
import type {
  ImproveOutput,
  ImproveRequest,
  ResumeAnalysis,
  WorkProject,
} from '@/types/resume';
import type { Company, CompanyInput, CompaniesResult } from '@/types/companies';
import type { OsintContact, ContactSearchResult } from '@/types/contacts';
import type {
  OutreachChannel,
  OutreachItem,
  OutreachLogEntry,
  OutreachMode,
  OutreachSetup,
} from '@/types/outreach';
import type { UsageSnapshot } from '@/types/usage';

const mockResumeAnalysis: ResumeAnalysis = {
  valid: true,
  fileType: 'PDF',
  message: 'PDF · 12 resume keywords found · AI profile ready',
  profile: {
    summary:
      'Backend engineer with 7 years of experience shipping distributed systems at scale. Strong Go fundamentals with production experience in gRPC, event-driven architectures, and cloud-native infrastructure. Resume is well-structured but leans heavily on tool listings over measurable impact.',
    whatsGood: [
      'Clear progression from junior to senior roles with increasing ownership',
      'Quantified impact on 3 out of 5 projects (revenue, latency, scale)',
      'Strong Go and distributed systems experience with production evidence',
      'Good use of action verbs and technical specificity in bullet points',
      'Clean formatting — easy to scan in 6 seconds',
    ],
    whatsWrong: [
      'Two projects lack any measurable outcome — read as filler',
      'Skills section is a laundry list (18 items) with no prioritization',
      'No mention of on-call, incident response, or production ownership',
      'Education section buries a relevant MS in CS below experience',
      'Summary is generic — does not differentiate from other backend engineers',
    ],
    strengths: [
      'Go systems design',
      'Distributed systems',
      'Production ownership',
      'Technical writing',
      'Mentoring',
    ],
    strengthScores: [
      { name: 'Go systems design', score: 9 },
      { name: 'Distributed systems', score: 8 },
      { name: 'Production ownership', score: 7 },
      { name: 'Technical writing', score: 6 },
      { name: 'Mentoring', score: 5 },
    ],
    suitableRoles: [
      'Senior Backend Engineer',
      'Platform Engineer',
      'Infrastructure Engineer',
      'Site Reliability Engineer',
      'Staff Engineer (Backend)',
    ],
    roleFit: [
      { name: 'Senior Backend Engineer', score: 9 },
      { name: 'Platform Engineer', score: 8 },
      { name: 'Infrastructure Engineer', score: 7 },
      { name: 'SRE', score: 6 },
      { name: 'Staff Engineer', score: 5 },
    ],
    skills: [
      'Go',
      'gRPC',
      'PostgreSQL',
      'Redis',
      'Kafka',
      'Kubernetes',
      'AWS',
      'Terraform',
    ],
    skillScores: [
      { name: 'Go', score: 9 },
      { name: 'gRPC', score: 8 },
      { name: 'PostgreSQL', score: 8 },
      { name: 'Kafka', score: 7 },
      { name: 'Kubernetes', score: 7 },
      { name: 'AWS', score: 6 },
      { name: 'Terraform', score: 5 },
    ],
    experienceLevel: 'senior',
    yearsEstimate: 7,
    industries: [
      'Fintech',
      'SaaS',
      'Infrastructure',
      'Developer Tools',
      'Healthcare',
    ],
    improvements: [
      'Add metrics to the two projects that lack them — even "reduced build time by 40%" counts.',
      'Trim skills section to 8–10 prioritized items, grouped by category (languages / infra / tools).',
      'Mention on-call or incident response experience — signals production maturity.',
      'Move Education above Experience if the MS is from a relevant program.',
      'Rewrite the summary to lead with your strongest differentiator (e.g. "shipped 3 payment systems processing $XM/mo").',
    ],
  },
};

let mockProjects: WorkProject[] = [
  {
    id: 'p1',
    name: 'Payments API',
    repo: 'github.com/acme/payments-api',
    period: '2024 – Present',
    role: 'Senior Backend Engineer',
    summary:
      '- Led rewrite of payment processing pipeline, reducing p99 latency from 1200ms to 180ms\n- Designed idempotency layer handling 50M+ daily transactions\n- Mentored 3 junior engineers on Go concurrency patterns',
  },
  {
    id: 'p2',
    name: 'Event Bus',
    repo: 'github.com/acme/event-bus',
    period: '2023 – 2024',
    role: 'Backend Engineer',
    summary:
      '- Built Kafka-based event streaming platform serving 12 downstream services\n- Implemented exactly-once delivery guarantees with DLQ fallback\n- Reduced cross-service data sync failures by 85%',
  },
];

let mockSkills: string[] = [
  'Go',
  'gRPC',
  'PostgreSQL',
  'Kafka',
  'Kubernetes',
  'AWS',
  'Terraform',
  'Redis',
];

const mockImproveOutput: ImproveOutput = {
  previewMD: `# Alex Morgan

**Senior Backend Engineer** · San Francisco · alex@example.com

## Summary
Shipped 3 production payment systems processing $40M+/mo. 7 years of Go and distributed systems experience with measurable impact on latency, scale, and team growth.

## Experience

### Senior Backend Engineer — Acme Corp (2024 – Present)
- Led rewrite of payment processing pipeline, reducing p99 latency from 1200ms to 180ms
- Designed idempotency layer handling 50M+ daily transactions
- Mentored 3 junior engineers on Go concurrency patterns

### Backend Engineer — Acme Corp (2023 – 2024)
- Built Kafka-based event streaming platform serving 12 downstream services
- Implemented exactly-once delivery guarantees with DLQ fallback
- Reduced cross-service data sync failures by 85%

## Skills
**Languages:** Go, Python, SQL  
**Infrastructure:** Kubernetes, AWS, Terraform  
**Data:** PostgreSQL, Redis, Kafka  
**Tools:** gRPC, Protobuf, Docker`,
  dir: '~/.nexus/resumes/alex-morgan-senior-backend',
  review: {
    summary: 'Strong resume with clear impact metrics',
    atsScore: 87,
    qualityScore: 82,
  },
};
/* -------------------------------------------------------------------------- */
/*  Companies / Contacts / Outreach / Logs mock data                         */
/* -------------------------------------------------------------------------- */

function companyKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

let mockCompanies: Company[] = [
  {
    id: 1,
    name: 'Stripe',
    website: 'https://stripe.com',
    ats: 'greenhouse',
    board: 'stripe',
    boardURL: 'https://boards.greenhouse.io/stripe',
    hireCountries: ['US', 'Remote'],
    hqCountry: 'US',
    kind: 'tech',
    industry: 'Fintech',
    source: 'openjobs',
    updatedAt: isoAgoMin(600),
  },
  {
    id: 2,
    name: 'Linear',
    website: 'https://linear.app',
    ats: 'greenhouse',
    board: 'linear',
    boardURL: 'https://boards.greenhouse.io/linear',
    hireCountries: ['Remote'],
    hqCountry: 'US',
    kind: 'startup',
    industry: 'Developer Tools',
    source: 'openjobs',
    updatedAt: isoAgoMin(540),
  },
  {
    id: 3,
    name: 'Datadog',
    website: 'https://datadoghq.com',
    ats: 'greenhouse',
    board: 'datadog',
    boardURL: 'https://careers.datadoghq.com',
    hireCountries: ['US', 'FR', 'Remote'],
    hqCountry: 'US',
    kind: 'tech',
    industry: 'Observability',
    source: 'openjobs',
    updatedAt: isoAgoMin(720),
  },
  {
    id: 4,
    name: 'Supabase',
    website: 'https://supabase.com',
    ats: 'greenhouse',
    board: 'supabase',
    boardURL: 'https://boards.greenhouse.io/supabase',
    hireCountries: ['Remote'],
    hqCountry: '—',
    kind: 'startup',
    industry: 'Developer Tools',
    source: 'openjobs',
    updatedAt: isoAgoMin(420),
  },
  {
    id: 5,
    name: 'Cloudflare',
    website: 'https://cloudflare.com',
    ats: 'greenhouse',
    board: 'cloudflare',
    boardURL: 'https://boards.greenhouse.io/cloudflare',
    hireCountries: ['US', 'UK', 'Remote'],
    hqCountry: 'US',
    kind: 'tech',
    industry: 'Infrastructure',
    source: 'openjobs',
    updatedAt: isoAgoMin(900),
  },
  {
    id: 6,
    name: 'Vercel',
    website: 'https://vercel.com',
    ats: 'greenhouse',
    board: 'vercel',
    boardURL: 'https://boards.greenhouse.io/vercel',
    hireCountries: ['Remote'],
    hqCountry: 'US',
    kind: 'startup',
    industry: 'Developer Tools',
    source: 'openjobs',
    updatedAt: isoAgoMin(360),
  },
  {
    id: 7,
    name: 'Sentry',
    website: 'https://sentry.io',
    ats: 'greenhouse',
    board: 'sentry',
    boardURL: 'https://boards.greenhouse.io/sentry',
    hireCountries: ['US', 'Remote'],
    hqCountry: 'US',
    kind: 'startup',
    industry: 'Observability',
    source: 'observed',
    updatedAt: isoAgoMin(800),
  },
  {
    id: 8,
    name: 'Tailscale',
    website: 'https://tailscale.com',
    ats: 'greenhouse',
    board: 'tailscale',
    boardURL: 'https://boards.greenhouse.io/tailscale',
    hireCountries: ['Remote'],
    hqCountry: 'CA',
    kind: 'startup',
    industry: 'Infrastructure',
    source: 'manual',
    updatedAt: isoAgoMin(300),
  },
];

function mockContactSeed(company: string, domain: string): OsintContact[] {
  const slug = company.toLowerCase().replace(/[^a-z0-9]/g, '');
  const firsts = ['Maya', 'Jonas', 'Priya', 'Lena', 'Diego'];
  const lasts = ['Patel', 'Nguyen', 'Schmidt', 'Rossi', 'Khan'];
  const titles = [
    'Technical Recruiter',
    'Senior Recruiter',
    'Head of Talent',
    'Engineering Manager',
    'Talent Partner',
  ];
  const sources: OsintContact['source'][] = [
    'hunter',
    'apollo',
    'github',
    'pattern',
    'pattern',
  ];
  const types = ['work', 'work', 'personal', 'pattern', 'pattern'];
  const out: OsintContact[] = [];
  for (let i = 0; i < 5; i++) {
    const name = `${firsts[i]!} ${lasts[i]!}`;
    const local = `${firsts[i]!.charAt(0)}${lasts[i]!}`.toLowerCase();
    out.push({
      id: Date.now() + i,
      company,
      domain,
      name,
      title: titles[i]!,
      email:
        types[i]! === 'pattern' ? `${local}@${domain}` : `${local}@${slug}.com`,
      emailType: types[i]!,
      linkedIn: `linkedin.com/in/${local}`,
      source: sources[i]!,
      confidence: sources[i]! === 'pattern' ? 30 + i * 10 : 70 + i * 5,
      foundAt: new Date().toISOString(),
      notes:
        sources[i]! === 'pattern'
          ? 'generated — verify before sending'
          : 'enriched from public sources',
    });
  }
  return out;
}

function mockEmailBody(company: string, role: string): string {
  return `Hi,

I'm reaching out about the ${role} role at ${company}. I've shipped production Go services at scale and would love to learn what success looks like in this role.

Would you be open to a short intro call next week?

Thanks,
Alex Morgan`;
}

let mockSavedContacts: OsintContact[] = [
  {
    id: 101,
    company: 'Linear',
    domain: 'linear.app',
    name: 'Sarah Chen',
    title: 'Senior Recruiter',
    email: 'sarah@linear.com',
    emailType: 'work',
    linkedIn: 'linkedin.com/in/sarahchen',
    source: 'hunter',
    confidence: 92,
    foundAt: isoAgoMin(240),
    notes: 'responsive on LinkedIn',
  },
  {
    id: 102,
    company: 'Stripe',
    domain: 'stripe.com',
    name: 'Marcus Webb',
    title: 'Head of Talent',
    email: 'mwebb@stripe.com',
    emailType: 'work',
    linkedIn: 'linkedin.com/in/marcuswebb',
    source: 'apollo',
    confidence: 88,
    foundAt: isoAgoMin(360),
    notes: '',
  },
];

let mockOutreachItems: OutreachItem[] = [
  {
    id: 'o-seed-1',
    channel: 'email',
    jobURL: 'https://greenhouse.example/stripe/1',
    company: 'Stripe',
    role: 'Senior Backend Engineer',
    provider: 'greenhouse',
    contactName: 'Hiring Team',
    contactEmail: 'careers@stripe.com',
    contactSource: 'pattern',
    subject: 'Interest in Senior Backend Engineer at Stripe',
    body: 'Hi,\n\nI saw the Senior Backend Engineer role and would love to connect.\n\nThanks,\nAlex',
    status: 'ready',
    auto: false,
    reviewScore: 0,
    attempts: 0,
    createdAt: isoAgoMin(60),
    updatedAt: isoAgoMin(60),
  },
  {
    id: 'o-seed-2',
    channel: 'linkedin',
    jobURL: 'https://greenhouse.example/linear/2',
    company: 'Linear',
    role: 'Staff Platform Engineer',
    provider: 'greenhouse',
    contactName: '',
    contactEmail: '',
    contactSource: 'manual',
    linkedInURL: 'linkedin.com/in/sarahchen',
    body: 'Open Linear Staff Platform Engineer role and connect with the recruiter.',
    status: 'opened',
    auto: false,
    attempts: 1,
    createdAt: isoAgoMin(120),
    updatedAt: isoAgoMin(90),
    sentAt: isoAgoMin(90),
  },
];

let mockOutreachLog: OutreachLogEntry[] = [
  {
    id: 1,
    channel: 'linkedin',
    jobURL: 'https://greenhouse.example/linear/2',
    company: 'Linear',
    role: 'Staff Platform Engineer',
    contactName: 'Sarah Chen',
    contactEmail: '',
    contactSource: 'hunter',
    subject: '',
    body: 'Opened role + connected.',
    status: 'opened',
    error: '',
    reviewScore: 0,
    attempts: 1,
    createdAt: isoAgoMin(120),
    sentAt: isoAgoMin(90),
  },
];

let mockLogLines: string[] = [
  '  ✓ config.json loaded — 9 providers, AI Assist on (local)',
  '  → resume.pdf · valid PDF · AI profile ready',
  '  [greenhouse] searching Stripe, Linear, Sentry…',
  '  ✓ greenhouse · 14 jobs found',
  '  [lever] searching Linear, PlanetScale…',
  '  ✓ lever · 9 jobs found',
  '  ~ fit score · Stripe Senior Backend Engineer → 88/100',
  '  ✓ applied · Stripe · Senior Backend Engineer',
  '  ~ fit score · Datadog Distributed Systems Engineer → 61/100',
  '  ✗ skipped · Datadog · fit 61 < min 70',
  '  [ashby] searching Datadog, Supabase…',
  '  ✓ ashby · 7 jobs found',
  '  ✗ failed · PostHog · form captcha stop',
  '  ✓ run complete · 6 applied · 2 skipped · 1 failed',
  '  → daily cap 6/25 · engine idle',
  '  [greenhouse] rate limit OK · next search in 8s',
];

const mockUsage: UsageSnapshot = {
  dataDir: '~/.nexus',
  totalBytes: 18_401_152,
  dbBytes: 12_582_912,
  resumesBytes: 2_097_152,
  metaBytes: 24_576,
  otherBytes: 3_696_512,
  jobCount: 248,
  heapAlloc: 64 * 1024 * 1024,
  sysBytes: 128 * 1024 * 1024,
  goroutines: 14,
  aiMode: 'local',
  collectedAt: new Date().toISOString(),
  err: '',
};
