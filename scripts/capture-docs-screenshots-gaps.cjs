/**
 * Gap-fill screenshots — real UI only.
 * node scripts/capture-docs-screenshots-gaps.cjs
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const BASE = "http://localhost:3000";
const API = "http://localhost:3001";
const JWT_SECRET = process.env.JWT_SECRET || "ace_finance_jwt_secret_2026_secure_key";
const OUT = path.join(__dirname, "..", "public", "docs-screenshots");

const users = {
  admin: {
    id: "6a50db2fa55b28bc2cbeae9e",
    name: "Admin",
    email: "finance@aceolution.com",
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

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
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
    iat: now,
    exp: now + 60 * 60 * 12,
    ...extra,
  });
  const sig = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${sig}`;
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

async function api(method, urlPath, token, body) {
  const res = await fetch(`${API}${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}

async function openRowMenu(page) {
  const rowBtn = page.locator("table tbody tr").first().locator("button").last();
  if (await rowBtn.count()) {
    await rowBtn.click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(400);
    return true;
  }
  return false;
}

async function clickMenuItem(page, text) {
  const item = page.locator("button, [role='menuitem'], a").filter({ hasText: new RegExp(`^\\s*${text}`, "i") }).first();
  if (await item.count()) {
    await item.click({ timeout: 4000 });
    return true;
  }
  const loose = page.locator("button, [role='menuitem']").filter({ hasText: new RegExp(text, "i") }).first();
  if (await loose.count()) {
    await loose.click({ timeout: 4000 });
    return true;
  }
  return false;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1360, height: 900 },
    deviceScaleFactor: 1,
  });

  // ===== Set password (first login) =====
  const setPwUser = { ...users.admin, mustChangePassword: true };
  const setPwToken = mintToken(users.admin, { mustChangePassword: true });
  await injectAuth(page, setPwToken, setPwUser);
  await page.goto(`${BASE}/set-password/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await shot(page, "28-set-password-first-login");

  // ===== Reset password invalid token =====
  await page.goto(`${BASE}/reset-password/?token=invalid-demo-token`, {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(1000);
  await shot(page, "29-reset-password-invalid");

  // ===== Reset password valid form (create token via forgot if backend stores it — try admin login forgot won't give token)
  // Capture page shell without token query too
  await page.goto(`${BASE}/reset-password/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await shot(page, "29b-reset-password-missing-token");

  // ===== Force CHANGES_REQUESTED then Edit UI =====
  const approverToken = mintToken(users.approver);
  const list = await api("GET", "/expenses", approverToken);
  const expenses = Array.isArray(list.data) ? list.data : list.data?.data || list.data?.items || [];
  console.log("expenses count", Array.isArray(expenses) ? expenses.length : typeof expenses);

  let pending = null;
  if (Array.isArray(expenses)) {
    pending =
      expenses.find((e) => e.status === "PENDING_APPROVER") ||
      expenses.find((e) => e.status === "CHANGES_REQUESTED") ||
      expenses[0];
  }

  if (pending && pending.status === "PENDING_APPROVER") {
    const rc = await api("PATCH", `/expenses/${pending.id || pending._id}/request-changes`, approverToken, {
      notes: "Please update description for documentation screenshot",
      target: "requester",
    });
    console.log("request-changes", rc.status, rc.ok);
    pending = rc.data || pending;
  }

  // Approver queue showing Changes Requested elsewhere; capture requester edit
  const requesterToken = mintToken(users.requester);
  await injectAuth(page, requesterToken, users.requester);
  await page.goto(`${BASE}/dashboard/my-requests/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await shot(page, "30-my-requests-with-changes");

  // Click Edit if visible
  const editBtn = page.locator("button, a").filter({ hasText: /^Edit$/i }).first();
  if (await editBtn.count()) {
    await editBtn.click();
    await page.waitForTimeout(1200);
    await shot(page, "31-edit-resubmit-modal");
    await page.keyboard.press("Escape").catch(() => {});
    const cancel = page.locator("button").filter({ hasText: /cancel/i }).first();
    if (await cancel.count()) await cancel.click().catch(() => {});
  } else {
    // try row menu Edit
    await openRowMenu(page);
    if (await clickMenuItem(page, "Edit")) {
      await page.waitForTimeout(1200);
      await shot(page, "31-edit-resubmit-modal");
      await page.keyboard.press("Escape").catch(() => {});
    }
  }

  // ===== Profile TOTP setup QR =====
  await injectAuth(page, mintToken(users.requester), users.requester);
  await page.goto(`${BASE}/dashboard/profile/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await shot(page, "32-profile-full");

  const setupBtn = page.locator("button").filter({ hasText: /Set up Authenticator/i }).first();
  if (await setupBtn.count()) {
    await setupBtn.click();
    await page.waitForTimeout(1500);
    await shot(page, "33-totp-setup-qr");
  }

  // Disable UI if already enabled — otherwise show password field path after enabling is hard
  // Capture disable section if visible
  const disableLabel = page.locator("text=Authenticator is enabled").first();
  if (await disableLabel.count()) {
    await shot(page, "34-totp-disable-section");
  }

  // ===== Expense View details (approver) =====
  await injectAuth(page, mintToken(users.approver), users.approver);
  await page.goto(`${BASE}/dashboard/approver/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  // Also try analytics for any expense view
  await openRowMenu(page);
  if (await clickMenuItem(page, "View")) {
    await page.waitForTimeout(1400);
    await shot(page, "35-expense-details-audit");
    // scroll modal if needed
    const modal = page.locator("[role='dialog'], .fixed, .modal").first();
    if (await modal.count()) {
      await modal.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      }).catch(() => {});
      await page.waitForTimeout(400);
      await shot(page, "35b-expense-details-audit-bottom", false);
    }
    await page.keyboard.press("Escape").catch(() => {});
    const close = page.locator("button").filter({ hasText: /close|cancel/i }).first();
    if (await close.count()) await close.click().catch(() => {});
  }

  // Approve modal with notes field visible
  await page.goto(`${BASE}/dashboard/approver/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  // If queue empty due to changes requested, use admin analytics
  await openRowMenu(page);
  if (await clickMenuItem(page, "Approve")) {
    await page.waitForTimeout(1200);
    await shot(page, "36-approve-modal-detail");
    await page.keyboard.press("Escape").catch(() => {});
    const cancel = page.locator("button").filter({ hasText: /cancel/i }).first();
    if (await cancel.count()) await cancel.click().catch(() => {});
  }

  // Analytics + export
  await injectAuth(page, mintToken(users.admin), users.admin);
  await page.goto(`${BASE}/dashboard/analytics/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await shot(page, "37-analytics-full");

  const exportBtn = page.locator("button, a").filter({ hasText: /export|excel|download/i }).first();
  if (await exportBtn.count()) {
    await exportBtn.click();
    await page.waitForTimeout(1500);
    await shot(page, "38-export-clicked-toast", false);
  }

  // Open first expense details from analytics if possible
  await openRowMenu(page);
  if (!(await clickMenuItem(page, "View"))) {
    const row = page.locator("table tbody tr").first();
    if (await row.count()) await row.click().catch(() => {});
  }
  await page.waitForTimeout(1200);
  await shot(page, "39-analytics-expense-details");

  // Toast: trigger profile name save with same name
  await page.goto(`${BASE}/dashboard/profile/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const saveBtn = page.locator("button").filter({ hasText: /save|update profile|update name/i }).first();
  if (await saveBtn.count()) {
    await saveBtn.click();
    await page.waitForTimeout(1200);
    await shot(page, "40-toast-profile-success", false);
  }

  // Validation error on submit expense (empty submit)
  await injectAuth(page, mintToken(users.requester), users.requester);
  await page.goto(`${BASE}/dashboard/submit-expense/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const submitBtn = page.locator("button[type='submit'], button").filter({ hasText: /submit/i }).first();
  if (await submitBtn.count()) {
    await submitBtn.click();
    await page.waitForTimeout(800);
    await shot(page, "41-submit-validation-errors");
  }

  // Reject modal validation — open reject and try confirm empty
  await injectAuth(page, mintToken(users.admin), users.admin);
  await page.goto(`${BASE}/dashboard/approver/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await openRowMenu(page);
  if (await clickMenuItem(page, "Reject")) {
    await page.waitForTimeout(800);
    const confirm = page.locator("button").filter({ hasText: /reject|confirm/i }).last();
    if (await confirm.count()) await confirm.click().catch(() => {});
    await page.waitForTimeout(600);
    await shot(page, "42-reject-validation-error");
    await page.keyboard.press("Escape").catch(() => {});
  }

  // Processor menus again for completeness
  await injectAuth(page, mintToken(users.processor), users.processor);
  await page.goto(`${BASE}/dashboard/processor/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await openRowMenu(page);
  await shot(page, "43-processor-menu-all-actions", false);

  await browser.close();
  console.log("Gap screenshots done →", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
