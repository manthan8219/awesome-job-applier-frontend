import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Remove a work-context project by id. Invalidates the projects list. */
export function useDeleteResumeProject() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => api.deleteResumeProject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resume', 'projects'] });
    },
  });
}
