/**
 * Capture authenticator / first-login docs screenshots only.
 *
 * Prerequisites: frontend :3000, backend :3001
 *   node scripts/capture-docs-auth.cjs
 */
const { chromium } = require("playwright");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const BASE = process.env.FRONTEND_URL || "http://localhost:3000";
const API = process.env.BACKEND_URL || "http://localhost:3001";
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

const users = {
  requester: {
    id: "6a586e564823fbb247dd65f2",
    name: "Iqbal Ahamed",
    email: "iqbal.ace786@gmail.com",
    role: "REQUESTER",
  },
  admin: {
    id: "6a50db2fa55b28bc2cbeae9e",
    name: "Admin",
    email: "finance@aceolution.com",
    role: "ADMIN",
  },
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
    totpEnabled: user.role === "ADMIN" ? false : true,
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

async function injectAuth(page, user, extra = {}) {
  const defaults =
    user.role === "ADMIN"
      ? { mustChangePassword: false, mustSetupTotp: false, totpEnabled: false }
      : { mustChangePassword: false, mustSetupTotp: false, totpEnabled: true };
  const authExtra = { ...defaults, ...extra };
  await page.goto(`${BASE}/login/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    localStorage.removeItem("ace_finance_token");
    localStorage.removeItem("ace_finance_user");
  });
  await page.evaluate(
    ([token, authUser]) => {
      localStorage.setItem("ace_finance_token", token);
      localStorage.setItem("ace_finance_user", JSON.stringify(authUser));
    },
    [mintToken(user, authExtra), { ...user, ...authExtra }]
  );
}

async function capture(page, name, fullPage = true) {
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(OUT, `${name}.png`),
    fullPage,
  });
  console.log("saved", name);
}

/** Dashboard scrolls inside .portal-page — expand it so fullPage captures authenticator. */
async function expandDashboardScroll(page) {
  await page.evaluate(() => {
    document.querySelectorAll(".portal-page, .overflow-y-auto, .overflow-auto").forEach((node) => {
      const el = node;
      el.style.overflow = "visible";
      el.style.maxHeight = "none";
      el.style.height = "auto";
    });
    const root = document.documentElement;
    const body = document.body;
    root.style.overflow = "visible";
    body.style.overflow = "visible";
    root.style.height = "auto";
    body.style.height = "auto";
  });
  await page.waitForTimeout(300);
}

async function captureAuthenticatorCard(page, name) {
  const card = page
    .locator("div.portal-card")
    .filter({ hasText: /Authenticator App/i })
    .first();
  await card.waitFor({ timeout: 15000 });
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await card.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log("saved", name, "(card)");
}

async function openAndCapture(page, route, name, fullPage = true) {
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" }).catch(async () => {
    await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
  });
  await capture(page, name, fullPage);
}

/** Demo QR so setup page works even when the DB user already has TOTP. */
async function mockTotpSetup(page) {
  const QRCode = require(path.join(
    __dirname,
    "..",
    "..",
    "ace_finance_backend",
    "node_modules",
    "qrcode"
  ));
  const secret = "DOCSDEMOSECRETKEY123456";
  const otpauthUrl = `otpauth://totp/Aceolution%20Finance:docs@aceolution.com?secret=${secret}&issuer=Aceolution%20Finance`;
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, { width: 220, margin: 2 });
  await page.route("**/auth/totp/setup", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        secret,
        otpauthUrl,
        qrCodeDataUrl,
        message: "Scan the QR code with your authenticator app, then enter a code to enable it.",
      }),
    });
  });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });

  // 0) Login verify — Email code + Authenticator tabs (mock so SMTP not required)
  await page.goto(`${BASE}/login/`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.route("**/auth/login", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        requires2fa: true,
        challengeToken: "docs-demo-challenge-token",
        methods: ["email", "totp"],
        emailHint: "iq******@gmail.com",
        message: "Enter the code from your email or authenticator app.",
      }),
    });
  });
  await page.fill("#login-email", "iqbal.ace786@gmail.com");
  await page.fill("#login-password", "AnyPass123");
  await page.click("#login-submit");
  await page.waitForSelector("#login-otp", { timeout: 15000 });
  await page.waitForTimeout(600);
  await capture(page, "05-login-otp-challenge");
  const authTab = page.locator("button").filter({ hasText: /^Authenticator$/i }).first();
  if (await authTab.count()) {
    await authTab.click();
    await page.waitForTimeout(500);
    await capture(page, "05c-login-authenticator-challenge");
  } else {
    console.warn("Authenticator tab missing on verify screen");
  }
  await page.unroute("**/auth/login").catch(() => {});

  // 1) First-login set password
  await injectAuth(page, users.requester, {
    mustChangePassword: true,
    mustSetupTotp: true,
    totpEnabled: false,
  });
  await openAndCapture(page, "/set-password/", "28-set-password-first-login");

  // 2) Required authenticator setup page with QR
  await mockTotpSetup(page);
  await injectAuth(page, users.requester, {
    mustChangePassword: false,
    mustSetupTotp: true,
    totpEnabled: false,
  });
  await page.goto(`${BASE}/setup-authenticator/`, { waitUntil: "networkidle" }).catch(async () => {
    await page.goto(`${BASE}/setup-authenticator/`, { waitUntil: "domcontentloaded" });
  });
  await page.waitForSelector("img[alt*='QR' i], img[alt*='Authenticator' i]", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await capture(page, "28c-setup-authenticator-required");
  await capture(page, "33-totp-setup-qr");
  await page.unroute("**/auth/totp/setup").catch(() => {});

  // 3) Profile with authenticator enabled + Change button
  await injectAuth(page, users.requester, {
    mustChangePassword: false,
    mustSetupTotp: false,
    totpEnabled: true,
  });
  await page.goto(`${BASE}/dashboard/profile/`, { waitUntil: "networkidle" });
  await page
    .locator("button")
    .filter({ hasText: /Change authenticator|Set up Authenticator/i })
    .first()
    .waitFor({ timeout: 20000 });
  await page.waitForTimeout(600);
  await expandDashboardScroll(page);
  await capture(page, "32-profile-full");
  await captureAuthenticatorCard(page, "32d-profile-authenticator-enabled");

  const editProfile = page.locator("button").filter({ hasText: /edit profile|edit name/i }).first();
  if (await editProfile.count()) {
    await editProfile.click();
    await page.waitForTimeout(700);
    await expandDashboardScroll(page);
    await capture(page, "32b-profile-edit-mode");
    const cancel = page.locator("button").filter({ hasText: /^cancel$/i }).first();
    if (await cancel.count()) await cancel.click().catch(() => {});
  }

  const changePw = page.locator("button").filter({ hasText: /update password/i }).first();
  if (await changePw.count()) {
    await changePw.click();
    await page.waitForTimeout(700);
    await expandDashboardScroll(page);
    await capture(page, "32c-password-validation-errors");
  }

  // 4) Change authenticator flow open
  await page.goto(`${BASE}/dashboard/profile/`, { waitUntil: "networkidle" });
  const changeTotp = page.locator("button").filter({ hasText: /change authenticator/i }).first();
  await changeTotp.waitFor({ timeout: 20000 });
  await changeTotp.click();
  await page.getByRole("button", { name: /Send email code/i }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(500);
  await expandDashboardScroll(page);
  await captureAuthenticatorCard(page, "34-totp-change-authenticator");
  await capture(page, "34b-totp-change-authenticator-page");

  // 5) Change-authenticator email preview (matches backend copy)
  await page.setContent(`<!DOCTYPE html>
<html><head><meta charset="utf-8"/><style>
  body{margin:0;font-family:Segoe UI,Arial,sans-serif;background:#e8edf4;padding:24px;}
  .wrap{max-width:560px;margin:0 auto;background:#fff;border:1px solid #cbd5e1;border-radius:16px;overflow:hidden;}
  .hdr{background:#203c62;color:#fff;padding:18px 20px;font-weight:700;}
  .body{padding:22px 20px;color:#0f172a;line-height:1.55;font-size:15px;}
  .code{font-size:28px;letter-spacing:6px;font-weight:700;color:#203c62;margin:20px 0;}
  .muted{font-size:13px;color:#64748b;}
</style></head><body>
  <div class="wrap">
    <div class="hdr">Aceolution Finance</div>
    <div class="body">
      <p><strong>Change authenticator app</strong></p>
      <p>Hello <strong>Iqbal Ahamed</strong>,</p>
      <p>Use this code to change your authenticator app. Confirming a new app will replace the old one:</p>
      <p class="code">482917</p>
      <p class="muted">This code expires in 10 minutes. If you did not request this, ignore this email.</p>
    </div>
  </div>
</body></html>`);
  await page.waitForTimeout(400);
  await capture(page, "email-requester-11-change-authenticator", false);

  await browser.close();
  console.log("Auth docs screenshots done →", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
