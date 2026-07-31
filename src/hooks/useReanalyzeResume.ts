import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ResumeAnalysis } from '@/types/resume';

/** Re-run AI resume analysis. Invalidates the cached analysis. */
export function useReanalyzeResume() {
  const qc = useQueryClient();
  return useMutation<ResumeAnalysis, Error, void>({
    mutationFn: () => api.reanalyzeResume(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resume', 'analysis'] });
    },
  });
}
