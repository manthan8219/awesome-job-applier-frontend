import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Local storage + process memory snapshot. Polled every 15s. */
export function useUsage() {
  return useQuery({
    queryKey: ['usage'],
    queryFn: api.getUsage,
    refetchInterval: 15_000,
  });
}
