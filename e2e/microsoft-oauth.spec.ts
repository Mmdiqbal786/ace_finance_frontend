import { test, expect } from '@playwright/test';
import { clearAppStorage } from './helpers';

/**
 * @vapt C04 — Microsoft login starts Entra OAuth (MFA completion remains human)
 */
test.describe('Microsoft OAuth start @vapt', () => {
  test('Sign in with Microsoft navigates to login.microsoftonline.com', async ({
    page,
  }) => {
    await clearAppStorage(page);
    await page.goto('/login/');
    const ms = page.getByRole('link', { name: /Sign in with Microsoft/i });
    await expect(ms).toBeVisible();
    await Promise.all([
      page.waitForURL(/login\.microsoftonline\.com/i, { timeout: 45_000 }),
      ms.click(),
    ]);
    expect(page.url()).toMatch(/login\.microsoftonline\.com/i);
    expect(page.url()).toMatch(/oauth2|authorize/i);
  });
});
