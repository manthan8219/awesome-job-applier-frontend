import { expect, test } from '@playwright/test';
import { ensureOnboarded } from './helpers';

test('referral-ask variant: setup persists and email drafts use the referral template (KAN-28)', async ({
  page,
}) => {
  await ensureOnboarded();
  await page.goto('/outreach');
  await expect(
    page.getByRole('heading', { name: /recruiter outreach/i }),
  ).toBeVisible();

  // Enable the referral-ask variant and set custom templates.
  const referral = page.getByRole('switch', {
    name: /referral-ask variant/i,
  });
  await expect(referral).toBeVisible();
  await referral.click();
  await expect(referral).toHaveAttribute('aria-checked', 'true');

  await page
    .getByLabelText(/referral subject template/i)
    .fill('Intro for {{role}} at {{company}}');
  await page
    .getByLabelText(/referral body template/i)
    .fill('Could you introduce me to the hiring team?');
  await page.getByRole('button', { name: /save setup/i }).click();

  // The knobs persist through the real setup API round-trip.
  await page.reload();
  await expect(
    page.getByRole('switch', { name: /referral-ask variant/i }),
  ).toHaveAttribute('aria-checked', 'true');

  // Building the email queue drafts a referral-ask item using the custom body.
  await page.getByRole('button', { name: /^email$/i }).click();
  await page.getByRole('button', { name: /build email queue/i }).click();
  await expect(page.getByText(/could you introduce me/i).first()).toBeVisible({
    timeout: 15_000,
  });
});
