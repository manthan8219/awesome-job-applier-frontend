import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Stop a running engine. Invalidates mission on success. */
export function useStopRun() {
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => api.stopRun(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mission'] });
    },
  });
}
