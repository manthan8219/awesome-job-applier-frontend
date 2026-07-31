import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { OsintContact } from '@/types/contacts';

/** Save a found contact. Invalidates the saved contacts cache. */
export function useSaveContact() {
  const qc = useQueryClient();
  return useMutation<OsintContact, Error, OsintContact>({
    mutationFn: (c) => api.saveContact(c),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts', 'saved'] });
    },
  });
}
