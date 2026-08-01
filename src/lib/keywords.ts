/**
 * Keyword extraction + gap analysis (KAN-21).
 *
 * The job-detail keyword-gap panel uses these pure helpers: pull the salient
 * keywords out of a job description, then diff them against the resume's skill
 * list to show what is already covered and what the user should add.
 */

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'for', 'with', 'to', 'of', 'in', 'on', 'at',
  'by', 'you', 'your', 'we', 'our', 'will', 'must', 'have', 'has', 'had',
  'this', 'that', 'these', 'those', 'from', 'as', 'are', 'is', 'be', 'been',
  'being', 'it', 'its', 'if', 'then', 'than', 'so', 'can', 'may', 'not', 'no',
  'but', 'do', 'does', 'did', 'who', 'whom', 'which', 'what', 'when', 'where',
  'why', 'how', 'all', 'any', 'each', 'more', 'most', 'other', 'some', 'such',
  'about', 'into', 'over', 'under', 'up', 'down', 'out', 'per', 'via', 'etc',
  'help', 'team', 'work', 'role', 'job', 'like', 'well', 'new', 'join',
]);

/** Cap so the panel stays scannable. */
const MAX_KEYWORDS = 30;

/** Extract salient single-word keywords from a job description. */
export function extractKeywords(text: string): string[] {
  if (!text) return [];
  const counts = new Map<string, number>();
  const tokens = text.toLowerCase().match(/[a-z][a-z0-9-]{1,}/g) ?? [];
  for (const raw of tokens) {
    const token = raw.replace(/^-+|-+$/g, '');
    // Allow short technical keywords (go, ai, ml, ui, ux) — stopwords still filter the noise.
    if (STOPWORDS.has(token) || token.length < 2) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_KEYWORDS)
    .map(([word]) => word);
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** A keyword is "covered" when it is a skill, or appears as a word inside a phrase skill. */
function isCovered(keyword: string, skillSet: string[]): boolean {
  const re = new RegExp(`\\b${escapeRegExp(keyword)}\\b`);
  return skillSet.some((s) => s === keyword || re.test(s));
}

export interface KeywordDiff {
  matched: string[];
  missing: string[];
  matchedCount: number;
  missingCount: number;
}

/** Diff extracted JD keywords against the resume skill list. */
export function diffKeywords(
  jdKeywords: string[],
  skills: string[],
): KeywordDiff {
  const skillSet = skills
    .map((s) => s.toLowerCase().trim())
    .filter(Boolean);
  const matched: string[] = [];
  const missing: string[] = [];
  for (const kw of jdKeywords) {
    const k = kw.toLowerCase();
    if (isCovered(k, skillSet)) matched.push(kw);
    else missing.push(kw);
  }
  return {
    matched,
    missing,
    matchedCount: matched.length,
    missingCount: missing.length,
  };
}
