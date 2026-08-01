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
  /** Library id of the generated PDF (optional — older backends omit it). */
  pdfId?: string;
  /** Template that rendered this resume (optional — older backends omit it). */
  templateId?: string;
  templateName?: string;
  /** Content→template fit report (optional — older backends omit it). */
  fit?: ResumeFit;
}

/**
 * A resume document the user can preview in a template before generating
 * (mirrors resume.ImprovedDoc's web-shaped subset). Assembled from the current
 * profile analysis + work projects + skills and POSTed to the backend, which
 * renders it deterministically with the real PDF engine — no AI involved.
 */
export interface PreviewResumeDoc {
  fullName?: string;
  headline?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  skills?: string[];
  experience?: {
    title?: string;
    org?: string;
    period?: string;
    bullets?: string[];
  }[];
  education?: string[];
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
  /** Section-heading style: plain | caps | marker | ruleAbove | soft. */
  sectionStyle?: 'plain' | 'caps' | 'marker' | 'ruleAbove' | 'soft';
  /** Name-block style: plain | centered | colored. */
  nameStyle?: 'plain' | 'centered' | 'colored';
  /** Whether the header draws an email · phone · location contact line. */
  contactLine?: boolean;
  /** Main-column width fraction for sidebar layouts (Deedy = 0.76). */
  columnRatio?: number;
  /** Sidebar rail fill: dark | accent | tint. */
  railBackground?: 'dark' | 'accent' | 'tint';
  /** The open-source design this template adapts (attribution). */
  source?: string;
}

