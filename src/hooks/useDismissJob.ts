import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Dismiss a queued job so it leaves the review queue. */
export function useDismissJob() {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => api.dismissApplication(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['mission'] });
    },
  });
}
