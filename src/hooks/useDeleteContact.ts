import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Remove a saved contact by id. Invalidates the saved contacts cache. */
export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => api.deleteContact(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts', 'saved'] });
    },
  });
}
