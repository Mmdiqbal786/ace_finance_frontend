const { chromium } = require("playwright");
const crypto = require("crypto");
const path = require("path");

const OUT = path.join(__dirname, "..", "public", "docs-screenshots");
const BASE = "http://localhost:3000";
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
      iat: now,
      exp: now + 3600,
      ...extra,
    })
  ).toString("base64url");
  const s = crypto.createHmac("sha256", JWT).update(`${h}.${p}`).digest("base64url");
  return `${h}.${p}.${s}`;
}

const requester = {
  id: "6a586e564823fbb247dd65f2",
  name: "Iqbal Ahamed",
  email: "iqbal.ace786@gmail.com",
  role: "REQUESTER",
};
const admin = {
  id: "6a50db2fa55b28bc2cbeae9e",
  name: "Admin",
  email: "admin@acefinance.com",
  role: "ADMIN",
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });

  async function auth(u) {
    await page.goto(`${BASE}/login/`, { waitUntil: "domcontentloaded" });
    await page.evaluate(
      ([t, user]) => {
        localStorage.setItem("ace_finance_token", t);
        localStorage.setItem("ace_finance_user", JSON.stringify(user));
      },
      [mint(u), u]
    );
  }

  async function shot(n, fp = true) {
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, `${n}.png`), fullPage: fp });
    console.log("saved", n);
  }

  await auth(requester);
  await page.goto(`${BASE}/dashboard/my-requests/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const rows = page.locator("table tbody tr");
  const count = await rows.count();
  console.log("rows", count);
  for (let i = 0; i < count; i++) {
    const text = await rows.nth(i).innerText();
    if (/Changes Requested/i.test(text)) {
      await rows.nth(i).locator("button").last().click();
      await page.waitForTimeout(500);
      await shot("31a-edit-menu-open", false);
      const edit = page.locator("button, [role='menuitem']").filter({ hasText: /Edit/i }).first();
      if (await edit.count()) {
        await edit.click();
        await page.waitForTimeout(1500);
        await shot("31-edit-resubmit-modal");
      }
      break;
    }
  }

  await page.goto(`${BASE}/dashboard/profile/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const editProf = page.locator("button").filter({ hasText: /Edit Profile/i }).first();
  if (await editProf.count()) {
    await editProf.click();
    await page.waitForTimeout(600);
    await shot("32b-profile-edit-mode");
    const save = page.locator("button").filter({ hasText: /Save|Update/i }).first();
    if (await save.count()) {
      await save.click();
      await page.waitForTimeout(1500);
      await shot("40-toast-profile-success", false);
    }
  }

  const upd = page.locator("button").filter({ hasText: /Update Password/i }).first();
  if (await upd.count()) {
    await upd.click();
    await page.waitForTimeout(800);
    await shot("32c-password-validation-errors");
  }

  await auth(admin);
  await page.goto(`${BASE}/dashboard/user-management/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const add = page.locator("button").filter({ hasText: /Add|Create|New User/i }).first();
  if (await add.count()) {
    await add.click();
    await page.waitForTimeout(900);
    await shot("44-admin-create-user-modal");
    await page.keyboard.press("Escape");
  }

  await page.goto(`${BASE}/dashboard/categories/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const addCat = page.locator("button").filter({ hasText: /Add|Create|New/i }).first();
  if (await addCat.count()) {
    await addCat.click();
    await page.waitForTimeout(800);
    await shot("45-admin-create-category-modal");
  }

  await page.goto(`${BASE}/forgot-password/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await page.fill('input[type="email"]', "admin@acefinance.com");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  await shot("46-forgot-password-success");

  // TOTP disable UI: setup then we can't easily enable without code — capture enable confirm area already have 33
  // Capture change password success path validation already done

  await browser.close();
  console.log("extra gaps done");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
