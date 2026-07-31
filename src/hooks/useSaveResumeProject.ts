import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { WorkProject } from '@/types/resume';

/** Insert or replace a work-context project. Invalidates the projects list. */
export function useSaveResumeProject() {
  const qc = useQueryClient();
  return useMutation<WorkProject, Error, WorkProject>({
    mutationFn: (project) => api.saveResumeProject(project),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resume', 'projects'] });
    },
  });
}
