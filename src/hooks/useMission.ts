import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/**
 * The full Mission Control snapshot. Polled continuously so the live feed,
 * provider progress, and engine status update in real time while a run is
 * active on the backend.
 */
export function useMission() {
  return useQuery({
    queryKey: ['mission'],
    queryFn: api.getMission,
    refetchInterval: 2000,
  });
}
