/**
 * Re-shoot processor docs screenshots as Alisha (after Priya rename).
 * node scripts/capture-docs-alisha-processor.cjs
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.FRONTEND_URL || "http://localhost:3000";
const API = process.env.BACKEND_URL || "http://localhost:3001";
const OUT = path.join(__dirname, "..", "public", "docs-screenshots");

async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  const token = data.access_token || data.accessToken || data.token;
  if (!token) throw new Error(`Login failed: ${JSON.stringify(data)}`);
  return { token, user: data.user };
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

async function shot(page, name, fullPage = true) {
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage });
  console.log("saved", name);
}

async function openRowMenu(page) {
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
  const item = page
    .locator("button, [role='menuitem']")
    .filter({ hasText: new RegExp(text, "i") })
    .first();
  if (await item.count()) {
    await item.click({ timeout: 4000 });
    return true;
  }
  return false;
}

async function closeModal(page) {
  await page.keyboard.press("Escape").catch(() => {});
  const cancel = page.locator("button").filter({ hasText: /cancel|close/i }).first();
  if (await cancel.count()) await cancel.click().catch(() => {});
  await page.waitForTimeout(300);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 920 },
    deviceScaleFactor: 1,
  });

  const { token, user } = await login(
    "alisha.processor@acefinance.com",
    "Processor@1234"
  );
  await injectAuth(page, token, user);

  await page.goto(`${BASE}/dashboard/profile/`, { waitUntil: "networkidle" }).catch(async () => {
    await page.goto(`${BASE}/dashboard/profile/`, { waitUntil: "domcontentloaded" });
  });
  await page.waitForTimeout(1000);
  await shot(page, "23-profile");
  await shot(page, "32e-profile-processor-access-scope");

  await page.goto(`${BASE}/dashboard/processor/`, { waitUntil: "networkidle" }).catch(async () => {
    await page.goto(`${BASE}/dashboard/processor/`, { waitUntil: "domcontentloaded" });
  });
  await page.waitForTimeout(1200);
  await shot(page, "16-processor-queue");

  await openRowMenu(page);
  await shot(page, "17-processor-actions-menu", false);
  await shot(page, "43-processor-menu-all-actions", false);

  await page.goto(`${BASE}/dashboard/processor/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await openRowMenu(page);
  if (await clickMenuItem(page, "Partial")) {
    await page.waitForTimeout(900);
    await shot(page, "18-processor-partial-pay-modal");
    await closeModal(page);
  }

  await page.goto(`${BASE}/dashboard/processor/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await openRowMenu(page);
  if (
    (await clickMenuItem(page, "Process")) ||
    (await clickMenuItem(page, "Mark Paid")) ||
    (await clickMenuItem(page, "Pay"))
  ) {
    await page.waitForTimeout(900);
    await shot(page, "19-processor-full-pay-modal");
    await closeModal(page);
  }

  await page.goto(`${BASE}/dashboard/processor/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await openRowMenu(page);
  if (await clickMenuItem(page, "Reject")) {
    await page.waitForTimeout(900);
    await shot(page, "20-processor-reject-modal");
    await closeModal(page);
  }

  await page.goto(`${BASE}/dashboard/processor/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await openRowMenu(page);
  if (await clickMenuItem(page, "Request Changes")) {
    await page.waitForTimeout(900);
    await shot(page, "21-processor-request-changes-modal");
    await closeModal(page);
  }

  await browser.close();
  console.log("Alisha processor docs screenshots done →", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
