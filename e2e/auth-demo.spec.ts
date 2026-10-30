import { test, expect } from '@playwright/test';
import {
  clearAppStorage,
  demoAccessLogin,
  DEMO_REQUESTER,
  signOutFromDashboard,
} from './helpers';

/**
 * @vapt C03 / C05 / C07 — Demo Access session, token storage, logout
 */
test.describe('Demo Access auth @vapt', () => {
  test('C03 Demo Access requester reaches dashboard with Demo badge', async ({
    page,
  }) => {
    await demoAccessLogin(page, DEMO_REQUESTER);
    await expect(
      page.getByRole('heading', { name: /Dashboard/i }).first(),
    ).toBeVisible({ timeout: 30_000 });
    // Demo workspace indicator (badge / label)
    await expect(page.getByText(/Demo|Sandbox/i).first()).toBeVisible();
  });

  test('C05 JWT not stored in localStorage as primary session', async ({
    page,
  }) => {
    await demoAccessLogin(page, DEMO_REQUESTER);
    const storage = await page.evaluate(() => ({
      local: { ...localStorage },
      session: { ...sessionStorage },
    }));
    const localBlob = JSON.stringify(storage.local);
    const sessionBlob = JSON.stringify(storage.session);
    expect(localBlob.includes('eyJ')).toBeFalsy();
    expect(
      sessionBlob.includes('ace_finance_token') ||
        sessionBlob.includes('eyJ') ||
        Object.keys(storage.session).length > 0,
    ).toBeTruthy();
  });

  test('C07 Sign Out returns to login and clears session token', async ({
    page,
  }) => {
    await demoAccessLogin(page, DEMO_REQUESTER);
    await signOutFromDashboard(page);
    await expect(page).toHaveURL(/\/login\/?/);
    const sessionBlob = await page.evaluate(() =>
      JSON.stringify({ ...sessionStorage }),
    );
    expect(sessionBlob.includes('ace_finance_token')).toBeFalsy();
  });

  test('bad Demo Access password shows error', async ({ page }) => {
    await clearAppStorage(page);
    await page.goto('/login/');
    await page.getByRole('button', { name: 'Demo Access' }).click();
    const gate = page.locator('#demo-gate-code');
    if (await gate.isVisible().catch(() => false)) {
      await gate.fill('definitely-wrong');
      await page.getByRole('button', { name: 'Unlock Demo Access' }).click();
      await expect(page.locator('.text-rose-800').first()).toBeVisible({
        timeout: 15_000,
      });
    }
  });
});
