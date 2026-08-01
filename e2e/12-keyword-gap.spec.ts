import { expect, test, request } from '@playwright/test';
import { API_URL, ensureOnboarded } from './helpers';

test('keyword-gap panel: diffs the job description against resume skills and one-click adds a missing keyword (KAN-21)', async ({
  page,
}) => {
  await ensureOnboarded();

  // Deterministic seed: put "Go" on the resume skill list first.
  const ctx = await request.newContext();
  try {
    const res = await ctx.put(`${API_URL}/resume/skills`, {
      data: { skills: ['Go'] },
    });
    expect(res.ok()).toBeTruthy();
  } finally {
    await ctx.dispose();
  }

  // Open the seeded Cardiologist job detail.
  await page.goto('/jobs');
  await page.getByRole('link', { name: /cardiologist/i }).click();
  await expect(
    page.getByRole('heading', { name: /keyword gap/i }),
  ).toBeVisible();

  // The seeded skill "Go" is covered; the fallback JD text contributes other
  // keywords that are still missing → an honest gap count.
  await expect(page.getByText(/matched · \d+ missing/i)).toBeVisible();
  await expect(page.getByText('go', { exact: true })).toBeVisible();

  // One-click add flips a missing keyword to covered (skills now includes it).
  const addBackend = page.getByRole('button', { name: /add backend to skills/i });
  await expect(addBackend.first()).toBeVisible();
  await addBackend.first().click();

  await expect(
    page.getByRole('button', { name: /add backend to skills/i }),
  ).toHaveCount(0);
  await expect(page.getByText('backend', { exact: true })).toBeVisible();
});
