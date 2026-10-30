import { expect, Page } from '@playwright/test';

export const DEMO_CODE =
  process.env.DEMO_ACCESS_CODE?.trim() || 'Aceolution_2024';

export const DEMO_REQUESTER = {
  nameHint: 'Requester GAC',
  password: process.env.DEMO_REQUESTER_PASSWORD || 'Requester@1234',
};

export async function clearAppStorage(page: Page) {
  await page.goto('/login/');
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
  });
}

/** Unlock Demo Access on the login page and open a persona. */
export async function demoAccessLogin(
  page: Page,
  opts: { nameHint: string; password: string } = DEMO_REQUESTER,
) {
  await clearAppStorage(page);
  await page.goto('/login/');
  await expect(page.getByRole('button', { name: 'Demo Access' })).toBeVisible();
  await page.getByRole('button', { name: 'Demo Access' }).click();

  const gate = page.locator('#demo-gate-code');
  if (await gate.isVisible().catch(() => false)) {
    await gate.fill(DEMO_CODE);
    await page.getByRole('button', { name: 'Unlock Demo Access' }).click();
  }

  await expect(
    page.getByRole('button', { name: new RegExp(opts.nameHint, 'i') }).first(),
  ).toBeVisible({ timeout: 30_000 });
  await page
    .getByRole('button', { name: new RegExp(opts.nameHint, 'i') })
    .first()
    .click();

  await page.locator('#demo-persona-password').fill(opts.password);
  await page.getByRole('button', { name: 'Sign in →' }).click();

  await expect(page).toHaveURL(/\/dashboard\/?/, { timeout: 45_000 });
}

export async function signOutFromDashboard(page: Page) {
  // Mobile/desktop: open menu if Sign Out not visible
  const signOut = page.getByRole('button', { name: 'Sign Out' }).first();
  if (!(await signOut.isVisible().catch(() => false))) {
    const menu = page.getByRole('button', { name: /Menu|Close menu/i }).first();
    if (await menu.isVisible().catch(() => false)) await menu.click();
  }
  await page.getByRole('button', { name: 'Sign Out' }).first().click();
  // Confirm dialog — prefer the dialog primary action
  const dialogConfirm = page
    .getByRole('dialog')
    .getByRole('button', { name: 'Sign Out' });
  if (await dialogConfirm.isVisible().catch(() => false)) {
    await dialogConfirm.click();
  } else {
    await page.getByRole('button', { name: 'Sign Out' }).last().click();
  }
  await expect(page).toHaveURL(/\/login\/?$/, { timeout: 30_000 });
  await expect(page.getByRole('button', { name: 'Demo Access' })).toBeVisible({
    timeout: 15_000,
  });
}
