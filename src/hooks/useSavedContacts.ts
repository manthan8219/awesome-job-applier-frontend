import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Contacts the user has saved from OSINT searches. */
export function useSavedContacts() {
  return useQuery({
    queryKey: ['contacts', 'saved'],
    queryFn: api.getSavedContacts,
  });
}
