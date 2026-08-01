import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { OutreachItem } from '@/types/outreach';

/**
 * Tag an outreach item with an A/B test variant (KAN-27). Empty clears the
 * tag. Invalidates the outreach queue so the Response Center reflects it.
 */
export function useSetOutreachItemVariant() {
  const qc = useQueryClient();
  return useMutation<OutreachItem, Error, { id: string; variant: string }>({
    mutationFn: ({ id, variant }) => api.setOutreachItemVariant(id, variant),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outreach', 'items'] });
    },
  });
}
