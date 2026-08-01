import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Application } from '@/types';

/** Mark a queued job as approved for a real apply (or undo it). */
export function useSetApplicationApproved() {
  const qc = useQueryClient();
  return useMutation<Application, Error, { id: number; approved: boolean }>({
    mutationFn: ({ id, approved }) => api.setApplicationApproved(id, approved),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['mission'] });
    },
  });
}
