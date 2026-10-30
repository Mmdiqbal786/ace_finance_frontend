import { test, expect } from '@playwright/test';
import {
  DEMO_APPROVER,
  DEMO_PROCESSOR,
  DEMO_REQUESTER,
  adminPasswordLoginDemo,
  demoAccessLogin,
  hold,
  signOutFromDashboard,
} from './helpers';

/**
 * @docs Demo workspace role walkthroughs — always record video for voice-over docs.
 *
 *   npm run test:e2e:docs
 *   npm run docs:publish-videos
 *
 * Narration: docs/videos/VOICE-SCRIPTS.md
 */
test.describe('Role walkthroughs (Demo) @docs', () => {
  test.setTimeout(180_000);

  test('01 Requester Demo walkthrough', async ({ page }) => {
    await demoAccessLogin(page, DEMO_REQUESTER);
    await hold(page, 3500);

    await expect(page.getByText(/Demo/i).first()).toBeVisible();
    await hold(page);

    await page.getByRole('link', { name: /Submit Expense/i }).click();
    await expect(page).toHaveURL(/submit-expense/);
    await expect(
      page.getByRole('heading', { name: /Submit|Expense/i }).first(),
    ).toBeVisible({ timeout: 30_000 });
    await hold(page, 4000);

    await page.getByRole('link', { name: 'My Requests', exact: true }).click();
    await expect(page).toHaveURL(/my-requests/);
    await expect(
      page.getByRole('heading', { name: /My|Requests/i }).first(),
    ).toBeVisible({ timeout: 30_000 });
    await hold(page, 4000);

    await page.getByRole('link', { name: 'Dashboard', exact: true }).first().click();
    await hold(page, 2500);

    await signOutFromDashboard(page);
    await hold(page, 2000);
  });

  test('02 Approver Demo walkthrough', async ({ page }) => {
    await demoAccessLogin(page, DEMO_APPROVER);
    await hold(page, 3500);

    await page.getByRole('link', { name: /^Approver/i }).click();
    await expect(page).toHaveURL(/approver/);
    await expect(
      page.getByRole('heading', { name: /Approver/i }).first(),
    ).toBeVisible({ timeout: 30_000 });
    await hold(page, 4500);

    // Open first row if any expense is listed (view only — no approve in docs run)
    const row = page.locator('table tbody tr, [data-expense-id]').first();
    if (await row.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await row.click();
      await hold(page, 4000);
      const close = page.getByRole('button', { name: /Close|Cancel|Back/i }).first();
      if (await close.isVisible().catch(() => false)) {
        await close.click();
        await hold(page, 1500);
      }
    }

    await page.getByRole('link', { name: /Analytics/i }).click();
    await expect(page).toHaveURL(/analytics/);
    await hold(page, 3500);

    await signOutFromDashboard(page);
    await hold(page, 2000);
  });

  test('03 Processor Demo walkthrough', async ({ page }) => {
    await demoAccessLogin(page, DEMO_PROCESSOR);
    await hold(page, 3500);

    await page.getByRole('link', { name: /^Processor/i }).click();
    await expect(page).toHaveURL(/processor/);
    await expect(
      page.getByRole('heading', { name: /Processor/i }).first(),
    ).toBeVisible({ timeout: 30_000 });
    await hold(page, 4500);

    const row = page.locator('table tbody tr, [data-expense-id]').first();
    if (await row.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await row.click();
      await hold(page, 4000);
      const close = page.getByRole('button', { name: /Close|Cancel|Back/i }).first();
      if (await close.isVisible().catch(() => false)) {
        await close.click();
        await hold(page, 1500);
      }
    }

    await page.getByRole('link', { name: /Analytics/i }).click();
    await hold(page, 3500);

    await signOutFromDashboard(page);
    await hold(page, 2000);
  });

  test('04 Admin Demo walkthrough', async ({ page }) => {
    await adminPasswordLoginDemo(page);
    await hold(page, 3500);

    await expect(page.getByText(/Demo/i).first()).toBeVisible();
    await hold(page);

    await page.getByRole('link', { name: /User Management/i }).click();
    await expect(page).toHaveURL(/user-management/);
    await hold(page, 4000);

    await page.getByRole('link', { name: /^Projects$/i }).click();
    await expect(page).toHaveURL(/projects/);
    await hold(page, 3500);

    await page.getByRole('link', { name: /^Categories$/i }).click();
    await expect(page).toHaveURL(/categories/);
    await hold(page, 3500);

    await page.getByRole('link', { name: /^Approver/i }).click();
    await hold(page, 3000);

    await page.getByRole('link', { name: /^Processor/i }).click();
    await hold(page, 3000);

    await page.getByRole('link', { name: /Analytics/i }).click();
    await hold(page, 3500);

    await signOutFromDashboard(page);
    await hold(page, 2000);
  });
});
