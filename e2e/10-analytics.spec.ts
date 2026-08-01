import { expect, test } from '@playwright/test';
import { ensureOnboarded } from './helpers';

test('analytics: pipeline funnel, provider yield, and CSV export', async ({
  page,
}) => {
  await ensureOnboarded();
  await page.goto('/analytics');
  await expect(
    page.getByRole('heading', { name: /job search analytics/i }),
  ).toBeVisible();

  // The seeded applied jobs power the funnel + provider table.
  await expect(page.getByText('Pipeline funnel')).toBeVisible();
  await expect(page.getByText('Applied → Replied')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Per-provider yield' }),
  ).toBeVisible();
  await expect(
    page.getByRole('cell', { name: /greenhouse|lever|ashby/i }).first(),
  ).toBeVisible();

  // CSV export triggers a real download.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /export csv/i }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.csv$/);
});
