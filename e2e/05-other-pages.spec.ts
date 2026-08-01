import { expect, test } from '@playwright/test';
import { ensureOnboarded } from './helpers';

test('companies page: add a company through the backend', async ({ page }) => {
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

  // The company persists to the backend and appears in the index.
  await expect(page.getByText(/acme health/i).first()).toBeVisible();
});

test('contacts page: OSINT search surfaces pattern contacts, then save/delete', async ({
  page,
}) => {
  await ensureOnboarded();
  await page.goto('/contacts');
  await expect(
    page.getByRole('heading', { name: /hr contact finder/i }),
  ).toBeVisible();

  // Company + domain → the pattern source always generates emails like
  // careers@stripe.com (works without Hunter/Apollo keys).
  await page.getByPlaceholder(/linear, vercel, stripe/i).fill('Stripe');
  await page.getByPlaceholder(/linear\.app/i).fill('stripe.com');
  await page.getByRole('button', { name: /search contacts/i }).click();
  await expect(page.getByText(/careers@stripe\.com/i).first()).toBeVisible({
    timeout: 30_000,
  });

  // Save the guaranteed pattern contact (careers@stripe.com) — the row is a
  // flex div containing that email; the first GitHub/OSINT results vary with
  // the network, so scope the Save click to this row.
  const careersRow = page
    .getByText(/careers@stripe\.com/i)
    .first()
    .locator(
      'xpath=ancestor::div[contains(@class, "flex items-center")][last()]',
    );
  await careersRow.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('button', { name: /^saved/i }).click();
  await expect(page.getByText(/careers@stripe\.com/i).first()).toBeVisible();

  // Delete it — the list empties back to the empty state.
  await page.getByRole('button', { name: /delete contact/i }).click();
  await expect(page.getByText(/no saved contacts yet/i)).toBeVisible();
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
