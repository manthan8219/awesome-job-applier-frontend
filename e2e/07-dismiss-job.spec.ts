import { expect, test } from '@playwright/test';
import { ensureOnboarded } from './helpers';

test('dismisses a queued job end-to-end', async ({ page }) => {
  await ensureOnboarded();
  await page.goto('/jobs');

  // Scope to the review queue (seeded: Cardiologist approved, Staff Engineer queued).
  await page.getByRole('button', { name: /^queue$/i }).click();

  const dismiss = page.getByRole('button', {
    name: /dismiss staff engineer/i,
  });
  await expect(dismiss).toBeVisible();
  await dismiss.click();

  // The dismissed job leaves the queue; the other queued job stays.
  await expect(dismiss).toBeHidden();
  await expect(
    page.getByRole('button', { name: /dismiss cardiologist/i }),
  ).toBeVisible();
});
