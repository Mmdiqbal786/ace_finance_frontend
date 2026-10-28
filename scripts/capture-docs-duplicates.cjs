/**
 * Capture duplicate-detection docs screenshots (hard block toast + potential modal).
 * Uses mocked API responses so no real double-submit is required.
 *
 *   node scripts/capture-docs-duplicates.cjs
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

const requester = {
  id: "6a586e564823fbb247dd65f2",
  name: "Iqbal Ahamed",
  email: "iqbal.ace786@gmail.com",
  role: "REQUESTER",
  assignedProjects: ["Google Art and culture (GAC)", "Google News Lab (GNL)"],
};

function b64url(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function mintToken(user) {
  const header = b64url({ alg: "HS256", typ: "JWT" });
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    assignedProjects: user.assignedProjects || [],
    mustChangePassword: false,
    mustSetupTotp: false,
    totpEnabled: true,
    store: "live",
    iat: now,
    exp: now + 60 * 60 * 12,
  });
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

async function injectAuth(page) {
  const authUser = {
    ...requester,
    mustChangePassword: false,
    mustSetupTotp: false,
    totpEnabled: true,
    store: "live",
  };
  await page.goto(`${BASE}/login/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ([token, user]) => {
      localStorage.setItem("ace_finance_token", token);
      localStorage.setItem("ace_finance_user", JSON.stringify(user));
    },
    [mintToken(requester), authUser]
  );
}

async function capture(page, name, fullPage = false) {
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage });
  console.log("saved", name);
}

async function fillMinimalSubmit(page) {
  // Best-effort fill — fields vary; mocks fire on submit POST
  const selects = page.locator("select");
  const count = await selects.count();
  for (let i = 0; i < Math.min(count, 4); i++) {
    const opt = selects.nth(i).locator("option").nth(1);
    if (await opt.count()) {
      const val = await opt.getAttribute("value");
      if (val) await selects.nth(i).selectOption(val).catch(() => {});
    }
  }
  await page.locator('input[type="number"], input[name*="amount" i]').first().fill("12.34").catch(() => {});
  await page.locator("textarea").first().fill("Docs duplicate capture").catch(() => {});
  const inv = page.locator("#invoiceNumber, input[name*='invoice' i]").first();
  if (await inv.count()) await inv.fill("INV-DOCS-DUP-001").catch(() => {});
  // tiny png
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );
  const fileInput = page.locator('input[type="file"]').first();
  if (await fileInput.count()) {
    await fileInput.setInputFiles({
      name: "invoice-dup.png",
      mimeType: "image/png",
      buffer: png,
    });
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

  try {
    await injectAuth(page);
    await page.goto(`${BASE}/dashboard/submit-expense/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await fillMinimalSubmit(page);

    // Hard duplicate on expenses POST
    await page.route("**/expenses**", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          message:
            "Duplicate invoice file detected: This exact invoice document was already submitted in request EXP-1001 (Google Art and culture (GAC)) by Iqbal Ahamed on 10/28/2026.",
          statusCode: 400,
        }),
      });
    });

    const submitBtn = page.getByRole("button", { name: /Submit Expense/i }).first();
    if (await submitBtn.count()) {
      await submitBtn.click();
      await page.waitForTimeout(800);
      const confirm = page.getByRole("button", { name: /Confirm/i }).first();
      if (await confirm.count()) await confirm.click();
      await page.waitForTimeout(1500);
    }
    await capture(page, "08d-submit-hard-duplicate", true);
    await page.unroute("**/expenses**").catch(() => {});

    // Potential duplicate modal — reopen submit and mock POTENTIAL_DUPLICATE style response if API wraps it
    await page.goto(`${BASE}/dashboard/submit-expense/`, { waitUntil: "networkidle" });
    await fillMinimalSubmit(page);
    await page.route("**/expenses**", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          message:
            "POTENTIAL_DUPLICATE: An expense of USD12.34 under category \"Meals\" was already submitted for \"Google Art and culture (GAC)\" on 2026-10-27 by Iqbal Ahamed (Request EXP-1002).",
          statusCode: 400,
        }),
      });
    });
    if (await submitBtn.count()) {
      await page.getByRole("button", { name: /Submit Expense/i }).first().click();
      await page.waitForTimeout(600);
      const confirm = page.getByRole("button", { name: /Confirm/i }).first();
      if (await confirm.count()) await confirm.click();
      await page.waitForTimeout(1200);
    }
    // Modal title
    await page.getByText(/Potential Duplicate/i).first().waitFor({ timeout: 8000 }).catch(() => {});
    await capture(page, "08e-submit-potential-duplicate", true);

    console.log("Duplicate screenshots done →", OUT);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
