import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { NotifyChannel } from '@/types/notifications';

/** Available notification channels (discord / telegram / email) + enabled flag. */
export function useNotifyChannels() {
  return useQuery<NotifyChannel[]>({
    queryKey: ['notify', 'channels'],
    queryFn: api.getNotifyChannels,
  });
}
