import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Hiring-email highlights from the inbox scan, newest first. */
export function useHighlights() {
  return useQuery({
    queryKey: ['highlights'],
    queryFn: api.getHighlights,
  });
}
