import { expect, test } from '@playwright/test';
import { ensureOnboarded } from './helpers';

test('resume studio: skills persist through the real config API', async ({
  page,
}) => {
  await ensureOnboarded();
  await page.goto('/resume');
  await expect(
    page.getByRole('heading', { name: /build a stronger resume/i }),
  ).toBeVisible();

  // Navigate to Step 4 — Skills.
  await page.getByRole('button', { name: /skills/i }).click();
  await expect(page.getByText(/step 4 — skills/i)).toBeVisible();

  const input = page.getByPlaceholder(/type a skill/i);
  await input.fill('Cardiology');
  await input.press('Enter');
  await expect(page.getByText(/cardiology/i).first()).toBeVisible();

  // The save indicator reports success (real PUT to the backend).
  await expect(page.getByText(/saved/i).first()).toBeVisible();
});

test('resume studio: New resume step shows an honest readiness state without AI', async ({
  page,
}) => {
  await ensureOnboarded();
  await page.goto('/resume');
  await page.getByRole('button', { name: /new resume/i }).click();
  await expect(page.getByText(/step 3 — new resume/i)).toBeVisible();

  // Template picker comes from the real backend registry (12 curated designs).
  await expect(page.getByText(/choose the design/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /^classic/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /sidebar/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /developer/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /split/i })).toBeVisible();

  // No AI keys in the E2E env → the checklist explains why Generate is locked.
  await expect(page.getByText(/AI Assist on/i)).toBeVisible();
  await expect(
    page.getByRole('button', { name: /generate resume/i }),
  ).toBeDisabled();
});

test('config page loads and save-now persists to the backend', async ({
  page,
}) => {
  await ensureOnboarded();
  await page.goto('/config');
  await expect(
    page.getByRole('heading', { name: /all settings/i }),
  ).toBeVisible();

  // Save-now round-trips a full config PUT to the backend and shows the
  // success indicator. (Input labels are not yet associated with their
  // fields, so we drive the page through the Save button instead.)
  await page.getByRole('button', { name: /save now/i }).click();
  await expect(page.getByText(/auto-saved/i)).toBeVisible();
});

test('config notifications: run-summary trigger renders (disabled without channels)', async ({
  page,
}) => {
  await ensureOnboarded();
  await page.goto('/config');

  const summaryBtn = page.getByRole('button', {
    name: /send run summary/i,
  });
  await summaryBtn.scrollIntoViewIfNeeded();
  await expect(summaryBtn).toBeVisible();
  // The isolated E2E backend has no channels configured → honest disabled state.
  await expect(summaryBtn).toBeDisabled();
});
