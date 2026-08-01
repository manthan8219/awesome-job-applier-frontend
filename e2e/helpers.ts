import { request } from '@playwright/test';

/** The test backend port (must match playwright.config.ts). */
export const API_URL = 'http://localhost:18080/api';

/** Reset the Nexus config to a fresh, un-onboarded state. */
export async function resetConfig(): Promise<void> {
  const ctx = await request.newContext();
  try {
    const res = await ctx.get(`${API_URL}/config`);
    const cfg = (await res.json()) as Record<string, unknown>;
    await ctx.put(`${API_URL}/config`, {
      data: {
        ...cfg,
        firstName: '',
        lastName: '',
        email: '',
        targetJobTitles: '',
        jobIntent: '',
        applyConsent: false,
      },
    });
  } finally {
    await ctx.dispose();
  }
}

/** Make sure the config is onboarded (app shell reachable). */
export async function ensureOnboarded(): Promise<void> {
  const ctx = await request.newContext();
  try {
    const res = await ctx.get(`${API_URL}/config`);
    const cfg = (await res.json()) as Record<string, unknown>;
    if (!cfg.targetJobTitles && !cfg.jobIntent) {
      await ctx.put(`${API_URL}/config`, {
        data: {
          ...cfg,
          jobIntent: 'exploring',
          workType: 'Remote',
        },
      });
    }
  } finally {
    await ctx.dispose();
  }
}
