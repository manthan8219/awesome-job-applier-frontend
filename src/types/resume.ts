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

/** Result of analyzing a resume file (mirrors resume.Result). */
export interface ResumeAnalysis {
  valid: boolean;
  fileType: string;
  message: string;
  err?: string;
  profile: ResumeProfile | null;
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
}

/** Export target for an improved resume (mirrors resume.Format). */
export type ResumeFormat = 'markdown' | 'latex' | 'pdf';

/** Input to resume generation (mirrors resume.ImproveInput, web-shaped). */
export interface ImproveRequest {
  targetRole: string;
  formats: ResumeFormat[];
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
