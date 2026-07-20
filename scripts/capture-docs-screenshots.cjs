/**
 * Captures REAL screenshots from local Aceolution Finance (not AI).
 * node scripts/capture-docs-screenshots.cjs
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const BASE = "http://localhost:3000";
const API = "http://localhost:3001";
const JWT_SECRET =
  process.env.JWT_SECRET || "ace_finance_jwt_secret_2026_secure_key";
const OUT = path.join(__dirname, "..", "public", "docs-screenshots");

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

function mintToken(user) {
  const header = b64url({ alg: "HS256", typ: "JWT" });
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    mustChangePassword: false,
    iat: now,
    exp: now + 60 * 60 * 12,
  });
  const sig = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${sig}`;
}

async function loginApi(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return { ok: res.ok, status: res.status, data: await res.json() };
}

async function shot(page, name, fullPage = true) {
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage });
  console.log("saved", name);
}

async function injectAuth(page, token, user) {
  await page.goto(`${BASE}/login/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ([t, u]) => {
      localStorage.setItem("ace_finance_token", t);
      localStorage.setItem("ace_finance_user", JSON.stringify(u));
    },
    [token, user]
  );
}

async function clearAuth(page) {
  await page.goto(`${BASE}/login/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.removeItem("ace_finance_token");
    localStorage.removeItem("ace_finance_user");
  });
}

async function openRowMenu(page) {
  // Prefer kebab / more actions button in table
  const candidates = [
    page.locator("button[aria-label*='more' i]").first(),
    page.locator("button[aria-label*='actions' i]").first(),
    page.locator("table tbody tr").first().locator("button").last(),
  ];
  for (const c of candidates) {
    if (await c.count()) {
      await c.click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(400);
      return true;
    }
  }
  return false;
}

async function clickMenuItem(page, text) {
  const item = page.getByRole("button", { name: new RegExp(text, "i") }).first();
  if (await item.count()) {
    await item.click();
    return true;
  }
  const alt = page.locator("button, [role='menuitem']").filter({ hasText: new RegExp(text, "i") }).first();
  if (await alt.count()) {
    await alt.click();
    return true;
  }
  return false;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1360, height: 860 },
    deviceScaleFactor: 1,
  });

  const users = {
    admin: {
      id: "6a50db2fa55b28bc2cbeae9e",
      name: "Admin",
      email: "admin@acefinance.com",
      role: "ADMIN",
    },
    requester: {
      id: "6a586e564823fbb247dd65f2",
      name: "Iqbal Ahamed",
      email: "iqbal.ace786@gmail.com",
      role: "REQUESTER",
    },
    approver: {
      id: "6a58aed339ca89f548c578eb",
      name: "iqbal approver",
      email: "iqbal.dev98@gmail.com",
      role: "APPROVER",
    },
    processor: {
      id: "6a58af1639ca89f548c578ec",
      name: "Iqbal processor",
      email: "mmdiqbal786@gmail.com",
      role: "PROCESSOR",
    },
  };

  // ===== AUTH =====
  await clearAuth(page);
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await shot(page, "01-landing");

  await page.goto(`${BASE}/login/`, { waitUntil: "networkidle" });
  await shot(page, "02-login-password");

  await page.fill("#login-email", "admin@acefinance.com");
  await page.fill("#login-password", "WrongPass123");
  await page.click("#login-submit");
  await page.waitForTimeout(1500);
  await shot(page, "03-login-error-invalid", false);

  // Admin password-only success
  await page.goto(`${BASE}/login/`, { waitUntil: "networkidle" });
  await page.fill("#login-email", "admin@acefinance.com");
  await page.fill("#login-password", "Admin@1234");
  await page.click("#login-submit");
  await page.waitForURL(/\/dashboard/, { timeout: 25000 });
  await page.waitForTimeout(1000);
  await shot(page, "04-login-admin-dashboard");

  // Requester → OTP challenge (wait for OTP field)
  await clearAuth(page);
  await page.goto(`${BASE}/login/`, { waitUntil: "networkidle" });
  await page.fill("#login-email", "iqbal.ace786@gmail.com");
  await page.fill("#login-password", "Aceolution_2024");
  await page.click("#login-submit");
  try {
    await page.waitForSelector("#login-otp", { timeout: 45000 });
    await page.waitForTimeout(800);
    await shot(page, "05-login-otp-challenge");
  } catch {
    await shot(page, "05-login-otp-challenge");
  }

  // Wrong OTP error
  if (await page.locator("#login-otp").count()) {
    await page.fill("#login-otp", "000000");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1200);
    await shot(page, "05b-login-otp-error", false);
  }

  await page.goto(`${BASE}/forgot-password/`, { waitUntil: "networkidle" });
  await shot(page, "06-forgot-password");

  // ===== REQUESTER (minted JWT) =====
  await injectAuth(page, mintToken(users.requester), users.requester);
  await page.goto(`${BASE}/dashboard/`, { waitUntil: "networkidle" });
  await shot(page, "07-requester-dashboard");
  await page.goto(`${BASE}/dashboard/submit-expense/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await shot(page, "08-submit-expense");
  await page.goto(`${BASE}/dashboard/my-requests/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await shot(page, "09-my-requests");

  // ===== APPROVER =====
  await injectAuth(page, mintToken(users.approver), users.approver);
  await page.goto(`${BASE}/dashboard/approver/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await shot(page, "10-approver-queue");

  await openRowMenu(page);
  await shot(page, "11-approver-actions-menu", false);

  // View details
  await openRowMenu(page);
  if (await clickMenuItem(page, "View")) {
    await page.waitForTimeout(1200);
    await shot(page, "12-expense-details-view");
    await page.keyboard.press("Escape").catch(() => {});
    const close = page.locator("button").filter({ hasText: /close|cancel/i }).first();
    if (await close.count()) await close.click().catch(() => {});
    await page.waitForTimeout(400);
  }

  // Approve modal
  await page.goto(`${BASE}/dashboard/approver/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await openRowMenu(page);
  if (await clickMenuItem(page, "Approve")) {
    await page.waitForTimeout(1000);
    await shot(page, "13-approver-approve-modal");
    await page.keyboard.press("Escape").catch(() => {});
    const cancel = page.locator("button").filter({ hasText: /cancel/i }).first();
    if (await cancel.count()) await cancel.click().catch(() => {});
  }

  // Reject modal
  await page.goto(`${BASE}/dashboard/approver/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await openRowMenu(page);
  if (await clickMenuItem(page, "Reject")) {
    await page.waitForTimeout(1000);
    await shot(page, "14-approver-reject-modal");
    await page.keyboard.press("Escape").catch(() => {});
    const cancel = page.locator("button").filter({ hasText: /cancel/i }).first();
    if (await cancel.count()) await cancel.click().catch(() => {});
  }

  // Request changes modal
  await page.goto(`${BASE}/dashboard/approver/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await openRowMenu(page);
  if (await clickMenuItem(page, "Request Changes")) {
    await page.waitForTimeout(1000);
    await shot(page, "15-approver-request-changes-modal");
    await page.keyboard.press("Escape").catch(() => {});
    const cancel = page.locator("button").filter({ hasText: /cancel/i }).first();
    if (await cancel.count()) await cancel.click().catch(() => {});
  }

  // ===== PROCESSOR =====
  await injectAuth(page, mintToken(users.processor), users.processor);
  await page.goto(`${BASE}/dashboard/processor/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await shot(page, "16-processor-queue");

  await openRowMenu(page);
  await shot(page, "17-processor-actions-menu", false);

  await page.goto(`${BASE}/dashboard/processor/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await openRowMenu(page);
  if (await clickMenuItem(page, "Partial")) {
    await page.waitForTimeout(1000);
    await shot(page, "18-processor-partial-pay-modal");
    await page.keyboard.press("Escape").catch(() => {});
    const cancel = page.locator("button").filter({ hasText: /cancel/i }).first();
    if (await cancel.count()) await cancel.click().catch(() => {});
  }

  await page.goto(`${BASE}/dashboard/processor/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await openRowMenu(page);
  if (
    (await clickMenuItem(page, "Process")) ||
    (await clickMenuItem(page, "Mark Paid")) ||
    (await clickMenuItem(page, "Pay"))
  ) {
    await page.waitForTimeout(1000);
    await shot(page, "19-processor-full-pay-modal");
    await page.keyboard.press("Escape").catch(() => {});
    const cancel = page.locator("button").filter({ hasText: /cancel/i }).first();
    if (await cancel.count()) await cancel.click().catch(() => {});
  }

  await page.goto(`${BASE}/dashboard/processor/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await openRowMenu(page);
  if (await clickMenuItem(page, "Reject")) {
    await page.waitForTimeout(1000);
    await shot(page, "20-processor-reject-modal");
    await page.keyboard.press("Escape").catch(() => {});
    const cancel = page.locator("button").filter({ hasText: /cancel/i }).first();
    if (await cancel.count()) await cancel.click().catch(() => {});
  }

  await page.goto(`${BASE}/dashboard/processor/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await openRowMenu(page);
  if (await clickMenuItem(page, "Request Changes")) {
    await page.waitForTimeout(1000);
    await shot(page, "21-processor-request-changes-modal");
    await page.keyboard.press("Escape").catch(() => {});
  }

  await page.goto(`${BASE}/dashboard/analytics/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await shot(page, "22-analytics");

  await page.goto(`${BASE}/dashboard/profile/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await shot(page, "23-profile");

  // ===== ADMIN catalogs =====
  await injectAuth(page, mintToken(users.admin), users.admin);
  for (const [name, route] of [
    ["24-admin-users", "/dashboard/user-management/"],
    ["25-admin-categories", "/dashboard/categories/"],
    ["26-admin-projects", "/dashboard/projects/"],
    ["27-admin-countries", "/dashboard/countries/"],
  ]) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await shot(page, name);
  }

  await browser.close();
  console.log("Done →", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
