import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Fetch the curated resume template registry from the backend. */
export function useResumeTemplates() {
  return useQuery({
    queryKey: ['resume', 'templates'],
    queryFn: () => api.getResumeTemplates(),
    staleTime: 5 * 60 * 1000,
  });
}
