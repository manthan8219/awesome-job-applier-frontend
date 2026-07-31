import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface StartRunInput {
  dryRun: boolean;
  autoApply: boolean;
}

/** Start the engine (search + queue/apply). Invalidates mission on success. */
export function useStartRun() {
  const qc = useQueryClient();
  return useMutation<void, Error, StartRunInput>({
    mutationFn: (input) => api.startRun(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mission'] });
    },
  });
}
