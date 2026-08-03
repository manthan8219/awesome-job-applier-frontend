// Nexus domain types — mirrors the TUI Mission Control model
// (internal/ui/dashboard.go, internal/store/models.go, internal/config/config.go).

/** Engine run lifecycle (TUI dashboard.status). */
export type EngineStatus = 'idle' | 'running' | 'done' | 'error' | 'stopped';

/** Per-provider search progress (TUI ProviderProgress.Status). */
export type ProviderStatus = 'idle' | 'searching' | 'done' | 'error';

/** Per-provider progress entry from the API (backend ProviderStatus struct). */
export interface ProgressEntry {
  status: string;
  count?: number;
  errMsg?: string;
}

/** Payload for manually adding a job to the review queue. */
export interface NewApplicationInput {
  role: string;
  company: string;
  url: string;
  location?: string;
  remote?: boolean;
  provider?: string;
}

/** A line in the live run feed / recent list (TUI DashRecent.Status). */
export type LiveStatus =
  'found' | 'applied' | 'failed' | 'queued' | 'skipped' | 'dry-run';

/** Application status (store.Status). */
export type AppStatus = 'applied' | 'skipped' | 'failed' | 'queued' | 'dry-run';

/** Post-apply pipeline stage (store.Outcome). */
export type Outcome =
  '' | 'replied' | 'interview' | 'offer' | 'rejected' | 'ghosted';

export interface Application {
  id: number;
  provider: string;
  company: string;
  role: string;
  url: string;
  status: AppStatus;
  reason: string;
  appliedAt: string; // ISO 8601
  location: string;
  remote: boolean;
  postedAt: string;
  fitScore: number; // 0-100; 0 = unscored
  fitSummary: string;
  description?: string; // full job description (enriched)
  outcome: Outcome;
  outcomeAt: string;
  approved?: boolean; // user approved this queued job for a real apply
  /**
   * Audit of exactly what was submitted to the employer on apply (KAN-33).
   * Present only when the backend recorded it.
   */
  submittedPayload?: {
    profile?: Record<string, string>;
    resume?: { filename?: string; checksum?: string };
    answers?: Array<{ question: string; answer: string; aiGenerated?: boolean }>;
  };
  /**
   * Reply-probability estimate (KAN-19), 0-100, provided by the backend when
   * meaningful (> 0). The guided feed prefers it over its client-side guess.
   */
  responseScore?: number;
  /** One-line why for the response score (KAN-19). */
  responseSummary?: string;
}

/** Onboarding-relevant subset of config.Config. */
export interface NexusConfig {
  // Personal
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  linkedinId: string;
  resumePath: string;
  city: string;
  yearsOfExperience: string;
  skills?: string[];
  // Job preferences
  targetJobTitles: string;
  jobIntent?: string; // omitted by the backend when empty (json omitempty)
  workType: string;
  targetLocations: string;
  currency?: string;
  minSalary?: string;
  // Provider keys
  providerKeys?: Record<string, string>;
  linkedInKey?: string;
  indeedKey?: string;
  // AI
  aiAssist: boolean;
  aiProvider: string;
  anthropicKey?: string;
  openAIKey?: string;
  googleKey?: string;
  deepSeekKey?: string;
  groqKey?: string;
  mistralKey?: string;
  togetherKey?: string;
  openRouterKey?: string;
  xaiKey?: string;
  /** Per-provider model overrides; empty = the provider's backend default. */
  anthropicModel?: string;
  openAIModel?: string;
  googleModel?: string;
  deepSeekModel?: string;
  groqModel?: string;
  mistralModel?: string;
  togetherModel?: string;
  openRouterModel?: string;
  xaiModel?: string;
  localLLMURL?: string;
  localLLMModel?: string;
  // Apply safety
  applyConsent: boolean;
  applyConsentAt: string;
  maxAppsPerRun: number;
  maxAppsPerDay: number;
  applyDelaySec: number;
  minFitScore: number;
  companyBlocklist?: string;
  workAuth?: string;
  noticePeriodDays?: number;
  officeDaysPerWeek?: number;
  coverLetterMode?: string;
  coverLetterText?: string;
  // Outreach
  outreachConsent?: boolean;
  maxEmailsPerDay?: number;
  maxLinkedInPerDay?: number;
  outreachMode?: string;
  outreachAutoQueue?: boolean;
  outreachAICompose?: boolean;
  outreachAIReview?: boolean;
  gmailAppPassword?: string;
  hunterKey?: string;
  apolloKey?: string;
  linkedInSessionCookie?: string;
  gmailOAuthClientID?: string;
  gmailOAuthClientSecret?: string;
  gmailOAuthRefreshToken?: string;
  // Integrations
  discordWebhookURL?: string;
  telegramBotToken?: string;
  telegramChatID?: string;
  notifyChannels?: string[];
  // Tailor
  tailorPerJob?: boolean;
  tailorMaxRounds?: number;
  // Career scraper
  scraperTargets?: string;
  // Automation
  dailyRunEnabled?: boolean; // run a safe dry-run search once a day
  dailyRunAt?: string; // "HH:MM" 24h — when the daily dry-run fires
  emailNotifications?: boolean; // send run summaries by email (backend)
}

export interface ReadyCheck {
  key: string;
  ok: boolean;
  label: string;
  hint: string;
  /** Recommended but not required — never blocks onboarding completion. */
  optional?: boolean;
}

export interface DashRecent {
  label: string;
  status: LiveStatus;
}

/**
 * MissionSnapshot is the full dashboard payload — a 1:1 mirror of the TUI
 * DashboardModel "Mission Control" view, built so the web UI is a thin
 * renderer.
 */
export interface MissionSnapshot {
  engineStatus: EngineStatus;
  lastJob: string;
  errMsg: string;
  dryRun: boolean;
  autoApply: boolean;
  hasConsent: boolean;

  // TODAY
  applied: number;
  skipped: number;
  failed: number;
  appliedToday: number;
  maxPerDay: number;
  resumePath: string;

  // READY (onboarding)
  checks: ReadyCheck[];
  resumeReady: boolean;
  hasTitles: boolean;
  aiOn: boolean;
  onboardingComplete: boolean;

  // MODE
  modeName: string;
  modeHint: string;
  nextAction: string;

  // PROVIDERS
  providers: string[];
  progress: Record<string, ProgressEntry>;

  // LIVE
  foundCount: number;
  liveFeed: DashRecent[];

  // RECENT
  recent: DashRecent[];
}
