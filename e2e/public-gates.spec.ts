import { test, expect } from '@playwright/test';
import { clearAppStorage, DEMO_CODE } from './helpers';

/**
 * @vapt B03 / B04 — public gates and architecture block
 */
test.describe('Public gates @vapt', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppStorage(page);
  });

  test('B04 /architecture is blocked (404)', async ({ request }) => {
    const res = await request.get('/architecture/');
    expect(res.status()).toBe(404);
  });

  test('B03 demo-guide rejects wrong code and unlocks with right code', async ({
    page,
  }) => {
    await page.goto('/demo-guide/');
    await expect(
      page.getByRole('heading', { name: /Demo Access/i }),
    ).toBeVisible();

    await page.locator('#demo-gate-password').fill('wrong-code-xyz');
    await page.getByRole('button', { name: /Unlock Demo Guide/i }).click();
    await expect(page.locator('.text-rose-800, .border-rose-300').first()).toBeVisible({
      timeout: 15_000,
    });

    await page.locator('#demo-gate-password').fill(DEMO_CODE);
    await page.getByRole('button', { name: /Unlock Demo Guide/i }).click();
    await expect(page.getByText(/test account|walkthrough|Requester/i).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test('dashboard without session redirects to login', async ({ page }) => {
    await page.goto('/dashboard/');
    await expect(page).toHaveURL(/\/login\/?/, { timeout: 30_000 });
    await expect(page.getByRole('button', { name: 'Demo Access' })).toBeVisible({
      timeout: 15_000,
    });
  });
});
