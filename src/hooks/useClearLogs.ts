import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Clear the in-memory engine log. Invalidates the logs cache. */
export function useClearLogs() {
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => api.clearLogs(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['logs'] });
    },
  });
}
