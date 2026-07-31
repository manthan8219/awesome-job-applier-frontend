import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Outreach consent / mode / caps setup. */
export function useOutreachSetup() {
  return useQuery({
    queryKey: ['outreach', 'setup'],
    queryFn: api.getOutreachSetup,
  });
}
