/**
 * Capture submit/edit confirmation + attachment preview screenshots for docs-guide.
 * Requires frontend on :3000 and backend on :3001 with seeded demo users.
 *
 *   node scripts/capture-docs-confirm-preview.cjs
 */
const { chromium } = require("playwright");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "public", "docs-screenshots");
const FIXTURES = path.join(__dirname, "fixtures");
const BASE = process.env.DOCS_BASE || "http://localhost:3000";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const JWT = process.env.JWT_SECRET || "ace_finance_jwt_secret_2026_secure_key";

function mint(u, extra = {}) {
  const h = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const p = Buffer.from(
    JSON.stringify({
      sub: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      mustChangePassword: false,
      mustSetupTotp: false,
      totpEnabled: false,
      isDemo: true,
      assignedProjects: u.assignedProjects || [],
      iat: now,
      exp: now + 3600,
      ...extra,
    })
  ).toString("base64url");
  const s = crypto.createHmac("sha256", JWT).update(`${h}.${p}`).digest("base64url");
  return `${h}.${p}.${s}`;
}

function ensureSamplePdf() {
  fs.mkdirSync(FIXTURES, { recursive: true });
  const pdfPath = path.join(FIXTURES, "sample-invoice.pdf");
  // Minimal valid PDF
  const pdf =
    "%PDF-1.1\n" +
    "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n" +
    "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n" +
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n" +
    "4 0 obj<< /Length 44 >>stream\nBT /F1 18 Tf 40 100 Td (Sample Invoice) Tj ET\nendstream\nendobj\n" +
    "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n" +
    "xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000266 00000 n \n0000000361 00000 n \n" +
    "trailer<< /Size 6 /Root 1 0 R >>\nstartxref\n441\n%%EOF\n";
  fs.writeFileSync(pdfPath, pdf);
  return pdfPath;
}

