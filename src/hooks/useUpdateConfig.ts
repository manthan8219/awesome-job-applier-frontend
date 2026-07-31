import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { NexusConfig } from '@/types';

/** Save the full Nexus config. Invalidates mission + config cache. */
export function useUpdateConfig() {
  const qc = useQueryClient();
  return useMutation<NexusConfig, Error, NexusConfig>({
    mutationFn: (cfg) => api.saveConfig(cfg),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['config'] });
      qc.invalidateQueries({ queryKey: ['mission'] });
    },
  });
}