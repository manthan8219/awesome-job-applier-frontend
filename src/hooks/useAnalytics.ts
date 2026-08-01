import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Analytics aggregation snapshot (funnel, per-provider yield, reply probability). */
export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: api.getAnalytics,
  });
}
