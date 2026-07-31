import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Engine log lines, optionally filtered. */
export function useLogs(filter: string) {
  return useQuery({
    queryKey: ['logs', filter],
    queryFn: () => api.getLogs(filter),
    refetchInterval: 5000,
  });
}
