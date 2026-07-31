import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Scraped jobs recorded for one company (the companies detail view). */
export function useCompanyJobs(name: string | null) {
  return useQuery({
    queryKey: ['companies', 'jobs', name],
    queryFn: () => api.getCompanyJobs(name ?? ''),
    enabled: Boolean(name),
  });
}
