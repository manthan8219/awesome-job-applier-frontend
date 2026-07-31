import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Application, Outcome } from '@/types';

/** Cycle an application's post-apply outcome. Invalidates the jobs cache. */
export function useSetOutcome() {
  const qc = useQueryClient();
  return useMutation<Application, Error, { id: number; outcome: Outcome }>({
    mutationFn: ({ id, outcome }) => api.setApplicationOutcome(id, outcome),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['mission'] });
    },
  });
}
