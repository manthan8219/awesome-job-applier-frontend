import { useMemo } from 'react';
import { useResumeSkills } from '@/hooks/useResumeSkills';
import { useSaveResumeSkills } from '@/hooks/useSaveResumeSkills';
import { diffKeywords, extractKeywords } from '@/lib/keywords';

export interface KeywordGap {
  matched: string[];
  missing: string[];
  matchedCount: number;
  missingCount: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  adding: boolean;
  addSkill: (skill: string) => void;
}

/**
 * Diff a job description against the resume skill list. The one-click add
 * appends a missing keyword to the resume skills via the existing
 * saveResumeSkills mutation (which invalidates the resume/config/mission caches).
 */
export function useKeywordGap(description: string): KeywordGap {
  const {
    data: skills,
    isLoading,
    isError,
    error,
  } = useResumeSkills();
  const saveSkills = useSaveResumeSkills();

  const diff = useMemo(() => {
    const jd = extractKeywords(description);
    return diffKeywords(jd, skills ?? []);
  }, [description, skills]);

  function addSkill(skill: string) {
    const current = skills ?? [];
    const trimmed = skill.trim();
    if (!trimmed) return;
    if (current.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return;
    saveSkills.mutate([...current, trimmed]);
  }

  return {
    ...diff,
    isLoading,
    isError,
    error: (error as Error | null) ?? null,
    adding: saveSkills.isPending,
    addSkill,
  };
}
