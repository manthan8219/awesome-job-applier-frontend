import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Refresh the company index from the network (OpenJobs + YC). */
export function useRefreshCompanies() {
  const qc = useQueryClient();
  return useMutation<number, Error, void>({
    mutationFn: () => api.refreshCompanies(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}
