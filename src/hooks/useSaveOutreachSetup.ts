import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { OutreachSetup } from '@/types/outreach';

/** Persist outreach setup. Invalidates setup + config + mission caches. */
export function useSaveOutreachSetup() {
  const qc = useQueryClient();
  return useMutation<OutreachSetup, Error, OutreachSetup>({
    mutationFn: (setup) => api.saveOutreachSetup(setup),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outreach', 'setup'] });
      qc.invalidateQueries({ queryKey: ['config'] });
      qc.invalidateQueries({ queryKey: ['mission'] });
    },
  });
}
