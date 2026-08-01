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

  // Typing surfaces offline title suggestions — the profession catalog works
  // for any role (doctor, engineer, …) without AI keys.
  await page.getByLabel(/what job do you want/i).fill('Cardiologist, remote');
  await expect(page.getByText(/cardiologist/i).first()).toBeVisible({
    timeout: 8000,
  });

  // Explore with defaults → profile step.
  await page.getByRole('button', { name: /just exploring/i }).click();
  await expect(page.getByText(/does this look right/i)).toBeVisible();

  // Profile completeness: personal details + explicit apply consent.
  await page.getByLabel(/first name/i).fill('Ada');
  await page.getByLabel(/last name/i).fill('Lovelace');
  await page.getByLabel(/email/i).fill('ada@example.com');
  await page.getByRole('checkbox', { name: /i consent to nexus/i }).check();

  // The wizard now asks for AI Assist before the dry run — it is skippable.
  await page.getByRole('button', { name: /show me jobs/i }).click();
  await expect(
    page.getByRole('heading', { name: /boost your results with ai assist/i }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /turn on ai assist/i }),
  ).toBeVisible();

  // Skip → dashboard (config now has the profile + consent saved).
  await page.getByRole('button', { name: /skip — go to the dashboard/i }).click();
  await expect(
    page.getByRole('heading', { name: /your job-hunt command center/i }),
  ).toBeVisible();

  // The Ready checklist picked up the profile: name/email hints are gone.
  await expect(page.getByText(/fill your name in config/i)).toHaveCount(0);
  await expect(page.getByText(/fill your email in config/i)).toHaveCount(0);
});
