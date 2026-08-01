import type { NexusConfig } from '@/types';

/**
 * Whether a user still needs to complete onboarding. A profile is
 * "search-ready" once they have described what they want — either concrete
 * target titles or a free-text intent (the "just exploring" path). Tolerates
 * partial configs: the backend omits empty fields (json omitempty), so
 * missing values count as "not set".
 */
export function shouldOnboard(
  cfg: Partial<Pick<NexusConfig, 'targetJobTitles' | 'jobIntent'>> | undefined,
): boolean {
  const titles = cfg?.targetJobTitles?.trim() ?? '';
  const intent = cfg?.jobIntent?.trim() ?? '';
  return titles === '' && intent === '';
}

/** A blank profile used by the onboarding wizard when no config exists yet. */
export function emptyProfile(): NexusConfig {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    linkedinId: '',
    resumePath: '',
    city: '',
    yearsOfExperience: '',
    targetJobTitles: '',
    jobIntent: '',
    workType: '',
    targetLocations: '',
    applyConsent: false,
    applyConsentAt: '',
    maxAppsPerRun: 10,
    maxAppsPerDay: 25,
    applyDelaySec: 8,
    minFitScore: 0,
    aiAssist: false,
    aiProvider: '',
  };
}
