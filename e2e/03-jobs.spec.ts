import { expect, test } from '@playwright/test';

test('seeded jobs render and the review-queue consent flow works', async ({
  page,
}) => {
  await page.goto('/jobs');
  await expect(
    page.getByRole('heading', { name: /review & track applications/i }),
  ).toBeVisible();
  await expect(page.getByText(/cardiologist/i).first()).toBeVisible();

  // One seeded queued job is already approved → review banner is live.
  await expect(page.getByText(/approved/i).first()).toBeVisible();

  // Approve the second queued job.
  await page
    .getByRole('button', { name: /add to apply queue/i })
    .first()
    .click();
  await expect(page.getByText(/2 approved/i)).toBeVisible();

  // Consent dialog: inspect, then cancel (never submit real applications).
  await page
    .getByRole('button', { name: /apply approved/i })
    .first()
    .click();
  const dialog = page.getByRole('dialog', { name: /confirm applications/i });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(/daily cap/i);
  await dialog.getByRole('button', { name: /cancel/i }).click();
  await expect(dialog).toBeHidden();
});

test('outcome cycles on an applied job', async ({ page }) => {
  await page.goto('/jobs');
  const noResponse = page.getByRole('button', { name: /no response/i }).first();
  await noResponse.click();
  await expect(
    page.getByRole('button', { name: /^replied$/i }).first(),
  ).toBeVisible();
});
