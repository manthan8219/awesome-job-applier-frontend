import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { OutreachItem } from '@/types/outreach';

/** Send / open one outreach item. Invalidates items + log caches. */
export function useSendOutreachItem() {
  const qc = useQueryClient();
  return useMutation<OutreachItem, Error, string>({
    mutationFn: (id) => api.sendOutreachItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outreach', 'items'] });
      qc.invalidateQueries({ queryKey: ['outreach', 'log'] });
    },
  });
}
