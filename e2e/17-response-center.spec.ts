import { expect, test } from '@playwright/test';
import { ensureOnboarded } from './helpers';

test('response center: funnel + reply probability render, and an A/B-tagged outreach item shows up in variant results (KAN-27)', async ({
  page,
}) => {
  await ensureOnboarded();

  // Build an email queue from the seeded applied jobs, then tag one item as
  // Variant A (the A/B test workflow).
  await page.goto('/outreach');
  await page.getByRole('button', { name: /^email/i }).click();
  await page.getByRole('button', { name: /build email queue/i }).click();
  await expect(page.getByText(/acme health/i).first()).toBeVisible({
    timeout: 15_000,
  });

  const variantSelect = page
    .getByRole('combobox', { name: /a\/b variant for/i })
    .first();
  await variantSelect.selectOption('A');
  await expect(
    page.getByRole('combobox', { name: /a\/b variant for/i }).first(),
  ).toHaveValue('A');

  // The Response Center turns it into a decision dashboard.
  await page.goto('/response');
  await expect(
    page.getByRole('heading', { name: /is anyone replying/i }),
  ).toBeVisible();

  await expect(page.getByText(/overall reply probability/i)).toBeVisible();
  await expect(page.getByText(/pipeline funnel/i)).toBeVisible();
  await expect(page.getByText(/a\/b variants tracked/i)).toBeVisible();
  await expect(page.getByText('Variant A')).toBeVisible();
});
