import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Tracked companies, filtered by optional name query + hire country. */
export function useCompanies(query: string, country: string) {
  return useQuery({
    queryKey: ['companies', query, country],
    queryFn: () => api.getCompanies(query, country),
  });
}
