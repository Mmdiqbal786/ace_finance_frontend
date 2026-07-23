/**
 * Refresh admin docs screenshots after admin email change.
 * node scripts/capture-docs-admin-email.cjs
 */
const { chromium } = require("playwright");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const BASE = process.env.FRONTEND_URL || "http://localhost:3000";
const backendEnvPath = path.join(__dirname, "..", "..", "ace_finance_backend", ".env");
const backendEnv = fs.existsSync(backendEnvPath)
  ? fs.readFileSync(backendEnvPath, "utf8")
  : "";
const backendJwtSecret = backendEnv.match(
  /^\s*JWT_SECRET\s*=\s*["']?([^"'\r\n]+)["']?\s*$/m
)?.[1];
const JWT_SECRET =
  process.env.JWT_SECRET ||
  backendJwtSecret ||
  "ace_finance_jwt_secret_2026_secure_key";
const OUT = path.join(__dirname, "..", "public", "docs-screenshots");

const admin = {
  id: "6a50db2fa55b28bc2cbeae9e",
  name: "Admin",
  email: "finance@aceolution.com",
  role: "ADMIN",
};

function b64url(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function mintToken(user, extra = {}) {
  const header = b64url({ alg: "HS256", typ: "JWT" });
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    mustChangePassword: false,
    mustSetupTotp: false,
    totpEnabled: false,
    iat: now,
    exp: now + 60 * 60 * 12,
    ...extra,
  });
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

async function injectAuth(page, user) {
  await page.goto(`${BASE}/login/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    localStorage.removeItem("ace_finance_token");
    localStorage.removeItem("ace_finance_user");
  });
  await page.evaluate(
    ([token, authUser]) => {
      localStorage.setItem("ace_finance_token", token);
      localStorage.setItem("ace_finance_user", JSON.stringify(authUser));
    },
    [mintToken(user), user]
  );
}

async function expandDashboardScroll(page) {
  await page.evaluate(() => {
    document.querySelectorAll(".portal-page, .overflow-y-auto, .overflow-auto").forEach((node) => {
      const el = node;
      el.style.overflow = "visible";
      el.style.maxHeight = "none";
      el.style.height = "auto";
    });
    document.documentElement.style.overflow = "visible";
    document.body.style.overflow = "visible";
  });
  await page.waitForTimeout(250);
}

async function capture(page, name, fullPage = true) {
  await page.waitForTimeout(700);
  await page.screenshot({
    path: path.join(OUT, `${name}.png`),
    fullPage,
  });
  console.log("saved", name);
}

async function openAndCapture(page, route, name) {
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" }).catch(async () => {
    await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
  });
  await page.getByText("finance@aceolution.com").first().waitFor({ timeout: 15000 }).catch(() => {});
  await expandDashboardScroll(page);
  await capture(page, name);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });

  await injectAuth(page, admin);
  await openAndCapture(page, "/dashboard/", "04-login-admin-dashboard");
  await openAndCapture(page, "/dashboard/", "04-login-admin-success-dashboard");
  await openAndCapture(page, "/dashboard/user-management/", "24-admin-users");
  await openAndCapture(page, "/dashboard/categories/", "25-admin-categories");
  await openAndCapture(page, "/dashboard/projects/", "26-admin-projects");
  await openAndCapture(page, "/dashboard/countries/", "27-admin-countries");

  await page.goto(`${BASE}/dashboard/user-management/`, { waitUntil: "networkidle" });
  const addUser = page.locator("button").filter({ hasText: /add new user|create user|\+ add/i }).first();
  if (await addUser.count()) {
    await addUser.click();
    await page.waitForTimeout(800);
    await capture(page, "44-admin-create-user-modal");
    await page.keyboard.press("Escape").catch(() => {});
  }

  await page.goto(`${BASE}/dashboard/categories/`, { waitUntil: "networkidle" });
  const addCat = page.locator("button").filter({ hasText: /add|create category/i }).first();
  if (await addCat.count()) {
    await addCat.click();
    await page.waitForTimeout(800);
    await capture(page, "45-admin-create-category-modal");
  }

  await browser.close();
  console.log("Admin docs screenshots updated with finance@aceolution.com");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