/** Offline fallback registry — mirrors the backend `GET /resume/templates`. */
export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: 'jake',
    name: 'Jake',
    description:
      'The recruiter-favorite clean single column — small-caps section heads, tight spacing, zero gimmicks. Adapted from jakegut/resume.',
    layout: 'single',
    sectionStyle: 'caps',
    sections: [
      { key: 'summary', label: 'Summary' },
      { key: 'experience', label: 'Experience' },
      { key: 'skills', label: 'Skills' },
      { key: 'education', label: 'Education' },
    ],
    accentHex: '#334155',
    headerAlign: 'left',
    showRule: false,
    onePage: false,
    budget: {
      targetPages: 0,
      maxSummaryLines: 3,
      maxBulletsPerRole: 4,
      maxRoles: 5,
      maxSkills: 14,
      maxEducation: 2,
      charsPerLine: 100,
    },
    source: 'github.com/jakegut/resume (MIT)',
    atsNote: 'ATS-perfect — the most widely recommended clean LaTeX template.',
  },
  {
    id: 'awesome-cv',
    name: 'Awesome-CV',
    description:
      'Professional sections with a filled accent marker and a full-width rule. Adapted from posquit0/Awesome-CV.',
    layout: 'single',
    sectionStyle: 'marker',
    sections: [
      { key: 'summary', label: 'Summary' },
      { key: 'experience', label: 'Experience' },
      { key: 'education', label: 'Education' },
      { key: 'skills', label: 'Skills' },
    ],
    accentHex: '#00539b',
    headerAlign: 'left',
    showRule: false,
    onePage: false,
    budget: {
      targetPages: 0,
      maxSummaryLines: 3,
      maxBulletsPerRole: 4,
      maxRoles: 5,
      maxSkills: 14,
      maxEducation: 2,
      charsPerLine: 95,
    },
    source: 'github.com/posquit0/Awesome-CV (LPPL)',
    atsNote: 'ATS-safe — single column with standard section names.',
  },
  {
    id: 'deedy',
    name: 'Deedy',
    description:
      'One-page asymmetric two-column — dates and skills in a narrow rail, experience wide. Adapted from deedy/Deedy-Resume.',
    layout: 'sidebar',
    railSide: 'left',
    columnRatio: 0.76,
    onePage: true,
    sectionStyle: 'plain',
    sections: [
      { key: 'experience', label: 'Experience' },
      { key: 'education', label: 'Education' },
      { key: 'skills', label: 'Skills' },
    ],
    accentHex: '#111827',
    headerAlign: 'left',
    showRule: true,
    budget: {
      targetPages: 1,
      maxSummaryLines: 2,
      maxBulletsPerRole: 3,
      maxRoles: 4,
      maxSkills: 10,
      maxEducation: 2,
      charsPerLine: 75,
    },
    source: 'github.com/deedy/Deedy-Resume (Apache-2.0)',
    atsNote:
      'One-page asymmetric two-column — great for new grads; two columns can trip some ATS systems.',
  },
  {
    id: 'mcdowell',
    name: 'McDowell',
    description:
      'Clean single column with generous whitespace and soft gray section heads. Adapted from dnl-blkv/mcdowell-cv.',
    layout: 'single',
    sectionStyle: 'soft',
    sections: [
      { key: 'summary', label: 'Summary' },
      { key: 'experience', label: 'Experience' },
      { key: 'skills', label: 'Skills' },
      { key: 'education', label: 'Education' },
    ],
    accentHex: '#6b7280',
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
      charsPerLine: 95,
    },
    source: 'github.com/dnl-blkv/mcdowell-cv (MIT)',
    atsNote: 'ATS-safe — single column with standard section names.',
  },
  {
    id: 'billryan',
    name: 'BillRyan',
    description:
      'Elegant minimal single column with a serif body. Adapted from billryan/resume.',
    layout: 'single',
    bodyFont: 'serif',
    sectionStyle: 'plain',
    sections: [
      { key: 'summary', label: 'Summary' },
      { key: 'skills', label: 'Skills' },
      { key: 'experience', label: 'Experience' },
      { key: 'education', label: 'Education' },
    ],
    accentHex: '#0f172a',
    headerAlign: 'left',
    showRule: true,
    onePage: false,
    budget: {
      targetPages: 0,
      maxSummaryLines: 3,
      maxBulletsPerRole: 4,
      maxRoles: 5,
      maxSkills: 14,
      maxEducation: 2,
      charsPerLine: 100,
    },
    source: 'github.com/billryan/resume (MIT)',
    atsNote: 'ATS-safe — single column with standard section names.',
  },
  {
    id: 'kendall',
    name: 'Kendall',
    description:
      'Two-column with a dark sidebar rail for skills and education. Adapted from the JSON Resume Kendall theme.',
    layout: 'sidebar',
    railSide: 'left',
    railBackground: 'dark',
    sectionStyle: 'plain',
    sections: [
      { key: 'skills', label: 'Skills' },
      { key: 'summary', label: 'Summary' },
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
      maxRoles: 4,
      maxSkills: 10,
      maxEducation: 2,
      charsPerLine: 60,
    },
    source: 'jsonresume.org — Kendall (MIT)',
    atsNote: 'Two columns can confuse some ATS systems; use for design-forward roles.',
  },
  {
    id: 'macchiato',
    name: 'Macchiato',
    description:
      'Two-column with an accent-colored sidebar and accent name. Adapted from the JSON Resume Macchiato theme.',
    layout: 'sidebar',
    railSide: 'left',
    railBackground: 'accent',
    nameStyle: 'colored',
    sectionStyle: 'plain',
    sections: [
      { key: 'skills', label: 'Skills' },
      { key: 'summary', label: 'Summary' },
      { key: 'experience', label: 'Experience' },
      { key: 'education', label: 'Education' },
    ],
    accentHex: '#0f766e',
    headerAlign: 'left',
    showRule: false,
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
    source: 'jsonresume.org — Macchiato (MIT)',
    atsNote: 'Two columns can confuse some ATS systems; use for design-forward roles.',
  },
  {
    id: 'banking',
    name: 'Banking',
    description:
      'Centered name with a contact line and ruled section heads — the classic moderncv banking style.',
    layout: 'single',
    bodyFont: 'serif',
    nameStyle: 'centered',
    contactLine: true,
    sectionStyle: 'ruleAbove',
    sections: [
      { key: 'summary', label: 'Summary' },
      { key: 'experience', label: 'Experience' },
      { key: 'skills', label: 'Skills' },
      { key: 'education', label: 'Education' },
    ],
    accentHex: '#004d99',
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
    source: 'moderncv — banking style (LPPL)',
    atsNote: 'ATS-safe — single column with standard section names.',
  },
];

/** Default template id (also the backend fallback for missing ids). */
export const TEMPLATE_DEFAULT_ID = 'jake';

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
