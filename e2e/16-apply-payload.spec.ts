import { expect, test } from '@playwright/test';
import { ensureOnboarded } from './helpers';

test('submitted payload audit renders on an applied job detail (KAN-33)', async ({
  page,
}) => {
  await ensureOnboarded();
  await page.goto('/jobs');

  // The seeded applied job (Registered Nurse) carries a deterministic payload.
  await page.getByRole('link', { name: /registered nurse/i }).click();
  await expect(
    page.getByRole('heading', { name: /submitted payload/i }),
  ).toBeVisible();

  await page
    .getByRole('button', { name: /toggle submitted payload/i })
    .click();

  await expect(page.getByText('resume.pdf')).toBeVisible();
  await expect(page.getByText(/why this role/i)).toBeVisible();
  await expect(page.getByText('AI')).toBeVisible();
  await expect(page.getByText('because')).toBeVisible();
});
