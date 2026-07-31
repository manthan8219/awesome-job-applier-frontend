import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Toggle dry-run mode (search & log matches without submitting). */
export function useToggleDryRun() {
  const qc = useQueryClient();
  return useMutation<void, Error, boolean>({
    mutationFn: (on) => api.toggleDryRun(on),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mission'] });
    },
  });
}
