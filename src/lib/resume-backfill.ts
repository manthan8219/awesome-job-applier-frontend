import type { NexusConfig } from '@/types';
import type { ResumeContact } from '@/types/resume';

/**
 * Build the config fields we can backfill from a resume's parsed contact info.
 * Only empty config fields are filled — the user's manual entries always win.
 */
export function contactPatch(
  cfg: Partial<NexusConfig>,
  contact: ResumeContact | null | undefined,
): Partial<NexusConfig> {
  const p: Partial<NexusConfig> = {};
  if (!contact) return p;

  const firstName = contact.firstName?.trim();
  if (firstName && !cfg.firstName?.trim()) p.firstName = firstName;

  const lastName = contact.lastName?.trim();
  if (lastName && !cfg.lastName?.trim()) p.lastName = lastName;

  const email = contact.email?.trim();
  if (email && !cfg.email?.trim()) p.email = email;

  const phone = contact.phone?.trim();
  if (phone && !cfg.phone?.trim()) p.phone = phone;

  const linkedIn = contact.linkedIn?.trim();
  if (linkedIn && !cfg.linkedinId?.trim()) p.linkedinId = linkedIn;

  const years = contact.years?.trim();
  if (years && !cfg.yearsOfExperience?.trim()) p.yearsOfExperience = years;

  if (
    (cfg.skills?.length ?? 0) === 0 &&
    contact.skills &&
    contact.skills.length > 0
  ) {
    p.skills = contact.skills;
  }
  return p;
}

const FIELD_LABELS: Record<string, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
  phone: 'Phone',
  linkedinId: 'LinkedIn',
  yearsOfExperience: 'Years of experience',
  skills: 'Skills',
};

/** Human labels for a backfill patch, e.g. ["Email", "LinkedIn"]. */
export function backfilledLabels(patch: Partial<NexusConfig>): string[] {
  return Object.keys(patch).map((k) => FIELD_LABELS[k] ?? k);
}
