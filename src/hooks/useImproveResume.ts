import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ImproveOutput, ImproveRequest } from '@/types/resume';

/** Generate a stronger resume from analysis + work context. */
export function useImproveResume() {
  return useMutation<ImproveOutput, Error, ImproveRequest>({
    mutationFn: (input) => api.improveResume(input),
  });
}
