/** Hiring signal type (mirrors inbox.Signal). */
export type HiringSignal =
  | 'interview'
  | 'rejection'
  | 'offer'
  | 'recruiter'
  | 'application'
  | 'assessment'
  | 'none';

/** One hiring-email highlight found by the inbox scan (mirrors inbox.Highlight). */
export interface Highlight {
  id: string;
  messageId?: string;
  from: string;
  fromName?: string;
  subject: string;
  bodyPreview?: string;
  date: string;
  signal: HiringSignal;
  confidence: number;
  domain?: string;
  company?: string;
  appId?: number;
  seen?: boolean;
}
