import { expect, test } from '@playwright/test';
import { ensureOnboarded } from './helpers';

test('companies page: add company form round-trips through the backend', async ({
  page,
}) => {
  await ensureOnboarded();
  await page.goto('/companies');
  await expect(
    page.getByRole('heading', { name: /company index/i }),
  ).toBeVisible();

  // The toolbar "Add" button opens the form (the form's own submit is
  // labeled "Add company").
  await page.getByRole('button', { name: /^add$/i }).click();
  await page
    .getByRole('textbox', { name: /company name/i })
    .fill('Acme Health');
  await page
    .getByRole('textbox', { name: /ats \/ careers url/i })
    .fill('https://boards.greenhouse.io/acmehealth');
  await page.getByRole('button', { name: /add company/i }).click();

  // The backend companies surface is a stub (empty list) — the form must
  // still close and the page render its empty state without crashing.
  await expect(page.getByText(/no companies/i)).toBeVisible();
});

test('contacts page: search against the backend stub shows the empty state', async ({
  page,
}) => {
  await ensureOnboarded();
  await page.goto('/contacts');
  await expect(
    page.getByRole('heading', { name: /hr contact finder/i }),
  ).toBeVisible();

  await page.getByPlaceholder(/linear, vercel, stripe/i).fill('Stripe');
  await page.getByRole('button', { name: /search contacts/i }).click();
  await expect(page.getByText(/no contacts found/i)).toBeVisible();
});

test('outreach page: opt-in gate + setup tab render', async ({ page }) => {
  await ensureOnboarded();
  await page.goto('/outreach');
  await expect(
    page.getByRole('heading', { name: /recruiter outreach/i }),
  ).toBeVisible();

  // Setup is the default tab — opt-in toggle is right there.
  await expect(page.getByText(/opt in to outreach/i)).toBeVisible();

  // Switching to the Email queue shows the opt-in gate banner.
  await page.getByRole('button', { name: /^email$/i }).click();
  await expect(page.getByText(/outreach is opt-in/i)).toBeVisible();
});

test('logs page renders the engine log and usage panel', async ({ page }) => {
  await ensureOnboarded();
  await page.goto('/logs');
  await expect(
    page.getByRole('heading', { name: /engine log/i }),
  ).toBeVisible();
  await expect(page.getByText(/usage/i).first()).toBeVisible();
  await expect(page.getByText(/nexus\.log/i)).toBeVisible();
});
