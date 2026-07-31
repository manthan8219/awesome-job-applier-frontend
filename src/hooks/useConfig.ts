import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** The Nexus config (onboarding-relevant fields). */
export function useConfig() {
  return useQuery({ queryKey: ['config'], queryFn: api.getConfig });
}
