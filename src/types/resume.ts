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
  /** Content→template fit report (optional — older backends omit it). */
  fit?: ResumeFit;
}

/**
 * Fit report from the planner (mirrors resume.FitPlan). How the content was
 * slotted into the template, how many lines/pages it uses, and anything that
 * was trimmed to make it fit.
 */
export interface ResumeFit {
  templateId?: string;
  layout?: string;
  budget?: ResumeSpaceBudget;
  /** Estimated content lines after fitting. */
  plannedLines?: number;
  /** Approximate lines the template's page holds. */
  targetLines?: number;
  /** Estimated pages before rendering (>= 1). */
  estimatedPages?: number;
  /** Verified page count of the rendered PDF (native renderer). */
  pages?: number;
  /** 0-100 confidence the content fits comfortably. */
  fitScore?: number;
  warnings?: string[];
  trimmedSections?: string[];
  sections?: { key: string; label: string; lines: number }[];
}

/** Export target for an improved resume (mirrors resume.Format). */
export type ResumeFormat = 'markdown' | 'latex' | 'pdf';

/** Layout family a resume template uses (mirrors resume.TemplateLayout). */
export type ResumeTemplateLayout = 'single' | 'sidebar';

/**
 * Content budget for a template (mirrors resume.SpaceBudget). How much content
 * the design realistically holds on its target page count — the AI writes to
 * it, the planner enforces it, and the renderer verifies the page count.
 */
