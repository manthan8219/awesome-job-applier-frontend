/**
 * Client-side profession detection for profession-aware onboarding.
 *
 * Mirrors the backend `resume.SuggestProfession` catalog
 * (internal/resume/job_titles_offline.go) so the "Detected: <Profession>"
 * badge works even when the API is unreachable or returns no profession
 * field. Labels must stay in sync with the backend.
 */

export interface ProfessionBucket {
  label: string;
  keywords: string[];
}

/** Ordered: the first bucket whose keyword matches wins (specific before broad). */
export const PROFESSION_CATALOG: readonly ProfessionBucket[] = [
  {
    label: 'Healthcare',
    keywords: [
      'doctor',
      'physician',
      'cardiolog',
      'surgeon',
      'nurse',
      'medical',
      'health',
      'dentist',
      'pharma',
      'clinical',
      'radiology',
      'pediatric',
      'therapist',
      'psycholog',
      'veterinar',
      'vet',
    ],
  },
  {
    label: 'Data/AI',
    keywords: [
      'data scien',
      'data analyst',
      'data engineer',
      'machine learning',
      'deep learning',
      'artificial intelligence',
      'analytics',
      'statistician',
      'computer vision',
      'neural',
      'nlp',
      'llm',
      'mlops',
      'ml',
      'ai',
    ],
  },
  {
    label: 'Engineering',
    keywords: [
      'software',
      'engineer',
      'backend',
      'frontend',
      'full-stack',
      'full stack',
      'developer',
      'programmer',
      'golang',
      'python',
      'java',
      'javascript',
      'typescript',
      'sre',
      'devops',
      'platform',
      'infra',
      'infrastructure',
      'cloud',
      'apis',
      'api',
    ],
  },
  {
    label: 'Research/Science',
    keywords: [
      'research',
      'scientist',
      'biolog',
      'chemist',
      'chemistry',
      'physics',
      'genomics',
      'epidemiolog',
      'laboratory',
      'lab',
    ],
  },
  {
    label: 'Design',
    keywords: [
      'product designer',
      'design',
      'graphic',
      'visual',
      'illustrator',
      'artist',
      'ux',
      'ui',
      'art',
    ],
  },
  {
    label: 'Marketing',
    keywords: [
      'marketing',
      'marketer',
      'growth',
      'seo',
      'content',
      'social',
      'brand',
      'demand',
      'campaign',
    ],
  },
  {
    label: 'Sales',
    keywords: [
      'sales',
      'account executive',
      'account manager',
      'business development',
      'customer success',
      'sdr',
      'bdr',
    ],
  },
  {
    label: 'Finance',
    keywords: [
      'finance',
      'accountant',
      'accounting',
      'financial',
      'fp&a',
      'audit',
      'taxation',
      'taxes',
      'treasury',
      'investment',
      'banking',
      'tax',
    ],
  },
  {
    label: 'Education',
    keywords: [
      'teacher',
      'education',
      'professor',
      'instructor',
      'tutor',
      'lecturer',
      'curriculum',
      'academic',
    ],
  },
  {
    label: 'Legal',
    keywords: [
      'lawyer',
      'legal',
      'attorney',
      'paralegal',
      'counsel',
      'compliance',
    ],
  },
  {
    label: 'HR',
    keywords: ['human resources', 'recruiter', 'talent', 'people ops', 'benefits', 'hr'],
  },
  {
    label: 'Writing',
    keywords: [
      'writer',
      'writing',
      'editor',
      'journalist',
      'copywriter',
      'content writer',
      'author',
    ],
  },
  {
    label: 'Trade/Construction',
    keywords: [
      'electrician',
      'plumber',
      'plumbing',
      'carpenter',
      'carpentry',
      'welder',
      'hvac',
      'construction',
      'contractor',
      'machinist',
      'mechanic',
      'roofer',
    ],
  },
  {
    label: 'Customer Support',
    keywords: [
      'customer service',
      'helpdesk',
      'help desk',
      'call center',
      'technical support',
      'support',
    ],
  },
  {
    label: 'Project Management',
    keywords: [
      'project manager',
      'project management',
      'program manager',
      'product manager',
      'scrum',
      'agile',
      'pmo',
      'coordinator',
      'director',
      'operations',
      'manager',
    ],
  },
];

/**
 * Keywords ≤ 3 chars ("ai", "hr", "ui", "art"…) match as whole words so they
 * don't fire inside unrelated words ("email", "through", "built", "startup").
 */
function matchesKeyword(text: string, keyword: string): boolean {
  if (keyword.length > 3) {
    return text.includes(keyword);
  }
  return text.split(/[^a-z0-9]+/).some((tok) => tok === keyword);
}

/**
 * Detect the profession domain of an intent/title string and return a friendly
 * label ("Healthcare", "Engineering", "Data/AI", …), or "" when unknown.
 */
export function detectProfession(input: string): string {
  const text = input.toLowerCase().trim();
  if (!text) return '';
  for (const bucket of PROFESSION_CATALOG) {
    if (bucket.keywords.some((kw) => matchesKeyword(text, kw))) {
      return bucket.label;
    }
  }
  return '';
}
