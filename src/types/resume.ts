/** A labeled 1–10 score for charts (mirrors resume.ScoredItem). */
export interface ScoredItem {
  name: string;
  score: number;
}

/** AI-generated career read of the resume (mirrors resume.Profile). */
export interface ResumeProfile {
  summary: string;
  whatsGood: string[];
  whatsWrong: string[];
  strengths: string[];
  strengthScores: ScoredItem[];
  suitableRoles: string[];
  roleFit: ScoredItem[];
  skills: string[];
  skillScores: ScoredItem[];
  experienceLevel: string;
  yearsEstimate: number;
  industries: string[];
  improvements: string[];
  error?: string;
}

/** Structured personal details extracted from a resume (for profile backfill). */
export interface ResumeContact {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  linkedIn?: string;
  years?: string;
  skills?: string[];
}

/** Result of analyzing a resume file (mirrors resume.Result). */
export interface ResumeAnalysis {
  valid: boolean;
  fileType: string;
  message: string;
  err?: string;
  profile: ResumeProfile | null;
  contact?: ResumeContact | null;
}

/** A work project for resume context (mirrors workcontext.Project). */
export interface WorkProject {
  id: string;
  name: string;
  repo: string;
  period: string;
  role: string;
  summary: string;
}

/** Output of resume generation (mirrors resume.ImproveOutput). */
export interface ImproveOutput {
  previewMD: string;
  dir: string;
  review: {
    summary: string;
    atsScore: number;
    qualityScore: number;
  };
  pdfNote?: string;
  /** Template that rendered this resume (optional — older backends omit it). */
  templateId?: string;
  templateName?: string;
}

/** Export target for an improved resume (mirrors resume.Format). */
export type ResumeFormat = 'markdown' | 'latex' | 'pdf';

/** Layout family a resume template uses (mirrors resume.TemplateLayout). */
export type ResumeTemplateLayout = 'single' | 'sidebar';

/** A labelled content slot a template knows how to render. */
export interface ResumeTemplateSection {
  key: string;
  label: string;
}

/**
 * Machine-readable manifest for one resume design (mirrors resume.Template).
 * The backend uses the same manifest to steer AI content so it fits the design.
 */
export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  layout: ResumeTemplateLayout;
  sections: ResumeTemplateSection[];
  accentHex: string;
  onePage: boolean;
  atsNote: string;
}

/** Offline fallback registry — mirrors the backend `GET /resume/templates`. */
export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: 'classic',
    name: 'Classic',
    description:
      'Clean single-column flow with standard headings. The safest choice for ATS parsing.',
    layout: 'single',
    sections: [
      { key: 'summary', label: 'Summary' },
      { key: 'skills', label: 'Skills' },
      { key: 'experience', label: 'Experience' },
      { key: 'education', label: 'Education' },
    ],
    accentHex: '#059669',
    onePage: false,
    atsNote: 'Safest for ATS — single column, standard section names.',
  },
  {
    id: 'modern',
    name: 'Modern',
    description:
      'Centered header with a violet accent. Single column, slightly more whitespace.',
    layout: 'single',
    sections: [
      { key: 'summary', label: 'Summary' },
      { key: 'skills', label: 'Skills' },
      { key: 'experience', label: 'Experience' },
      { key: 'education', label: 'Education' },
    ],
    accentHex: '#8b5cf6',
    onePage: false,
    atsNote: 'ATS-safe — single column with standard section names.',
  },
  {
    id: 'sidebar',
    name: 'Sidebar',
    description:
      'Two-column layout: skills and education in a left rail, experience as the main column.',
    layout: 'sidebar',
    sections: [
      { key: 'skills', label: 'Skills' },
      { key: 'summary', label: 'Summary' },
      { key: 'experience', label: 'Experience' },
      { key: 'education', label: 'Education' },
    ],
    accentHex: '#22d3ee',
    onePage: false,
    atsNote:
      'Design-forward — two columns can confuse some ATS systems; use for roles where design matters.',
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Tighter spacing and smaller margins to fit more on one page.',
    layout: 'single',
    sections: [
      { key: 'summary', label: 'Summary' },
      { key: 'experience', label: 'Experience' },
      { key: 'skills', label: 'Skills' },
      { key: 'education', label: 'Education' },
    ],
    accentHex: '#38bdf8',
    onePage: true,
    atsNote: 'Optimized for one page — good for senior candidates.',
  },
];

/** Default template id (also the backend fallback for missing ids). */
export const TEMPLATE_DEFAULT_ID = 'classic';

/** Input to resume generation (mirrors resume.ImproveInput, web-shaped). */
export interface ImproveRequest {
  targetRole: string;
  formats: ResumeFormat[];
  /** Resume template id — empty falls back to Classic on the backend. */
  templateId?: string;
}

/** Label + hint metadata for a resume export format. */
export interface ResumeFormatMeta {
  value: ResumeFormat;
  label: string;
  hint: string;
}

export const RESUME_FORMATS: ResumeFormatMeta[] = [
  { value: 'markdown', label: 'Markdown', hint: 'Editable .md source' },
  { value: 'latex', label: 'LaTeX', hint: 'Typeset .tex source' },
  {
    value: 'pdf',
    label: 'PDF',
    hint: 'Apply-ready, saved to ~/.nexus/resumes',
  },
];
