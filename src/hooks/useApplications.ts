import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** All recorded applications, optionally filtered by a free-text query. */
export function useApplications(query: string) {
  return useQuery({
    queryKey: ['jobs', query],
    queryFn: () => api.getApplications(query),
  });
}
