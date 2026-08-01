import { expect, test } from '@playwright/test';
import { ensureOnboarded } from './helpers';

test('pipeline board: groups applied jobs by stage and moves a card', async ({
  page,
}) => {
  await ensureOnboarded();
  await page.goto('/jobs');

  // Switch to the Board view.
  await page.getByRole('button', { name: /^board$/i }).click();

  // All five pipeline columns render.
  for (const title of ['Applied', 'Replied', 'Interview', 'Offer', 'Closed']) {
    await expect(
      page.getByRole('region').filter({ has: page.getByRole('heading', { name: title }) }),
    ).toBeVisible();
  }

  // The seed always contains the applied "Registered Nurse" job — it sits in
  // the Applied or Replied column (spec 03 may have cycled it once). Move it
  // to Interview.
  const nurseSelect = page.getByRole('combobox', {
    name: /move registered nurse to stage/i,
  });
  await expect(nurseSelect).toBeVisible({ timeout: 15_000 });
  await nurseSelect.selectOption('interview');

  // The card lands in the Interview column.
  const interviewColumn = page.getByRole('region').filter({
    has: page.getByRole('heading', { name: 'Interview' }),
  });
  await expect(
    interviewColumn.getByText('Registered Nurse', { exact: true }),
  ).toBeVisible({
    timeout: 15_000,
  });

  // The move persists to the backend — a reload keeps it in Interview.
  await page.reload();
  await page.getByRole('button', { name: /^board$/i }).click();
  const interviewAfter = page.getByRole('region').filter({
    has: page.getByRole('heading', { name: 'Interview' }),
  });
  await expect(
    interviewAfter.getByText('Registered Nurse', { exact: true }),
  ).toBeVisible();
});
