import { expect, test } from '@playwright/test';
import { ensureOnboarded } from './helpers';

test('guided reply-probability feed ranks seeded jobs with a why line (KAN-29)', async ({
  page,
}) => {
  await ensureOnboarded();
  await page.goto('/dashboard');

  await expect(
    page.getByRole('heading', { name: /top reply-probability jobs/i }),
  ).toBeVisible();

  // The seeded Cardiologist (fit 92) should top the feed with a why line.
  const cardiologist = page
    .getByRole('link', { name: /cardiologist @ acme health/i })
    .first();
  await expect(cardiologist).toBeVisible();
  await expect(page.getByText(/fit 92/i).first()).toBeVisible();

  // Next action: the row links into the jobs review queue.
  await cardiologist.click();
  await expect(
    page.getByRole('heading', { name: /review & track applications/i }),
  ).toBeVisible();

  // Response-probability copy shift is live on the dashboard.
  await page.goto('/dashboard');
  await expect(
    page.getByText(/target the jobs most likely to reply/i),
  ).toBeVisible();
});
