import { expect, test } from '@playwright/test';
import { ensureOnboarded } from './helpers';

test('adds a manual job into the review queue end-to-end', async ({ page }) => {
  await ensureOnboarded();
  await page.goto('/jobs');

  // Entry point from the Jobs page.
  await page.getByRole('button', { name: /add job/i }).click();
  await expect(page.getByRole('heading', { name: /add a job/i })).toBeVisible();

  await page
    .getByRole('textbox', { name: /role title/i })
    .fill('Registered Nurse');
  await page.getByRole('textbox', { name: /company/i }).fill('Acme Health');
  await page
    .getByRole('textbox', { name: /job posting url/i })
    .fill('https://acme.health/careers/nurse-e2e');
  await page.getByRole('button', { name: /add to review queue/i }).click();

  // Lands back on the Jobs list with the new job in the queue.
  await expect(
    page.getByRole('heading', { name: /review & track applications/i }),
  ).toBeVisible();
  await expect(page.getByText(/registered nurse/i).first()).toBeVisible();
});
