import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { NotifySummaryResult } from '@/types/notifications';

/** Send a run summary / daily digest to every configured channel. */
export function useSendNotifySummary() {
  return useMutation<NotifySummaryResult, Error, void>({
    mutationFn: () => api.sendNotifySummary(),
  });
}
