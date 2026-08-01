import { expect, test } from '@playwright/test';
import { ensureOnboarded } from './helpers';

test('config tailoring knobs persist through the real config API (KAN-20)', async ({
  page,
}) => {
  await ensureOnboarded();
  await page.goto('/config');
  await expect(
    page.getByRole('heading', { name: /all settings/i }),
  ).toBeVisible();

  // The Tailoring card exposes the auto-tailor switch + rounds knob.
  const tailor = page.getByRole('switch', {
    name: /auto-tailor each high-fit application/i,
  });
  await tailor.scrollIntoViewIfNeeded();
  await expect(tailor).toBeVisible();
  await expect(tailor).toHaveAttribute('aria-checked', 'false');

  // Toggle tailoring on and set the review-loop cap.
  await tailor.click();
  const rounds = page.getByLabel(/max tailoring rounds/i);
  await expect(rounds).toBeVisible();
  await rounds.fill('5');

  // Save-now round-trips the full config PUT to the backend.
  await page.getByRole('button', { name: /save now/i }).click();
  await expect(page.getByText(/auto-saved/i)).toBeVisible();

  // Reload — the knobs persist (real GET /api/config round-trip).
  await page.reload();
  await expect(
    page.getByRole('heading', { name: /all settings/i }),
  ).toBeVisible();
  await expect(
    page.getByRole('switch', {
      name: /auto-tailor each high-fit application/i,
    }),
  ).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByLabel(/max tailoring rounds/i)).toHaveValue('5');
});
