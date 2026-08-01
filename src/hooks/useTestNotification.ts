import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { NotifyTestResult } from '@/types/notifications';

/** Send a test notification to every configured channel. */
export function useTestNotification() {
  return useMutation<NotifyTestResult, Error, void>({
    mutationFn: () => api.testNotification(),
  });
}
