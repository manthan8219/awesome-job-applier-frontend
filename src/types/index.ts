// Nexus domain types — mirrors the TUI Mission Control model
// (internal/ui/dashboard.go, internal/store/models.go, internal/config/config.go).

/** Engine run lifecycle (TUI dashboard.status). */
export type EngineStatus = 'idle' | 'running' | 'done' | 'error' | 'stopped';

/** Per-provider search progress (TUI ProviderProgress.Status). */
export type ProviderStatus = 'idle' | 'searching' | 'done' | 'error';

/** A line in the live run feed / recent list (TUI DashRecent.Status). */
export type LiveStatus =
  'found' | 'applied' | 'failed' | 'queued' | 'skipped' | 'dry-run';

/** Application status (store.Status). */
export type AppStatus = 'applied' | 'skipped' | 'failed';

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
  jobIntent: string;
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
}

export interface ReadyCheck {
  key: string;
  ok: boolean;
  label: string;
  hint: string;
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
  progress: Record<string, ProviderStatus>;

  // LIVE
  foundCount: number;
  liveFeed: DashRecent[];

  // RECENT
  recent: DashRecent[];
}