export interface ResumeSpaceBudget {
  /** 1 = must fit one page; 0 = flexible. */
  targetPages?: number;
  maxSummaryLines?: number;
  maxBulletsPerRole?: number;
  maxRoles?: number;
  maxSkills?: number;
  maxEducation?: number;
  /** Approximate chars that fit one body line (drives line estimates). */
  charsPerLine?: number;
}

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
  /** Side the skills/education rail sits on for two-column templates. */
  railSide?: 'left' | 'right';
  /** Body font family the renderer uses: sans | serif | mono. */
  bodyFont?: 'sans' | 'serif' | 'mono';
  /** Header alignment of the name block (mirrors the backend renderer). */
  headerAlign?: 'left' | 'center';
  /** Whether the renderer draws an accent rule under the header. */
  showRule?: boolean;
  /** Content budget this template fits on its target page count. */
  budget?: ResumeSpaceBudget;
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
    headerAlign: 'left',
    showRule: true,
    onePage: false,
    budget: {
      targetPages: 0,
      maxSummaryLines: 3,
      maxBulletsPerRole: 4,
      maxRoles: 5,
      maxSkills: 12,
      maxEducation: 2,
      charsPerLine: 95,
    },
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
    headerAlign: 'center',
    showRule: true,
    onePage: false,
    budget: {
      targetPages: 0,
      maxSummaryLines: 3,
      maxBulletsPerRole: 4,
      maxRoles: 5,
      maxSkills: 12,
      maxEducation: 2,
      charsPerLine: 90,
    },
    atsNote: 'ATS-safe — single column with standard section names.',
  },
  {
    id: 'executive',
    name: 'Executive',
    description:
      'Serif type with a muted steel accent — formal, senior-leader tone.',
    layout: 'single',
    sections: [
      { key: 'summary', label: 'Summary' },
      { key: 'skills', label: 'Skills' },
      { key: 'experience', label: 'Experience' },
      { key: 'education', label: 'Education' },
    ],
    accentHex: '#475569',
    headerAlign: 'center',
    showRule: false,
    onePage: false,
    budget: {
      targetPages: 0,
      maxSummaryLines: 3,
      maxBulletsPerRole: 4,
      maxRoles: 5,
      maxSkills: 12,
      maxEducation: 2,
      charsPerLine: 90,
    },
    bodyFont: 'serif',
    atsNote: 'ATS-safe — single column with standard section names.',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description:
      'Bare-bones single column with generous whitespace and a soft slate accent.',
    layout: 'single',
    sections: [
      { key: 'summary', label: 'Summary' },
      { key: 'skills', label: 'Skills' },
      { key: 'experience', label: 'Experience' },
      { key: 'education', label: 'Education' },
    ],
    accentHex: '#94a3b8',
    headerAlign: 'left',
    showRule: false,
    onePage: false,
    budget: {
      targetPages: 0,
      maxSummaryLines: 2,
      maxBulletsPerRole: 3,
      maxRoles: 4,
      maxSkills: 10,
      maxEducation: 2,
      charsPerLine: 90,
    },
    atsNote: 'ATS-safe — single column with standard section names.',
  },
  {
    id: 'academic',
    name: 'Academic',
    description:
      'Education-forward with serif type and a deep navy accent — built for academia.',
    layout: 'single',
    sections: [
      { key: 'summary', label: 'Summary' },
      { key: 'education', label: 'Education' },
      { key: 'experience', label: 'Experience' },
      { key: 'skills', label: 'Skills' },
    ],
    accentHex: '#1e3a8a',
    headerAlign: 'center',
    showRule: true,
    onePage: false,
    budget: {
      targetPages: 0,
      maxSummaryLines: 3,
      maxBulletsPerRole: 4,
      maxRoles: 5,
      maxSkills: 12,
      maxEducation: 3,
      charsPerLine: 85,
    },
    bodyFont: 'serif',
    atsNote: 'ATS-safe — single column with standard section names.',
  },
  {
    id: 'developer',
    name: 'Developer',
    description:
      'Monospace type with a lime accent — a terminal-flavoured look.',
    layout: 'single',
    sections: [
      { key: 'summary', label: 'Summary' },
      { key: 'skills', label: 'Skills' },
      { key: 'experience', label: 'Experience' },
      { key: 'education', label: 'Education' },
    ],
    accentHex: '#a3e635',
    headerAlign: 'left',
    showRule: true,
    onePage: false,
    budget: {
      targetPages: 0,
      maxSummaryLines: 2,
      maxBulletsPerRole: 3,
      maxRoles: 4,
      maxSkills: 14,
      maxEducation: 2,
      charsPerLine: 85,
    },
    bodyFont: 'mono',
    atsNote: 'ATS-safe — single column with standard section names.',
  },
  {
    id: 'sidebar',
    name: 'Sidebar',
    description:
      'Two-column layout: skills and education in a left rail, experience as the main column.',
    layout: 'sidebar',
    railSide: 'left',
    sections: [
      { key: 'skills', label: 'Skills' },
      { key: 'summary', label: 'Summary' },
      { key: 'experience', label: 'Experience' },
      { key: 'education', label: 'Education' },
    ],
    accentHex: '#22d3ee',
    headerAlign: 'center',
    showRule: true,
    onePage: false,
    budget: {
      targetPages: 0,
      maxSummaryLines: 3,
      maxBulletsPerRole: 4,
      maxRoles: 4,
      maxSkills: 10,
      maxEducation: 2,
      charsPerLine: 60,
    },
    atsNote:
      'Design-forward — two columns can confuse some ATS systems; use for roles where design matters.',
  },
  {
    id: 'split',
    name: 'Split',
    description:
      'Two-column layout: skills and education in a right rail, experience leads on the left.',
    layout: 'sidebar',
    railSide: 'right',
    sections: [
      { key: 'experience', label: 'Experience' },
      { key: 'summary', label: 'Summary' },
      { key: 'skills', label: 'Skills' },
      { key: 'education', label: 'Education' },
    ],
    accentHex: '#f59e0b',
    headerAlign: 'center',
    showRule: true,
    onePage: false,
    budget: {
      targetPages: 0,
      maxSummaryLines: 3,
      maxBulletsPerRole: 4,
      maxRoles: 4,
      maxSkills: 10,
      maxEducation: 2,
      charsPerLine: 60,
    },
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
    headerAlign: 'left',
    showRule: true,
    onePage: true,
    budget: {
      targetPages: 1,
      maxSummaryLines: 2,
      maxBulletsPerRole: 3,
      maxRoles: 5,
      maxSkills: 10,
      maxEducation: 2,
      charsPerLine: 100,
    },
    atsNote: 'Optimized for one page — good for senior candidates.',
  },
  {
    id: 'bold',
    name: 'Bold',
    description:
      'Big centered header with a magenta accent — makes your name the hero.',
    layout: 'single',
    sections: [
      { key: 'summary', label: 'Summary' },
      { key: 'skills', label: 'Skills' },
      { key: 'experience', label: 'Experience' },
      { key: 'education', label: 'Education' },
    ],
    accentHex: '#ec4899',
    headerAlign: 'center',
    showRule: true,
    onePage: false,
    budget: {
      targetPages: 0,
      maxSummaryLines: 3,
      maxBulletsPerRole: 4,
      maxRoles: 5,
      maxSkills: 12,
      maxEducation: 2,
      charsPerLine: 85,
    },
    atsNote: 'ATS-safe — single column with standard section names.',
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    description:
      'All-ink serif with a black accent and no rule — quiet, classic, universal.',
    layout: 'single',
    sections: [
      { key: 'summary', label: 'Summary' },
      { key: 'skills', label: 'Skills' },
      { key: 'experience', label: 'Experience' },
      { key: 'education', label: 'Education' },
    ],
    accentHex: '#111827',
    headerAlign: 'left',
    showRule: false,
    onePage: false,
    budget: {
      targetPages: 0,
      maxSummaryLines: 3,
      maxBulletsPerRole: 4,
      maxRoles: 5,
      maxSkills: 12,
      maxEducation: 2,
      charsPerLine: 90,
    },
    bodyFont: 'serif',
    atsNote: 'ATS-safe — single column with standard section names.',
  },
  {
    id: 'nordic',
    name: 'Nordic',
    description: 'Clean scandi look — teal accent, left header and a thin rule.',
    layout: 'single',
    sections: [
      { key: 'summary', label: 'Summary' },
      { key: 'skills', label: 'Skills' },
      { key: 'experience', label: 'Experience' },
      { key: 'education', label: 'Education' },
    ],
    accentHex: '#0d9488',
    headerAlign: 'left',
    showRule: true,
    onePage: false,
    budget: {
      targetPages: 0,
      maxSummaryLines: 3,
      maxBulletsPerRole: 4,
      maxRoles: 5,
      maxSkills: 12,
      maxEducation: 2,
      charsPerLine: 100,
    },
    atsNote: 'ATS-safe — single column with standard section names.',
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
