import { expect, test } from '@playwright/test';

test('dashboard renders mission control with stats, checklist, and controls', async ({
  page,
}) => {
  await page.goto('/dashboard');
  await expect(
    page.getByRole('heading', { name: /your job-hunt command center/i }),
  ).toBeVisible();
  // Ready checklist + mode controls are present.
  await expect(page.getByText(/resume path/i).first()).toBeVisible();
  await expect(
    page.getByRole('button', { name: /start search/i }),
  ).toBeVisible();
  // The providers grid renders the job-board names.
  await expect(page.getByText(/greenhouse/i).first()).toBeVisible();
});

test('start then stop the engine reflects live status', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByRole('button', { name: /start search/i }).click();
  await expect(page.getByText(/engine live/i).first()).toBeVisible({
    timeout: 20_000,
  });
  await page.getByRole('button', { name: /stop engine/i }).click();
  await expect(page.getByText(/engine idle/i).first()).toBeVisible({
    timeout: 20_000,
  });
});
