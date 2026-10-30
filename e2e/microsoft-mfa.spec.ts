import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * @vapt @mfa C04 — Full Microsoft login including Authenticator number-match.
 *
 * Forces Entra `prompt=login` so MFA is not skipped by a trusted browser session.
 * You must approve the number in Microsoft Authenticator when the challenge appears.
 *
 *   set MS_E2E_EMAIL=iqbal@aceolution.com
 *   set MS_E2E_PASSWORD=***
 *   npm run test:e2e:mfa
 */
const API =
  process.env.API_URL ||
  'https://ace-finance-api-f5hnhhd6c3bvffhj.southindia-01.azurewebsites.net';
const EMAIL = (process.env.MS_E2E_EMAIL || 'iqbal@aceolution.com').trim();
const PASSWORD = (process.env.MS_E2E_PASSWORD || '').trim();
const MFA_TIMEOUT_MS = Number(process.env.MS_E2E_MFA_TIMEOUT_MS || 180_000);

test.describe('Microsoft MFA full login @vapt @mfa', () => {
  test.setTimeout(MFA_TIMEOUT_MS + 120_000);

  test('C04 forced prompt=login → Authenticator → Live dashboard', async ({
    page,
    context,
  }) => {
    test.skip(
      !PASSWORD,
      'Set MS_E2E_PASSWORD to run the fresh Microsoft MFA e2e',
    );

    // Drop any Microsoft SSO cookies so Entra cannot reuse a silent session
    await context.clearCookies();

    await page.goto(`${API}/auth/microsoft/login?prompt=login`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await expect(page).toHaveURL(/login\.microsoftonline\.com/i, {
      timeout: 45_000,
    });

    // Email / account step
    const emailBox = page.locator(
      'input[type="email"], input[name="loginfmt"]',
    );
    if (await emailBox.isVisible({ timeout: 15_000 }).catch(() => false)) {
      await emailBox.fill(EMAIL);
      await page
        .locator(
          'input[type="submit"][value="Next"], input[type="submit"]#idSIButton9, button:has-text("Next")',
        )
        .first()
        .click();
    } else {
      // Account picker
      const acct = page.getByRole('button', {
        name: new RegExp(EMAIL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      });
      if (await acct.isVisible().catch(() => false)) {
        await acct.click();
      }
    }

    // Password
    const pwd = page.locator('input[type="password"], input[name="passwd"]');
    await expect(pwd).toBeVisible({ timeout: 30_000 });
    await pwd.fill(PASSWORD);
    await page
      .locator(
        'input[type="submit"][value="Sign in"], input[type="submit"]#idSIButton9, button:has-text("Sign in")',
      )
      .first()
      .click();

    // Stay signed in? — decline to keep sessions clean
    const stayNo = page.locator(
      'input#idBtn_Back, input[value="No"], button:has-text("No")',
    );
    const mfaHeading = page.getByRole('heading', {
      name: /Approve sign in|Verify your identity|Enter code/i,
    });

    // Either MFA, or KMSI, or already redirected
    await Promise.race([
      mfaHeading.waitFor({ timeout: 45_000 }).catch(() => null),
      stayNo
        .first()
        .waitFor({ state: 'visible', timeout: 45_000 })
        .catch(() => null),
      page
        .waitForURL(/finance\.aceolution\.com/i, { timeout: 45_000 })
        .catch(() => null),
    ]);

    if (await stayNo.first().isVisible().catch(() => false)) {
      // Only click No if we are on KMSI and not MFA
      if (!(await mfaHeading.isVisible().catch(() => false))) {
        await stayNo.first().click();
      }
    }

    // Number-match MFA
    if (await mfaHeading.isVisible().catch(() => false)) {
      const bodyText = (await page.locator('body').innerText()).slice(0, 2000);
      const match = bodyText.match(/\b(\d{1,3})\b/);
      const number = match?.[1] || '(see Authenticator)';
      const note = [
        '=== Microsoft Authenticator number-match ===',
        `Approve this number in the Authenticator app: ${number}`,
        `Account: ${EMAIL}`,
        `Waiting up to ${Math.round(MFA_TIMEOUT_MS / 1000)}s…`,
        '===========================================',
      ].join('\n');
      console.log(`\n${note}\n`);
      const outDir = path.join(process.cwd(), 'test-results');
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'mfa-number.txt'), note, 'utf8');
    }

    // After MFA, Entra may show "Stay signed in?" before redirecting
    const deadline = Date.now() + MFA_TIMEOUT_MS;
    while (
      Date.now() < deadline &&
      !/finance\.aceolution\.com/i.test(page.url())
    ) {
      if (await stayNo.first().isVisible().catch(() => false)) {
        await stayNo.first().click();
        continue;
      }
      await page.waitForTimeout(500);
    }
    await expect(page).toHaveURL(/finance\.aceolution\.com/i, {
      timeout: Math.max(5_000, deadline - Date.now()),
    });

    // Choose Workspace (dual-store) → Live / Production
    const chooseWs = page.getByRole('heading', { name: /Choose Workspace/i });
    if (await chooseWs.isVisible({ timeout: 20_000 }).catch(() => false)) {
      const live = page
        .getByRole('button')
        .filter({ hasText: /Live company data/i })
        .first();
      await expect(live).toBeVisible({ timeout: 10_000 });
      await Promise.all([
        page.waitForResponse(
          (r) =>
            /\/auth\/select-workspace\/?$/i.test(r.url()) &&
            r.request().method() === 'POST',
          { timeout: 60_000 },
        ),
        live.click(),
      ]);
    }

    await expect(page).toHaveURL(/\/dashboard\/?/, { timeout: 90_000 });
    await expect(
      page.getByRole('heading', { name: /Dashboard/i }).first(),
    ).toBeVisible({ timeout: 30_000 });
  });
});
