import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Company, CompanyInput } from '@/types/companies';

/** Add or edit a company. Invalidates the companies cache. */
export function useSaveCompany() {
  const qc = useQueryClient();
  return useMutation<Company, Error, CompanyInput>({
    mutationFn: (input) => api.saveCompany(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}
