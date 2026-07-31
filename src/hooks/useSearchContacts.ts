import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ContactSearchResult } from '@/types/contacts';

/** Run OSINT sources to find HR/recruiter contacts at a company. */
export function useSearchContacts() {
  return useMutation<
    ContactSearchResult,
    Error,
    { company: string; domain: string }
  >({
    mutationFn: ({ company, domain }) => api.searchContacts(company, domain),
  });
}
