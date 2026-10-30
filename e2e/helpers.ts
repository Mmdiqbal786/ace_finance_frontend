import { expect, Page } from '@playwright/test';

export const DEMO_CODE =
  process.env.DEMO_ACCESS_CODE?.trim() || 'Aceolution_2024';

export const DEMO_REQUESTER = {
  nameHint: 'Requester GAC',
  password: process.env.DEMO_REQUESTER_PASSWORD || 'Requester@1234',
};

export const DEMO_APPROVER = {
  nameHint: 'Approver Media',
  password: process.env.DEMO_APPROVER_PASSWORD || 'Approver@1234',
};

export const DEMO_PROCESSOR = {
  nameHint: 'Alisha',
  password: process.env.DEMO_PROCESSOR_PASSWORD || 'Processor@1234',
};

export const ADMIN_PASSWORD = {
  email: process.env.ADMIN_E2E_EMAIL || 'finance@aceolution.com',
  password: process.env.ADMIN_E2E_PASSWORD || 'Admin@1234',
};

/** Pause so voice-over / viewers can follow (docs walkthroughs). */
export async function hold(page: Page, ms = 2800) {
  await page.waitForTimeout(ms);
}

/** Admin password login → Choose Demo workspace. */
export async function adminPasswordLoginDemo(page: Page) {
  await clearAppStorage(page);
  await page.goto('/login/');
  await page.getByRole('button', { name: /Use password instead/i }).click();
  await expect(page.locator('#login-email')).toBeVisible({ timeout: 15_000 });
  await page.locator('#login-email').fill(ADMIN_PASSWORD.email);
  await page.locator('#login-password').fill(ADMIN_PASSWORD.password);
  await page.locator('#login-submit').click();

  const chooseWs = page.getByRole('heading', { name: /Choose Workspace/i });
  await expect(chooseWs).toBeVisible({ timeout: 30_000 });
  const demoBtn = page
    .getByRole('button')
    .filter({ hasText: /Demo \/ training data/i })
    .first();
  await expect(demoBtn).toBeVisible({ timeout: 10_000 });
  await Promise.all([
    page.waitForResponse(
      (r) =>
        /\/auth\/select-workspace\/?$/i.test(r.url()) &&
        r.request().method() === 'POST',
      { timeout: 60_000 },
    ),
    demoBtn.click(),
  ]);

  await expect(page).toHaveURL(/\/dashboard\/?/, { timeout: 60_000 });
}

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
    const unlocked = await gate.isDisabled().catch(() => false);
    if (!unlocked) {
      await gate.fill(DEMO_CODE);
      const unlockBtn = page.getByRole('button', { name: /Unlock Demo Access/i });
      await unlockBtn.click();
    }
  }

  // Wait out "Checking…" unlock / pack load
  await expect(page.getByRole('button', { name: /Checking/i })).toHaveCount(0, {
    timeout: 90_000,
  }).catch(() => null);

  const persona = page
    .getByRole('button', { name: new RegExp(opts.nameHint, 'i') })
    .first();
  await expect(persona).toBeVisible({ timeout: 90_000 });
  await persona.click();

  await page.locator('#demo-persona-password').fill(opts.password);
  await page.getByRole('button', { name: 'Sign in →' }).click();

  await expect(page).toHaveURL(/\/dashboard\/?/, { timeout: 60_000 });
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
