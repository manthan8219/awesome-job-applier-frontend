import { expect, test } from '@playwright/test';
import { resetConfig } from './helpers';

test('first-run wizard takes a fresh user through to the dashboard', async ({
  page,
}) => {
  await resetConfig();
  await page.goto('/');

  // The gate redirects / to the onboarding wizard for a fresh profile.
  await expect(
    page.getByRole('heading', { name: /find your next job/i }),
  ).toBeVisible();

  // Typing surfaces the honest AI-unavailable state (backend AI is off).
  await page.getByLabel(/what job do you want/i).fill('Cardiologist, remote');
  await expect(page.getByText(/AI Assist is off/i)).toBeVisible({
    timeout: 8000,
  });

  // Explore with defaults → profile step.
  await page.getByRole('button', { name: /just exploring/i }).click();
  await expect(page.getByText(/does this look right/i)).toBeVisible();

  // Skip → dashboard (config now has a job intent, so the gate passes).
  await page.getByRole('button', { name: /skip/i }).click();
  await expect(
    page.getByRole('heading', { name: /your job-hunt command center/i }),
  ).toBeVisible();
});
