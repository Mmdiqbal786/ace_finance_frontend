/**
 * Capture Microsoft-first login screenshots for /docs-guide/.
 *
 * Prerequisites: frontend :3000, backend :3001
 *   node scripts/capture-docs-login-v2.cjs
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.FRONTEND_URL || "http://localhost:3000";
const OUT = path.join(__dirname, "..", "public", "docs-screenshots");

async function capture(page, name, fullPage = true) {
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(OUT, `${name}.png`),
    fullPage,
  });
  console.log("saved", name);
}

async function gotoLogin(page) {
  await page.goto(`${BASE}/login/`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto(`${BASE}/login/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
}

async function openPasswordForm(page) {
  await page.getByRole("button", { name: /Use password instead/i }).click();
  await page.waitForSelector("#login-email", { timeout: 10000 });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 960 },
  });

  try {
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await capture(page, "01-landing");

    // Microsoft-first home
    await gotoLogin(page);
    await page.getByRole("button", { name: /Demo Access/i }).waitFor({ timeout: 15000 });
    await capture(page, "02-login-home");

    // Demo Access list
    await page.getByRole("button", { name: /Demo Access/i }).click();
    await page.waitForTimeout(1500);
    await capture(page, "02b-login-demo-access");
    await page.getByRole("button", { name: /← Back|Back/i }).first().click();
    await page.waitForTimeout(400);

    // Password form
    await openPasswordForm(page);
    await capture(page, "02-login-password");

    // Invalid password error
    await page.fill("#login-email", "finance@aceolution.com");
    await page.fill("#login-password", "WrongPass123");
    await page.click("#login-submit");
    await page.waitForTimeout(1500);
    await capture(page, "03-login-error-invalid", false);

    // Admin password → workspace picker (or dashboard)
    await gotoLogin(page);
    await openPasswordForm(page);
    await page.fill("#login-email", "finance@aceolution.com");
    await page.fill("#login-password", "Admin@1234");
    await page.click("#login-submit");
    await page.waitForTimeout(2500);
    const workspaceVisible = await page
      .locator("text=/Choose|workspace|Live|Demo/i")
      .first()
      .isVisible()
      .catch(() => false);
    if (workspaceVisible && (await page.locator("button").filter({ hasText: /Live|Demo/i }).count()) > 0) {
      await capture(page, "02c-login-workspace");
      // Prefer Live for admin dashboard shot
      const liveBtn = page.locator("button").filter({ hasText: /Live/i }).first();
      if (await liveBtn.count()) {
        await liveBtn.click();
      } else {
        await page.locator("button").filter({ hasText: /Demo/i }).first().click();
      }
    }
    await page.waitForURL(/\/dashboard/, { timeout: 30000 });
    await page.waitForTimeout(1200);
    await capture(page, "04-login-admin-dashboard");
    // Live/Demo badge in chrome
    await capture(page, "04b-login-workspace-badge", false);

    // Requester OTP challenge via password path
    await gotoLogin(page);
    await openPasswordForm(page);
    await page.fill("#login-email", "iqbal.ace786@gmail.com");
    await page.fill("#login-password", "Aceolution_2024");
    await page.click("#login-submit");
    try {
      await page.waitForSelector("#login-otp, #login-totp, text=/Authenticator|Email code|Verify/i", {
        timeout: 45000,
      });
    } catch {
      /* continue */
    }
    await page.waitForTimeout(1000);
    await capture(page, "05-login-otp-challenge");
    if (await page.locator("#login-otp").count()) {
      await page.fill("#login-otp", "000000");
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1200);
      await capture(page, "05b-login-otp-error", false);
    }

    // Authenticator challenge if switch exists
    const authTab = page.getByRole("button", { name: /Authenticator/i });
    if (await authTab.count()) {
      await authTab.first().click();
      await page.waitForTimeout(600);
      await capture(page, "05c-login-authenticator-challenge");
    }

    await page.goto(`${BASE}/forgot-password/`, { waitUntil: "networkidle" });
    await capture(page, "06-forgot-password");

    console.log("Login v2 screenshots done →", OUT);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
