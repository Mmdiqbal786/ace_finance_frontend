/**
 * Re-shoot screenshots for recent UI updates (Submit side panel, Profile projects).
 * Requires local frontend :3000 + backend :3001.
 *
 * node scripts/capture-docs-updated-ui.cjs
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.FRONTEND_URL || "http://localhost:3000";
const API = process.env.BACKEND_URL || "http://localhost:3001";
const OUT = path.join(__dirname, "..", "public", "docs-screenshots");

const ACCOUNTS = {
  requesterOps: {
    email: "requester.ops@acefinance.com",
    password: "Requester@1234",
  },
  processor: {
    email: "alisha.processor@acefinance.com",
    password: "Processor@1234",
  },
  admin: {
    email: "finance@aceolution.com",
    password: "Admin@1234",
  },
};

async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(data)}`);
  }
  const token = data.access_token || data.accessToken || data.token;
  if (!token) {
    throw new Error(
      `No token for ${email} (2FA challenge?). Use password-only demo accounts. Response keys: ${Object.keys(data).join(",")}`
    );
  }
  const user = data.user || {
    id: data.userId || data.sub,
    name: data.name,
    email,
    role: data.role,
  };
  return { token, user };
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
  await page.screenshot({
    path: path.join(OUT, `${name}.png`),
    fullPage,
  });
  console.log("saved", name);
}

async function goto(page, route) {
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" }).catch(async () => {
    await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
  });
  await page.waitForTimeout(600);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 920 },
    deviceScaleFactor: 1,
  });

  // --- Requester Ops: dashboard, submit (side panel), profile projects, edit ---
  const requester = await login(ACCOUNTS.requesterOps.email, ACCOUNTS.requesterOps.password);
  await injectAuth(page, requester.token, requester.user);

  await goto(page, "/dashboard/");
  await shot(page, "07-requester-dashboard");

  await goto(page, "/dashboard/submit-expense/");
  await shot(page, "08-submit-expense");

  await goto(page, "/dashboard/my-requests/");
  await shot(page, "09-my-requests");

  await goto(page, "/dashboard/profile/");
  await shot(page, "32-profile-full");

  const editBtn = page.locator("button").filter({ hasText: /edit profile/i }).first();
  if (await editBtn.count()) {
    await editBtn.click();
    await page.waitForTimeout(700);
    await shot(page, "32b-profile-edit-mode");
    const cancel = page.locator("button").filter({ hasText: /^cancel$/i }).first();
    if (await cancel.count()) await cancel.click().catch(() => {});
  }

  // --- Processor: Access Scope on profile ---
  const processor = await login(ACCOUNTS.processor.email, ACCOUNTS.processor.password);
  await injectAuth(page, processor.token, processor.user);
  await goto(page, "/dashboard/profile/");
  await shot(page, "23-profile");
  await shot(page, "32e-profile-processor-access-scope");

  await goto(page, "/dashboard/processor/");
  await shot(page, "16-processor-queue");

  // --- Admin: Access Scope + users (icons) ---
  const admin = await login(ACCOUNTS.admin.email, ACCOUNTS.admin.password);
  await injectAuth(page, admin.token, admin.user);
  await goto(page, "/dashboard/");
  await shot(page, "04-login-admin-dashboard");

  await goto(page, "/dashboard/profile/");
  await shot(page, "32f-profile-admin-access-scope");

  await goto(page, "/dashboard/user-management/");
  await shot(page, "24-admin-users");

  await browser.close();
  console.log("Updated UI screenshots done →", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
