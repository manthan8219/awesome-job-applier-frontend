import { expect, test } from '@playwright/test';
import { API_URL, ensureOnboarded } from './helpers';

test('approves and opens the apply flow from the job detail page', async ({
  page,
  request,
}) => {
  await ensureOnboarded();
  // Create a fresh queued job so the spec is independent of other specs' state.
  const res = await request.post(`${API_URL}/jobs`, {
    data: {
      role: 'Radiologist',
      company: 'Acme Health',
      url: 'https://acme.health/careers/radio-e2e',
      location: 'Remote',
      remote: true,
    },
  });
  const created = (await res.json()) as { id: number; status: string };
  expect(created.status).toBe('queued');

  await page.goto(`/jobs/${created.id}`);
  await expect(
    page.getByRole('heading', { name: /radiologist/i }),
  ).toBeVisible();

  const approve = page.getByRole('button', { name: /approve for apply/i });
  await expect(approve).toBeVisible();
  const applyNow = page.getByRole('button', { name: /apply now/i });
  await expect(applyNow).toBeDisabled();

  await approve.click();
  await expect(
    page.getByRole('button', { name: /remove from queue/i }),
  ).toBeVisible();
  await expect(applyNow).toBeEnabled();

  // Open the consent dialog, inspect it, then cancel — never submit real apps.
  await applyNow.click();
  const dialog = page.getByRole('dialog', { name: /confirm applications/i });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /cancel/i }).click();
  await expect(dialog).toBeHidden();
});
