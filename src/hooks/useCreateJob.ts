import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Application, NewApplicationInput } from '@/types';

/** Add a manually-discovered job to the review queue. */
export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation<Application, Error, NewApplicationInput>({
    mutationFn: (input) => api.createApplication(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['mission'] });
    },
  });
}
