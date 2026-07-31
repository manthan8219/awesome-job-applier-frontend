import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Skills injected into every resume generation run. */
export function useResumeSkills() {
  return useQuery({
    queryKey: ['resume', 'skills'],
    queryFn: api.getResumeSkills,
  });
}
