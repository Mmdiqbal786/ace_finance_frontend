import * as fs from 'fs';
import * as path from 'path';
import { expect, Page } from '@playwright/test';
import { hold } from './helpers';

export const RECEIPT_PNG = path.join(__dirname, 'fixtures', 'sample-receipt.png');
export const FIXTURES_DIR = path.join(__dirname, 'fixtures');

export function docsTag() {
  return `DOCS-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
}

/** Unique PNG bytes (same magic header, different SHA-256) for hard-dup demos. */
export function uniqueInvoicePath(tag: string): string {
  const base = fs.readFileSync(RECEIPT_PNG);
  const out = path.join(FIXTURES_DIR, `inv-${tag.replace(/[^a-zA-Z0-9_-]/g, '')}.png`);
  fs.writeFileSync(
    out,
    Buffer.concat([base, Buffer.from(`\n${tag}-${Date.now()}-${Math.random()}\n`)]),
  );
  return out;
}

export function writeBadTextFixture(): string {
  const out = path.join(FIXTURES_DIR, 'bad-invoice.txt');
  fs.writeFileSync(out, 'not-an-invoice');
  return out;
}

/** Open ⋮ row menu and click a menuitem (exact name). */
export async function rowAction(page: Page, menuItem: string, rowIndex = 0) {
  const row = page.locator('table tbody tr').nth(rowIndex);
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.getByRole('button', { name: 'Row actions' }).click();
  await page.getByRole('menuitem', { name: menuItem, exact: true }).click();
}

export async function clearTableSearch(page: Page) {
  const search = page.getByPlaceholder(/Search/i).first();
  if (await search.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await search.fill('');
    await page.waitForTimeout(400);
  }
}

export async function rowActionMatching(
  page: Page,
  menuItem: string,
  textHint?: string,
) {
  await clearTableSearch(page);
  if (textHint) {
    const search = page.getByPlaceholder(/Search/i).first();
    if (await search.isVisible({ timeout: 1_500 }).catch(() => false)) {
      await search.fill(textHint);
      await page.waitForTimeout(600);
    }
    const row = page.locator('table tbody tr').filter({ hasText: textHint }).first();
    if (await row.isVisible({ timeout: 15_000 }).catch(() => false)) {
      await row.getByRole('button', { name: 'Row actions' }).click();
      await page.getByRole('menuitem', { name: menuItem, exact: true }).click();
      return;
    }
    await clearTableSearch(page);
  }
  await rowAction(page, menuItem, 0);
}

export async function closeModalIfOpen(page: Page) {
  const close = page.getByRole('button', { name: 'Close modal' });
  if (await close.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await close.click();
    await hold(page, 800);
  }
}

/** Sticky centered toasts (success / hard-dup) stay until Dismiss is clicked. */
export async function dismissStickyToast(page: Page) {
  const dismiss = page.getByRole('button', { name: /^Dismiss$/i });
  // Loop in case stacked notices
  for (let i = 0; i < 3; i++) {
    if (!(await dismiss.isVisible({ timeout: i === 0 ? 5_000 : 1_500 }).catch(() => false))) {
      break;
    }
    await hold(page, 1500); // let viewers read Expense ID / message
    await dismiss.click();
    await expect(dismiss).toBeHidden({ timeout: 10_000 }).catch(() => null);
    await hold(page, 500);
  }
}

/** Inline rose banner under the form title (aria-label Remove message). */
export async function dismissInlineSubmitError(page: Page) {
  const remove = page.getByRole('button', { name: /Remove message/i });
  if (await remove.isVisible({ timeout: 1_500 }).catch(() => false)) {
    await remove.click();
    await hold(page, 400);
  }
}

export async function clearExpenseNotices(page: Page) {
  await dismissStickyToast(page);
  await dismissInlineSubmitError(page);
}

async function selectFirstRealOption(select: ReturnType<Page['locator']>) {
  const options = select.locator('option');
  const count = await options.count();
  for (let i = 0; i < count; i++) {
    const val = await options.nth(i).getAttribute('value');
    const disabled = await options.nth(i).isDisabled();
    if (val && val.trim() && !disabled) {
      await select.selectOption(val);
      return val;
    }
  }
  throw new Error('No selectable option found');
}

export async function goSubmitExpense(page: Page) {
  await page.getByRole('link', { name: /Submit Expense/i }).click();
  await expect(page).toHaveURL(/submit-expense/);
  await hold(page, 1500);
  await clearExpenseNotices(page);
}

export type FillExpenseOpts = {
  tag: string;
  amount: string;
  invoicePath: string;
  invoiceNumber?: string;
  reuseLastCatalogs?: boolean;
};

let lastCountry: string | null = null;
let lastProject: string | null = null;
let lastCategory: string | null = null;

/** Fill the submit form (does not click Submit). */
export async function fillExpenseForm(page: Page, opts: FillExpenseOpts) {
  await goSubmitExpense(page);
  await clearExpenseNotices(page);

  const invoiceNumber = opts.invoiceNumber || opts.tag;

  const country = page.locator('#country');
  await expect(country).toBeVisible({ timeout: 30_000 });

  if (opts.reuseLastCatalogs && lastCountry && lastProject && lastCategory) {
    await country.selectOption(lastCountry);
    await hold(page, 600);
    await page.locator('#project').selectOption(lastProject);
    await page.locator('#category').selectOption(lastCategory);
  } else {
    const preferred = country
      .locator('option')
      .filter({
        hasText: /India \(INR\)|United Arab Emirates|United States \(USD\)|American Samoa \(USD\)/i,
      })
      .first();
    if ((await preferred.count()) > 0) {
      lastCountry = (await preferred.getAttribute('value')) || null;
      if (lastCountry) await country.selectOption(lastCountry);
      else lastCountry = await selectFirstRealOption(country);
    } else {
      lastCountry = await selectFirstRealOption(country);
    }
    await hold(page, 800);

    const project = page.locator('#project');
    await expect(project).toBeEnabled({ timeout: 20_000 });
    const gac = project
      .locator('option')
      .filter({ hasText: /Art and culture|GAC|News Lab|GNL/i })
      .first();
    if ((await gac.count()) > 0) {
      lastProject = (await gac.getAttribute('value')) || null;
      if (lastProject) await project.selectOption(lastProject);
      else lastProject = await selectFirstRealOption(project);
    } else {
      lastProject = await selectFirstRealOption(project);
    }
    lastCategory = await selectFirstRealOption(page.locator('#category'));
  }

  const today = new Date().toISOString().slice(0, 10);
  const due = new Date();
  due.setDate(due.getDate() + 14);
  const dateField = page.locator('#date');
  if (await dateField.isVisible().catch(() => false)) {
    await dateField.fill(today);
  }
  await page.locator('#dueDate').fill(due.toISOString().slice(0, 10));

  const amountField = page.locator('#amount');
  await expect(amountField).toBeEnabled({ timeout: 15_000 });
  await amountField.fill('');
  await amountField.fill(opts.amount);

  const name = page.locator('#requesterName');
  if (!(await name.inputValue()).trim()) {
    await name.fill('Docs Requester');
  }

  await page.locator('#description').fill(
    `${opts.tag} Demo walkthrough expense for training video.`,
  );

  // Attach first — invoice parse may overwrite fields asynchronously
  await page.locator('#invoice').setInputFiles(opts.invoicePath);
  const analyzing = page.getByText(/Analyzing document/i);
  if (await analyzing.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await analyzing.waitFor({ state: 'hidden', timeout: 60_000 }).catch(() => null);
  }
  await hold(page, 800);

  // Re-assert invoice # after parse so hard-dup does not fire on OCR leftovers
  await page.locator('#invoiceNumber').fill(invoiceNumber);
  await hold(page, 600);
}

export async function clickSubmitExpenseRequest(page: Page) {
  await page.getByRole('button', { name: 'Submit Expense Request' }).click();
  await hold(page, 1200);
}

export async function confirmSubmissionModal(page: Page) {
  await expect(
    page.getByRole('heading', { name: /Confirm submission/i }),
  ).toBeVisible({ timeout: 15_000 });
  const confirmBtn = page.getByRole('button', { name: /^Confirm & Submit$/ });
  await confirmBtn.click({ trial: false });
  await page
    .getByRole('heading', { name: /Confirm submission/i })
    .waitFor({ state: 'hidden', timeout: 60_000 })
    .catch(() => null);
}

/**
 * Scope to the open catalog modal. Modal.tsx is a portal overlay without role="dialog".
 */
export function createDialog(page: Page) {
  return page.locator('div.fixed.inset-0').filter({ has: page.getByLabel('Close modal') }).last();
}

/** Success path: fill → confirm → toast → Dismiss. */
export async function submitExpenseSuccess(
  page: Page,
  opts: { tag: string; amount?: string; invoicePath?: string },
) {
  await clearExpenseNotices(page);

  const amount = opts.amount || `${(Math.random() * 40 + 12).toFixed(2)}`;
  const invoicePath = opts.invoicePath || uniqueInvoicePath(opts.tag);
  await fillExpenseForm(page, {
    tag: opts.tag,
    amount,
    invoicePath,
    invoiceNumber: opts.tag,
  });
  await clickSubmitExpenseRequest(page);

  const dupHeading = page.getByRole('heading', {
    name: /Potential Duplicate Detected/i,
  });
  if (await dupHeading.isVisible({ timeout: 4_000 }).catch(() => false)) {
    await page.getByText(/I confirm this is a separate/i).click();
    await hold(page, 800);
    await page.getByRole('button', { name: /Confirm & Submit Expense/i }).click();
  } else if (
    await page
      .getByRole('heading', { name: /Confirm submission/i })
      .isVisible({ timeout: 8_000 })
      .catch(() => false)
  ) {
    await confirmSubmissionModal(page);
  }

  const success = page.getByText(/Expense request submitted/i).first();
  const hardDup = page.getByText(/Duplicate invoice( file| number)? detected/i).first();
  await expect(success.or(hardDup)).toBeVisible({ timeout: 120_000 });
  if (await hardDup.isVisible().catch(() => false)) {
    // Demo DB may already have matching invoice # / details — dismiss and retry once with fresh ids
    await hold(page, 1500);
    await dismissStickyToast(page);
    await clearExpenseNotices(page);
    const retryTag = `${opts.tag}-R${Date.now().toString().slice(-5)}`;
    const retryPath = uniqueInvoicePath(retryTag);
    const retryAmount = `${(Number(amount) + 0.17).toFixed(2)}`;
    await fillExpenseForm(page, {
      tag: retryTag,
      amount: retryAmount,
      invoicePath: retryPath,
      invoiceNumber: retryTag,
    });
    await clickSubmitExpenseRequest(page);
    if (
      await page
        .getByRole('heading', { name: /Potential Duplicate Detected/i })
        .isVisible({ timeout: 3_000 })
        .catch(() => false)
    ) {
      await page.getByText(/I confirm this is a separate/i).click();
      await page.getByRole('button', { name: /Confirm & Submit Expense/i }).click();
    } else if (
      await page
        .getByRole('heading', { name: /Confirm submission/i })
        .isVisible({ timeout: 8_000 })
        .catch(() => false)
    ) {
      await confirmSubmissionModal(page);
    }
    await expect(page.getByText(/Expense request submitted/i).first()).toBeVisible({
      timeout: 120_000,
    });
    await hold(page, 2000);
    await dismissStickyToast(page);
    return { amount: retryAmount, invoicePath: retryPath, tag: retryTag };
  }
  await hold(page, 2000);
  await dismissStickyToast(page);
  return { amount, invoicePath, tag: opts.tag };
}
