/**
 * Refresh key docs-guide screenshots from LIVE SWA (real UI, not AI).
 *
 *   set DEMO_ACCESS_CODE=Aceolution_2024
 *   node scripts/capture-docs-screenshots-live.cjs
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE_URL || 'https://finance.aceolution.com';
const API =
  process.env.API_URL ||
  'https://ace-finance-api-f5hnhhd6c3bvffhj.southindia-01.azurewebsites.net';
const CODE = (process.env.DEMO_ACCESS_CODE || 'Aceolution_2024').trim();
const OUT = path.join(__dirname, '..', 'public', 'docs-screenshots');

async function shot(page, name, fullPage = true) {
  await page.waitForTimeout(600);
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage });
  console.log('saved', name, fs.statSync(file).size, 'bytes');
}

async function demoLogin(page, nameHint, password) {
  await page.goto(`${BASE}/login/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Demo Access' }).click();
  const gate = page.locator('#demo-gate-code');
  if (await gate.isVisible().catch(() => false)) {
    await gate.fill(CODE);
    await page.getByRole('button', { name: 'Unlock Demo Access' }).click();
  }
  await page
    .getByRole('button', { name: new RegExp(nameHint, 'i') })
    .first()
    .click({ timeout: 30000 });
  await page.locator('#demo-persona-password').fill(password);
  await page.getByRole('button', { name: 'Sign in →' }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 45000 });
}

async function adminChooseWorkspace(page) {
  await page.goto(`${BASE}/login/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Use password instead' }).click();
  await page.locator('#login-email').fill('finance@aceolution.com');
  await page.locator('#login-password').fill('Admin@1234');
  await page.locator('#login-submit').click();
  await page.getByRole('heading', { name: /Choose Workspace/i }).waitFor({
    timeout: 30000,
  });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });

  // Login home
  await page.goto(`${BASE}/login/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
  });
  await page.reload({ waitUntil: 'networkidle' });
  await shot(page, '02-login-home', false);

  // Demo Access list
  await page.getByRole('button', { name: 'Demo Access' }).click();
  const gate = page.locator('#demo-gate-code');
  if (await gate.isVisible().catch(() => false)) {
    await gate.fill(CODE);
    await page.getByRole('button', { name: 'Unlock Demo Access' }).click();
  }
  await page
    .getByRole('button', { name: /Requester GAC/i })
    .first()
    .waitFor({ timeout: 30000 });
  await shot(page, '02b-login-demo-access', false);

  // Password form
  await page.goto(`${BASE}/login/`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Use password instead' }).click();
  await shot(page, '02-login-password', false);

  // Admin workspace picker
  await adminChooseWorkspace(page);
  await shot(page, '02c-login-workspace', false);
  await page
    .getByRole('button', { name: /Sandbox|Demo/i })
    .first()
    .click();
  await page.waitForURL(/\/dashboard/, { timeout: 45000 });
  await shot(page, '04-login-admin-dashboard', true);
  await shot(page, '04c-demo-workspace-badge', false);

  // Requester dashboard + submit + my requests
  await demoLogin(page, 'Requester GAC', 'Requester@1234');
  await shot(page, '07-requester-dashboard', true);
  await shot(page, '04b-login-workspace-badge', false);

  await page.goto(`${BASE}/dashboard/submit-expense/`, {
    waitUntil: 'networkidle',
  });
  await shot(page, '08-submit-expense', true);

  await page.goto(`${BASE}/dashboard/my-requests/`, {
    waitUntil: 'networkidle',
  });
  await shot(page, '09-my-requests', true);

  await page.goto(`${BASE}/login/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
  });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await shot(page, '01-landing', false);

  await browser.close();
  console.log('Done. Output:', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
