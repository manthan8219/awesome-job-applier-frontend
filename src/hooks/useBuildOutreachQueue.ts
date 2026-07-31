import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { OutreachChannel, OutreachItem } from '@/types/outreach';

/** Build a queue of outreach drafts from applied jobs. Invalidates items. */
export function useBuildOutreachQueue() {
  const qc = useQueryClient();
  return useMutation<OutreachItem[], Error, OutreachChannel>({
    mutationFn: (channel) => api.buildOutreachQueue(channel),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outreach', 'items'] });
    },
  });
}
