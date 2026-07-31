import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Toggle Auto Apply (requires apply consent; refused otherwise). */
export function useToggleAutoApply() {
  const qc = useQueryClient();
  return useMutation<void, Error, boolean>({
    mutationFn: (on) => api.toggleAutoApply(on),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mission'] });
    },
  });
}
