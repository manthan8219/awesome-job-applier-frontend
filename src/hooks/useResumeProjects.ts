import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Work-context projects injected into resume generation. */
export function useResumeProjects() {
  return useQuery({
    queryKey: ['resume', 'projects'],
    queryFn: api.getResumeProjects,
  });
}
