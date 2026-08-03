import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/**
 * Fetches the model catalog for an API provider once a key for that provider
 * is present. Disabled until the key is non-empty so no request fires while a
 * field is blank.
 */
export function useAIModels(provider: string, apiKey: string) {
  return useQuery({
    queryKey: ['ai-models', provider, apiKey],
    queryFn: () => api.getAIModels(provider, apiKey),
    enabled: provider !== '' && apiKey.trim() !== '',
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
