import { expect, test } from '@playwright/test';
import { ensureOnboarded } from './helpers';

test('bookmarklet prefill: /jobs/new?role&company&url drops a job into the queue', async ({
  page,
}) => {
  await ensureOnboarded();
  await page.goto(
    '/jobs/new?role=Senior%20Engineer&company=Acme%20Health&url=https%3A%2F%2Facme.health%2Fcareers%2Fse&location=Remote',
  );

  // The bookmarklet-style query params pre-fill the form.
  await expect(page.getByRole('textbox', { name: /role title/i })).toHaveValue(
    'Senior Engineer',
  );
  await expect(page.getByRole('textbox', { name: /company/i })).toHaveValue(
    'Acme Health',
  );
  await expect(
    page.getByRole('textbox', { name: /job posting url/i }),
  ).toHaveValue('https://acme.health/careers/se');

  await page.getByRole('button', { name: /add to review queue/i }).click();

  // Lands on Jobs with the new job visible in the list (queued).
  await expect(
    page.getByRole('heading', { name: /review & track applications/i }),
  ).toBeVisible();
  await expect(page.getByText(/senior engineer/i).first()).toBeVisible();
  await expect(page.getByText(/acme health/i).first()).toBeVisible();
});

test('bookmarklet installer page renders a javascript: snippet', async ({
  page,
}) => {
  await ensureOnboarded();
  await page.goto('/bookmarklet');
  await expect(
    page.getByRole('heading', { name: /send jobs to nexus/i }),
  ).toBeVisible();

  const link = page.getByTestId('bookmarklet-link');
  await expect(link).toBeVisible();
  const href = await link.getAttribute('href');
  expect(href).toMatch(/^javascript:/);
  expect(href).toContain('/jobs/new?role=');
});
