import { expect, test } from '@playwright/test';
import { ensureOnboarded } from './helpers';

test('response-probability score renders on job detail and list rows (KAN-19)', async ({
  page,
}) => {
  await ensureOnboarded();
  await page.goto('/jobs');

  // The seeded jobs carry a backend-computed response score → list badge.
  await expect(page.getByText(/resp \d+/i).first()).toBeVisible();

  // The seeded Cardiologist (fit 92) detail shows the score + a why line.
  await page
    .getByRole('link', { name: /cardiologist/i })
    .first()
    .click();
  await expect(page.getByText(/response probability/i)).toBeVisible();
  await expect(page.getByText(/\/100/i).first()).toBeVisible();
  await expect(page.getByText(/posted recently|recent posting|provider/i).first()).toBeVisible();
});
