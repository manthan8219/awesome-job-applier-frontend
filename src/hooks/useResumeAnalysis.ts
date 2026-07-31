import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** The AI resume analysis (profile, strengths, role fit, improvements). */
export function useResumeAnalysis() {
  return useQuery({
    queryKey: ['resume', 'analysis'],
    queryFn: api.getResumeAnalysis,
  });
}
