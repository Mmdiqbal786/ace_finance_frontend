/**
 * Capture Admin Demo workspace shots: Users list + Demo Access toggle on create/edit.
 * Prerequisites: frontend :3000, backend :3001
 *   node scripts/capture-docs-demo-admin.cjs
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
const JWT_SECRET =
  process.env.JWT_SECRET ||
  backendEnv.match(/^\s*JWT_SECRET\s*=\s*["']?([^"'\r\n]+)["']?\s*$/m)?.[1] ||
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
    store: "demo",
    isDemo: true,
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

async function injectDemoAdmin(page) {
  const authUser = {
    ...admin,
    mustChangePassword: false,
    mustSetupTotp: false,
    totpEnabled: false,
    store: "demo",
    isDemo: true,
  };
  await page.goto(`${BASE}/login/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.removeItem("ace_finance_token");
    localStorage.removeItem("ace_finance_user");
  });
  await page.evaluate(
    ([token, user]) => {
      localStorage.setItem("ace_finance_token", token);
      localStorage.setItem("ace_finance_user", JSON.stringify(user));
    },
    [mintToken(admin), authUser]
  );
}

async function capture(page, name, fullPage = true) {
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage });
  console.log("saved", name);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

  try {
    await injectDemoAdmin(page);
    await page.goto(`${BASE}/dashboard/user-management/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await capture(page, "24-admin-users");
    await capture(page, "24b-admin-users-demo-access");

    // Create user modal with Demo Access checkbox
    const createBtn = page.getByRole("button", { name: /Add New User/i }).first();
    if (await createBtn.count()) {
      await createBtn.click();
      await page.waitForTimeout(800);
      const demoLabel = page.getByText(/Show on Demo Access login/i);
      if (await demoLabel.count()) {
        await demoLabel.first().scrollIntoViewIfNeeded().catch(() => {});
        await page.waitForTimeout(400);
      }
      await capture(page, "44-admin-create-user-modal");
      await capture(page, "44b-admin-create-user-demo-access", false);
      await page.keyboard.press("Escape").catch(() => {});
      await page.getByRole("button", { name: /Cancel/i }).first().click().catch(() => {});
      await page.waitForTimeout(400);
    } else {
      console.warn("Create user button not found");
    }

    // Edit first user if possible — Demo Access toggle
    const editBtn = page.locator("button").filter({ hasText: /^Edit$/i }).first();
    if (await editBtn.count()) {
      await editBtn.click();
      await page.waitForTimeout(800);
      const demoLabel = page.getByText(/Show on Demo Access login/i);
      if (await demoLabel.count()) {
        await demoLabel.first().scrollIntoViewIfNeeded().catch(() => {});
        await page.waitForTimeout(400);
        await capture(page, "44c-admin-edit-user-demo-access", false);
      }
      await page.getByRole("button", { name: /Cancel/i }).first().click().catch(() => {});
    }

    // Workspace badge on demo admin chrome
    await page.goto(`${BASE}/dashboard/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await capture(page, "04c-demo-workspace-badge", false);

    console.log("Demo admin screenshots done →", OUT);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
