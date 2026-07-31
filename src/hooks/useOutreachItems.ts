import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** All outreach items (email + LinkedIn), newest first. */
export function useOutreachItems() {
  return useQuery({
    queryKey: ['outreach', 'items'],
    queryFn: api.getOutreachItems,
  });
}