async function loginDemo(page, email, password) {
  await page.goto(`${BASE}/login/`, { waitUntil: "domcontentloaded" });
  await page.fill("#login-email, input[type='email']", email);
  await page.fill("#login-password, input[type='password']", password);
  await page.locator("button").filter({ hasText: /Continue|Sign In|Log In/i }).first().click();
  await page.waitForTimeout(2000);
  // Demo accounts skip 2FA — should land on dashboard
  if (page.url().includes("setup-authenticator") || page.url().includes("login")) {
    throw new Error(`Login did not reach dashboard for ${email}. URL=${page.url()}`);
  }
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const pdfPath = ensureSamplePdf();

  // Resolve demo requester id from API login
  const loginRes = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "requester.gac@acefinance.com",
      password: "Requester@1234",
    }),
  });
  if (!loginRes.ok) {
    throw new Error(`API login failed: ${loginRes.status} ${await loginRes.text()}`);
  }
  const loginData = await loginRes.json();
  const user = {
    id: loginData.user.id,
    name: loginData.user.name,
    email: loginData.user.email,
    role: loginData.user.role,
    assignedProjects: loginData.user.assignedProjects || [],
    mustSetupTotp: false,
    totpEnabled: false,
    isDemo: true,
  };

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });

  async function shot(name, fullPage = true) {
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage });
    console.log("saved", name);
  }

  async function authInject() {
    await page.goto(`${BASE}/login/`, { waitUntil: "domcontentloaded" });
    await page.evaluate(
      ([t, u]) => {
        localStorage.setItem("ace_finance_token", t);
        localStorage.setItem("ace_finance_user", JSON.stringify(u));
      },
      [loginData.access_token || mint(user), user]
    );
  }

  // —— Submit form + attachment preview + confirm ——
  await authInject();
  await page.goto(`${BASE}/dashboard/submit-expense/`, { waitUntil: "networkidle" }).catch(async () => {
    await page.goto(`${BASE}/dashboard/submit-expense/`, { waitUntil: "domcontentloaded" });
  });
  await page.waitForTimeout(1500);

  // Fill selects if present
  const country = page.locator("select").filter({ has: page.locator("option") }).nth(0);
  if (await country.count()) {
    const opts = await country.locator("option").allTextContents();
    const pick = opts.find((o) => /aruba|united|india|singapore/i.test(o)) || opts[1];
    if (pick) await country.selectOption({ label: pick.trim() }).catch(() => {});
  }
  // Project / category — pick first real option
  const selects = page.locator("select");
  const selCount = await selects.count();
  for (let i = 0; i < selCount; i++) {
    const s = selects.nth(i);
    const options = await s.locator("option").allTextContents();
    const real = options.find((o) => o && !/select/i.test(o));
    if (real) await s.selectOption({ label: real.trim() }).catch(() => {});
  }

  const amount = page.locator("input").filter({ has: page.locator("xpath=.") });
  // Amount field — look by label proximity via input near Amount
  const amountInput = page.locator("input[type='number'], input").filter({ hasNot: page.locator("[type='file']") });
  // Simpler: fill by placeholder or last numeric-looking
  await page.locator("textarea").first().fill("Docs guide sample description for confirm preview.");
  const due = page.locator("input[type='date']").last();
  if (await due.count()) {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const iso = d.toISOString().slice(0, 10);
    await due.fill(iso).catch(() => {});
  }
  // Amount
  const allInputs = page.locator("form input:not([type='file']):not([type='date']):not([type='email']):not([disabled])");
  const n = await allInputs.count();
  for (let i = 0; i < n; i++) {
    const el = allInputs.nth(i);
    const ph = ((await el.getAttribute("placeholder")) || "").toLowerCase();
    const val = await el.inputValue().catch(() => "");
    if (!val || ph.includes("0") || ph.includes("amount")) {
      const type = await el.getAttribute("type");
      if (type !== "checkbox" && type !== "radio") {
        // try amount-like empty fields near end
      }
    }
  }
  // Explicit amount: find input after Amount label
  const amountByLabel = page.getByLabel(/Amount/i);
  if (await amountByLabel.count()) {
    await amountByLabel.fill("1500");
  } else {
    // fallback last text-like input in form
    const candidates = page.locator("form input.af-input, form input");
    const c = await candidates.count();
    if (c > 0) await candidates.nth(Math.min(c - 1, 8)).fill("1500").catch(() => {});
  }

  await page.locator("input[type='file']").first().setInputFiles(pdfPath);
  await page.waitForTimeout(1200);
  await shot("08-submit-expense");
  await shot("08b-submit-attachment-preview");

  await page.locator("button").filter({ hasText: /Submit Expense Request/i }).first().click();
  await page.waitForTimeout(1200);
  // Confirm modal
  const confirmTitle = page.locator("text=Confirm submission");
  if (await confirmTitle.count()) {
    await shot("08c-submit-confirm-modal", false);
    await page.locator("button").filter({ hasText: /^Cancel$/i }).first().click();
    await page.waitForTimeout(400);
  } else {
    console.warn("Confirm submission modal not found — validation may have blocked submit");
    await shot("08c-submit-confirm-modal", false);
  }

  // —— Edit modal: find Changes Requested or force via API if possible ——
  await page.goto(`${BASE}/dashboard/my-requests/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const rows = page.locator("table tbody tr");
  const count = await rows.count();
  let openedEdit = false;
  for (let i = 0; i < count; i++) {
    const text = await rows.nth(i).innerText();
    if (/Changes Requested/i.test(text)) {
      // Prefer accessible label; menu opens in a portal with role=menuitem
      const actions = rows.nth(i).getByLabel("Row actions");
      if (await actions.count()) await actions.click();
      else await rows.nth(i).locator("button").last().click();
      await page.waitForTimeout(500);
      const edit = page.locator("[role='menuitem']").filter({ hasText: /Edit/i }).first();
      if (await edit.count()) {
        await edit.click();
        await page.waitForTimeout(1200);
        openedEdit = true;
      } else {
        console.warn("Edit menuitem not found after opening row actions");
      }
      break;
    }
  }

  if (openedEdit) {
    await shot("31-edit-resubmit-modal");
    const replace = page.locator("#edit-replace-invoice, input[type='file']").last();
    if (await replace.count()) {
      await replace.setInputFiles(pdfPath);
      await page.waitForTimeout(1000);
      await shot("31b-edit-replace-preview");
    }
    await page.locator("button").filter({ hasText: /Save Changes/i }).first().click();
    await page.waitForTimeout(1000);
    if (await page.locator("text=Confirm changes").count()) {
      await shot("31c-edit-confirm-modal", false);
    } else {
      await shot("31c-edit-confirm-modal", false);
    }
  } else {
    console.warn("No Changes Requested row — skipping edit screenshots (keep previous images if any)");
  }

  await browser.close();
  console.log("done");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
