import { test, expect } from '@playwright/test';
import { demoAccessLogin, DEMO_REQUESTER, signOutFromDashboard } from './helpers';

/**
 * Requester UI smoke: can open Submit / My Requests; cannot open admin users via URL alone.
 */
test.describe('Requester RBAC navigation', () => {
  test('requester can open Submit Expense and My Requests', async ({ page }) => {
    await demoAccessLogin(page, DEMO_REQUESTER);

    await page.goto('/dashboard/submit-expense/');
    await expect(page).toHaveURL(/submit-expense/);
    await expect(
      page.getByRole('heading', { name: /Submit|Expense/i }).first(),
    ).toBeVisible({ timeout: 30_000 });

    await page.goto('/dashboard/my-requests/');
    await expect(page).toHaveURL(/my-requests/);
    await expect(
      page.getByRole('heading', { name: /My Requests|Requests/i }).first(),
    ).toBeVisible({ timeout: 30_000 });

    await page.goto('/dashboard/user-management/');
    // Soft guard: either redirected away or page does not show admin create UI
    const url = page.url();
    const createUser = page.getByRole('button', { name: /Create User|Add User/i });
    const onAdminUsers =
      /user-management/.test(url) && (await createUser.isVisible().catch(() => false));
    expect(onAdminUsers).toBeFalsy();

    await signOutFromDashboard(page);
  });
});
