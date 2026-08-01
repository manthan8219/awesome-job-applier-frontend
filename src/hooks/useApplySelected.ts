import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Submit real applications for the approved job ids (backend enforces caps). */
export function useApplySelected() {
  const qc = useQueryClient();
  return useMutation<{ applied: number }, Error, number[]>({
    mutationFn: (ids) => api.applySelected(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['mission'] });
    },
  });
}
