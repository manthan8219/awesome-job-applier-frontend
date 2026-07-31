import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

/**
 * Persist the full skills list. Mirrors the TUI which writes skills onto the
 * config document — invalidates the resume, config, and mission caches so the
 * dashboard "Ready" checklist and any resume generation reflect the change.
 */
export function useSaveResumeSkills() {
  const qc = useQueryClient();
  return useMutation<string[], Error, string[]>({
    mutationFn: (skills) => api.saveResumeSkills(skills),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resume', 'skills'] });
      qc.invalidateQueries({ queryKey: ['config'] });
      qc.invalidateQueries({ queryKey: ['mission'] });
    },
  });
}
