import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Audit log of every email sent and LinkedIn action taken. */
export function useOutreachLog() {
  return useQuery({
    queryKey: ['outreach', 'log'],
    queryFn: api.getOutreachLog,
  });
}
