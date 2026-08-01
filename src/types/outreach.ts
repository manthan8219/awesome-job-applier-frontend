/** Outreach channel (mirrors outreach.Channel). */
export type OutreachChannel = 'email' | 'linkedin';

/** Outreach item lifecycle (mirrors outreach.Status). */
export type OutreachStatus =
  | 'finding'
  | 'drafting'
  | 'draft'
  | 'ready'
  | 'sent'
  | 'failed'
  | 'skipped'
  | 'opened'
  | 'followup_due'
  | 'sequence_done'
  | 'replied'
  | 'bounced';

/** Automation mode (mirrors outreach.Mode). */
export type OutreachMode = 'confirm' | 'queue' | 'auto';

/** One outreach attempt tied to a job application (mirrors outreach.Item, web-shaped). */
export interface OutreachItem {
  id: string;
  channel: OutreachChannel;
  jobURL: string;
  company: string;
  role: string;
  provider?: string;
  contactName?: string;
  contactEmail?: string;
  contactTitle?: string;
  contactSource?: string;
  linkedInURL?: string;
  subject?: string;
  body: string;
  status: OutreachStatus;
  error?: string;
  auto?: boolean;
  reviewScore?: number;
  reviewNotes?: string;
  attempts?: number;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
}

/** Setup / consent state for the Outreach hub (mirrors the TUI setup sub-tab). */
export interface OutreachSetup {
  consent: boolean;
  mode: OutreachMode;
  maxEmailsPerDay: number;
  maxLinkedInPerDay: number;
  aiCompose: boolean;
  aiReview: boolean;
  /** Referral-ask variant (KAN-28): email drafts become a warm referral ask. */
  referralAsk: boolean;
  /** Empty = built-in referral templates. */
  referralSubjectTpl?: string;
  referralBodyTpl?: string;
}

/** Permanent audit record of one outreach action (mirrors store.OutreachLogEntry). */
export interface OutreachLogEntry {
  id: number;
  channel: OutreachChannel;
  jobURL: string;
  company: string;
  role: string;
  contactName: string;
  contactEmail: string;
  contactSource: string;
  subject: string;
  body: string;
  status: string; // "sent" | "failed" | "opened"
  error: string;
  reviewScore: number;
  attempts: number;
  createdAt: string;
  sentAt: string;
}
