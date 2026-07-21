/**
 * Refreshes ALL non-email UI screenshots used by /docs-guide/.
 * Prefer not mutating expense status when possible.
 *
 * node scripts/capture-docs-refresh.cjs
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
  admin: {
    id: "6a50db2fa55b28bc2cbeae9e",
    name: "Admin",
    email: "admin@acefinance.com",
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
    [mintToken(user, extra), { ...user, ...extra }]
  );
}

async function capture(page, name, fullPage = true) {
  await page.waitForTimeout(700);
  await page.screenshot({
    path: path.join(OUT, `${name}.png`),
    fullPage,
  });
  console.log("saved", name);
}

async function openAndCapture(page, route, name, fullPage = true) {
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" }).catch(async () => {
    await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
  });
  await capture(page, name, fullPage);
}

async function openRowMenu(page) {
  const candidates = [
    page.locator("button[aria-label*='more' i]").first(),
    page.locator("button[aria-label*='actions' i]").first(),
    page.locator("table tbody tr").first().locator("button").last(),
  ];
  for (const candidate of candidates) {
    if (await candidate.count()) {
      await candidate.click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(400);
      return true;
    }
  }
  return false;
}

async function clickMenuItem(page, text) {
  const exact = page
    .locator("button, [role='menuitem'], a")
    .filter({ hasText: new RegExp(`^\\s*${text}`, "i") })
    .first();
  if (await exact.count()) {
    await exact.click({ timeout: 4000 }).catch(() => {});
    return true;
  }
  const loose = page
    .locator("button, [role='menuitem']")
    .filter({ hasText: new RegExp(text, "i") })
    .first();
  if (await loose.count()) {
    await loose.click({ timeout: 4000 }).catch(() => {});
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

function decodeXml(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function extractWorkbookPreview(xml) {
  const worksheetNames = Array.from(
    xml.matchAll(/<Worksheet[^>]*ss:Name="([^"]+)"/g),
    (match) => decodeXml(match[1])
  );
  const firstWorksheet =
    xml.match(/<Worksheet\b[\s\S]*?<\/Worksheet>/)?.[0] || "";
  const rows = Array.from(firstWorksheet.matchAll(/<Row\b[^>]*>([\s\S]*?)<\/Row>/g))
    .slice(0, 12)
    .map((rowMatch) =>
      Array.from(rowMatch[1].matchAll(/<Cell\b[^>]*>([\s\S]*?)<\/Cell>/g))
        .slice(0, 10)
        .map((cellMatch) => {
          const data = cellMatch[1].match(/<Data\b[^>]*>([\s\S]*?)<\/Data>/)?.[1] || "";
          return decodeXml(data.replace(/<[^>]+>/g, ""));
        })
    );
  return { worksheetNames, rows };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function workbookPreviewHtml(filename, workbook) {
  const tabs = workbook.worksheetNames
    .map(
      (name, index) =>
        `<span class="tab${index === 0 ? " active" : ""}">${escapeHtml(name)}</span>`
    )
    .join("");
  const rows = workbook.rows
    .map(
      (row, rowIndex) =>
        `<tr>${row
          .map(
            (cell) =>
              `<${rowIndex === 0 ? "th" : "td"}>${escapeHtml(cell)}</${
                rowIndex === 0 ? "th" : "td"
              }>`
          )
          .join("")}</tr>`
    )
    .join("");

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; background: #eef2f6; color: #1f2937; font-family: "Segoe UI", Arial, sans-serif; }
        .window { margin: 34px auto; width: 1280px; overflow: hidden; border: 1px solid #9ca3af; border-radius: 12px; background: white; box-shadow: 0 18px 45px rgba(15, 23, 42, .18); }
        .title { display: flex; align-items: center; gap: 12px; padding: 14px 18px; background: #107c41; color: white; font-size: 16px; font-weight: 700; }
        .excel { display: grid; width: 34px; height: 34px; place-items: center; border-radius: 6px; background: white; color: #107c41; font-size: 19px; font-weight: 900; }
        .subtitle { padding: 10px 18px; border-bottom: 1px solid #d1d5db; background: #f8fafc; color: #475569; font-size: 13px; }
        .sheet { overflow: hidden; padding: 14px 18px 0; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { max-width: 180px; overflow: hidden; padding: 8px 10px; border: 1px solid #cbd5e1; text-align: left; text-overflow: ellipsis; white-space: nowrap; }
        th { background: #203c62; color: white; font-weight: 700; }
        tr:nth-child(even) td { background: #f8fafc; }
        .tabs { display: flex; gap: 2px; margin-top: 14px; border-top: 1px solid #cbd5e1; background: #f1f5f9; padding: 8px 14px 0; }
        .tab { padding: 9px 14px; border: 1px solid #cbd5e1; border-bottom: 0; border-radius: 6px 6px 0 0; background: #e2e8f0; color: #334155; font-size: 12px; font-weight: 600; }
        .tab.active { background: white; color: #107c41; box-shadow: inset 0 3px #107c41; }
        .note { padding: 11px 18px; background: #ecfdf5; color: #166534; font-size: 12px; }
      </style>
    </head>
    <body>
      <main class="window">
        <div class="title"><span class="excel">X</span>${escapeHtml(filename)}</div>
        <div class="subtitle">Downloaded report preview — first worksheet and rows</div>
        <div class="sheet"><table>${rows}</table></div>
        <div class="tabs">${tabs}</div>
        <div class="note">The exported workbook includes all expense, change request, workflow, and payment history sheets.</div>
      </main>
    </body>
  </html>`;
}

async function captureExport(page) {
  await page.goto(`${BASE}/dashboard/analytics/`, { waitUntil: "networkidle" });
  await capture(page, "37-analytics-full");

  const exportButton = page
    .locator("button, a")
    .filter({ hasText: /export|excel|download/i })
    .first();
  if (!(await exportButton.count())) {
    throw new Error("Export Excel button was not found");
  }

  const downloadPromise = page.waitForEvent("download", { timeout: 15000 });
  await exportButton.click();
  await downloadPromise;
  await capture(page, "38-export-clicked-toast", false);
  // Keep 38b-export-workbook-example.png as the real Microsoft Excel screenshot.
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 1,
    acceptDownloads: true,
    // Reveal-on-scroll sections honor reduced motion and render immediately,
    // otherwise a full-page screenshot leaves them blank (white space).
    reducedMotion: "reduce",
  });

  // ===== Public pages =====
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await capture(page, "01-landing");

  await openAndCapture(page, "/login/", "02-login-password");
  await page.fill("#login-email", "admin@acefinance.com");
  await page.fill("#login-password", "WrongPass123");
  await page.click("#login-submit");
  await page.waitForTimeout(1200);
  await capture(page, "03-login-error-invalid", false);

  await page.goto(`${BASE}/login/`, { waitUntil: "networkidle" });
  await page.fill("#login-email", "admin@acefinance.com");
  await page.fill("#login-password", "Admin@1234");
  await page.click("#login-submit");
  await page.waitForURL(/\/dashboard/, { timeout: 25000 });
  await page.waitForTimeout(1000);
  await capture(page, "04-login-admin-dashboard");

  await page.goto(`${BASE}/login/`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.goto(`${BASE}/login/`, { waitUntil: "networkidle" });
  await page.fill("#login-email", "iqbal.ace786@gmail.com");
  await page.fill("#login-password", "Aceolution_2024");
  await page.click("#login-submit");
  try {
    await page.waitForSelector("#login-otp", { timeout: 45000 });
  } catch {
    // keep going with whatever landed
  }
  await capture(page, "05-login-otp-challenge");
  if (await page.locator("#login-otp").count()) {
    await page.fill("#login-otp", "000000");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1200);
    await capture(page, "05b-login-otp-error", false);
  }

  await openAndCapture(page, "/forgot-password/", "06-forgot-password");
  await openAndCapture(page, "/reset-password/?token=invalid-demo-token", "29-reset-password-invalid");
  await openAndCapture(page, "/reset-password/", "29b-reset-password-missing-token");

  await injectAuth(page, users.admin, { mustChangePassword: true });
  await openAndCapture(page, "/set-password/", "28-set-password-first-login");

  // ===== Requester =====
  await injectAuth(page, users.requester);
  await openAndCapture(page, "/dashboard/", "07-requester-dashboard");
  await openAndCapture(page, "/dashboard/submit-expense/", "08-submit-expense");
  const submitButton = page
    .locator("button[type='submit'], button")
    .filter({ hasText: /submit/i })
    .first();
  if (await submitButton.count()) {
    await submitButton.click();
    await capture(page, "41-submit-validation-errors");
  }
  await openAndCapture(page, "/dashboard/my-requests/", "09-my-requests");
  await openAndCapture(page, "/dashboard/profile/", "32-profile-full");

  const editProfile = page.locator("button").filter({ hasText: /edit profile|edit name/i }).first();
  if (await editProfile.count()) {
    await editProfile.click();
    await page.waitForTimeout(700);
    await capture(page, "32b-profile-edit-mode");
  }

  const passwordTab = page.locator("button, a").filter({ hasText: /password/i }).first();
  if (await passwordTab.count()) await passwordTab.click().catch(() => {});
  const changePw = page.locator("button").filter({ hasText: /change password|update password|save password/i }).first();
  if (await changePw.count()) {
    await changePw.click();
    await page.waitForTimeout(700);
    await capture(page, "32c-password-validation-errors");
  }

  const setupTotp = page.locator("button").filter({ hasText: /Set up Authenticator/i }).first();
  if (await setupTotp.count()) {
    await setupTotp.click();
    await page.waitForTimeout(1400);
    await capture(page, "33-totp-setup-qr");
    await closeModal(page);
  }

  // Ensure a Changes Requested row for edit screenshots
  const approverToken = mintToken(users.approver);
  const list = await api("GET", "/expenses", approverToken);
  const expenses = Array.isArray(list.data)
    ? list.data
    : list.data?.data || list.data?.items || [];
  const pending = Array.isArray(expenses)
    ? expenses.find((e) => e.status === "PENDING_APPROVER") ||
      expenses.find((e) => e.status === "CHANGES_REQUESTED")
    : null;
  if (pending?.status === "PENDING_APPROVER") {
    await api("PATCH", `/expenses/${pending.id || pending._id}/request-changes`, approverToken, {
      notes: "Please update description for documentation screenshot",
      target: "requester",
    });
  }

  await injectAuth(page, users.requester);
  await openAndCapture(page, "/dashboard/my-requests/", "30-my-requests-with-changes");
  await openRowMenu(page);
  await capture(page, "31a-edit-menu-open", false);
  if (await clickMenuItem(page, "Edit")) {
    await page.waitForTimeout(1000);
    await capture(page, "31-edit-resubmit-modal");
    await closeModal(page);
  }

  // ===== Approver =====
  await injectAuth(page, users.approver);
  await openAndCapture(page, "/dashboard/approver/", "10-approver-queue");
  await openRowMenu(page);
  await capture(page, "11-approver-actions-menu", false);

  await page.goto(`${BASE}/dashboard/approver/`, { waitUntil: "networkidle" });
  await openRowMenu(page);
  if (await clickMenuItem(page, "Approve")) {
    await page.waitForTimeout(900);
    await capture(page, "13-approver-approve-modal");
    await capture(page, "36-approve-modal-detail");
    await closeModal(page);
  }

  await page.goto(`${BASE}/dashboard/approver/`, { waitUntil: "networkidle" });
  await openRowMenu(page);
  if (await clickMenuItem(page, "Reject")) {
    await page.waitForTimeout(900);
    await capture(page, "14-approver-reject-modal");
    const confirm = page.locator("button").filter({ hasText: /reject|confirm/i }).last();
    if (await confirm.count()) await confirm.click().catch(() => {});
    await page.waitForTimeout(600);
    await capture(page, "42-reject-validation-error");
    await closeModal(page);
  }

  await page.goto(`${BASE}/dashboard/approver/`, { waitUntil: "networkidle" });
  await openRowMenu(page);
  if (await clickMenuItem(page, "Request Changes")) {
    await page.waitForTimeout(900);
    await capture(page, "15-approver-request-changes-modal");
    await closeModal(page);
  }

  await page.goto(`${BASE}/dashboard/approver/`, { waitUntil: "networkidle" });
  await openRowMenu(page);
  if (await clickMenuItem(page, "View")) {
    await page.waitForTimeout(1100);
    await capture(page, "35-expense-details-audit");
    await closeModal(page);
  }

  // ===== Processor =====
  await injectAuth(page, users.processor);
  await openAndCapture(page, "/dashboard/processor/", "16-processor-queue");
  await openRowMenu(page);
  await capture(page, "17-processor-actions-menu", false);
  await capture(page, "43-processor-menu-all-actions", false);

  await page.goto(`${BASE}/dashboard/processor/`, { waitUntil: "networkidle" });
  await openRowMenu(page);
  if (await clickMenuItem(page, "Partial")) {
    await page.waitForTimeout(900);
    await capture(page, "18-processor-partial-pay-modal");
    await closeModal(page);
  }

  await page.goto(`${BASE}/dashboard/processor/`, { waitUntil: "networkidle" });
  await openRowMenu(page);
  if (
    (await clickMenuItem(page, "Process")) ||
    (await clickMenuItem(page, "Mark Paid")) ||
    (await clickMenuItem(page, "Pay"))
  ) {
    await page.waitForTimeout(900);
    await capture(page, "19-processor-full-pay-modal");
    await closeModal(page);
  }

  await page.goto(`${BASE}/dashboard/processor/`, { waitUntil: "networkidle" });
  await openRowMenu(page);
  if (await clickMenuItem(page, "Reject")) {
    await page.waitForTimeout(900);
    await capture(page, "20-processor-reject-modal");
    await closeModal(page);
  }

  await page.goto(`${BASE}/dashboard/processor/`, { waitUntil: "networkidle" });
  await openRowMenu(page);
  if (await clickMenuItem(page, "Request Changes")) {
    await page.waitForTimeout(900);
    await capture(page, "21-processor-request-changes-modal");
    await closeModal(page);
  }

  await openAndCapture(page, "/dashboard/analytics/", "22-analytics");

  // ===== Admin =====
  await injectAuth(page, users.admin);
  await openAndCapture(page, "/dashboard/user-management/", "24-admin-users");
  const createUser = page.locator("button").filter({ hasText: /create user|add user|new user/i }).first();
  if (await createUser.count()) {
    await createUser.click();
    await page.waitForTimeout(900);
    await capture(page, "44-admin-create-user-modal");
    await closeModal(page);
  }

  await openAndCapture(page, "/dashboard/categories/", "25-admin-categories");
  const createCategory = page
    .locator("button")
    .filter({ hasText: /create category|add category|new category/i })
    .first();
  if (await createCategory.count()) {
    await createCategory.click();
    await page.waitForTimeout(900);
    await capture(page, "45-admin-create-category-modal");
    await closeModal(page);
  }

  await openAndCapture(page, "/dashboard/projects/", "26-admin-projects");
  await openAndCapture(page, "/dashboard/countries/", "27-admin-countries");
  await openAndCapture(page, "/dashboard/profile/", "23-profile");

  await page.goto(`${BASE}/dashboard/analytics/`, { waitUntil: "networkidle" });
  await openRowMenu(page);
  if (!(await clickMenuItem(page, "View"))) {
    const row = page.locator("table tbody tr").first();
    if (await row.count()) await row.click().catch(() => {});
  }
  await page.waitForTimeout(1100);
  await capture(page, "39-analytics-expense-details");
  await closeModal(page);

  await captureExport(page);

  // Best-effort profile toast
  await page.goto(`${BASE}/dashboard/profile/`, { waitUntil: "networkidle" });
  const saveBtn = page.locator("button").filter({ hasText: /save|update profile|update name/i }).first();
  if (await saveBtn.count()) {
    await saveBtn.click();
    await page.waitForTimeout(1000);
    await capture(page, "40-toast-profile-success", false);
  }

  await browser.close();
  console.log("Full UI screenshot refresh done →", OUT);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
