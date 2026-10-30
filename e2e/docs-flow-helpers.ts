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

/**
 * Minimal unique PNG with no receipt text — avoids OCR extracting an invoice #
 * that hard-blocks soft/potential-duplicate demos.
 */
export function uniqueBlankInvoicePath(tag: string): string {
  // 1x1 PNG + unique trailer (still a valid image upload for the API)
  const png1x1 = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
  const out = path.join(
    FIXTURES_DIR,
    `inv-blank-${tag.replace(/[^a-zA-Z0-9_-]/g, '')}.png`,
  );
  fs.writeFileSync(
    out,
    Buffer.concat([png1x1, Buffer.from(`\n${tag}-${Date.now()}-${Math.random()}\n`)]),
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
  /** Pass '' to clear invoice # (needed for soft-dup so hard invoice-# rules do not fire). */
  invoiceNumber?: string;
  reuseLastCatalogs?: boolean;
  /** When true, leave invoice number empty after attach/OCR. */
  clearInvoiceNumber?: boolean;
};

let lastCountry: string | null = null;
let lastProject: string | null = null;
let lastCategory: string | null = null;

/** Fill the submit form (does not click Submit). */
export async function fillExpenseForm(page: Page, opts: FillExpenseOpts) {
  await goSubmitExpense(page);
  await clearExpenseNotices(page);

  const invoiceNumber = opts.clearInvoiceNumber
    ? ''
    : opts.invoiceNumber !== undefined
      ? opts.invoiceNumber
      : opts.tag;

  const country = page.locator('#country');
  await expect(country).toBeVisible({ timeout: 30_000 });

  if (opts.reuseLastCatalogs && lastCountry && lastProject && lastCategory) {
    await country.selectOption(lastCountry);
    await hold(page, 600);
    await page.locator('#project').selectOption(lastProject);
    await page.locator('#category').selectOption(lastCategory);
  } else {
    // Prefer INR/AED (stronger vs USD) so local amount ≥ ~200 still clears USD $1 min.
    // Avoid weak currencies like ALL where small amounts fail FX min and the form looks "stuck".
    const preferred = country
      .locator('option')
      .filter({
        hasText: /India \(INR\)|United Arab Emirates \(AED\)|United States \(USD\)/i,
      })
      .first();
    if ((await preferred.count()) > 0) {
      lastCountry = (await preferred.getAttribute('value')) || null;
      if (lastCountry) await country.selectOption(lastCountry);
      else lastCountry = await selectFirstRealOption(country);
    } else {
      lastCountry = await selectFirstRealOption(country);
    }
    await hold(page, 1200);

    const project = page.locator('#project');
    await expect(project).toBeEnabled({ timeout: 20_000 });
    // Requester dropdown = Admin-assigned projects only (GAC for Requester GAC)
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
    await hold(page, 800);
    lastCategory = await selectFirstRealOption(page.locator('#category'));
    await hold(page, 600);
  }

  const today = new Date().toISOString().slice(0, 10);
  const due = new Date();
  due.setDate(due.getDate() + 14);
  const dateField = page.locator('#date');
  if (await dateField.isVisible().catch(() => false)) {
    await dateField.fill(today);
  }
  await page.locator('#dueDate').fill(due.toISOString().slice(0, 10));
  await hold(page, 500);

  const amountField = page.locator('#amount');
  await expect(amountField).toBeEnabled({ timeout: 15_000 });
  await amountField.fill('');
  await amountField.fill(opts.amount);
  await hold(page, 600);

  const name = page.locator('#requesterName');
  if (!(await name.inputValue()).trim()) {
    await name.fill('Docs Requester');
  }

  await page.locator('#description').fill(
    `${opts.tag} Demo walkthrough expense for training video.`,
  );
  await hold(page, 500);

  // Attach — invoice parse may overwrite fields asynchronously
  await page.locator('#invoice').setInputFiles(opts.invoicePath);
  const analyzing = page.getByText(/Analyzing document/i);
  if (await analyzing.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await analyzing.waitFor({ state: 'hidden', timeout: 60_000 }).catch(() => null);
  }
  await hold(page, 1000);

  // Re-assert after OCR so soft-dup amount/hash/invoice # stay intentional
  await page.locator('#invoiceNumber').fill(invoiceNumber);
  await amountField.fill('');
  await amountField.fill(opts.amount);
  if (opts.reuseLastCatalogs && lastCountry && lastProject && lastCategory) {
    await page.locator('#country').selectOption(lastCountry);
    await page.locator('#project').selectOption(lastProject);
    await page.locator('#category').selectOption(lastCategory);
  }
  // Second clear — OCR/async parse can repopulate invoice # after first fill
  if (opts.clearInvoiceNumber) {
    await hold(page, 500);
    await page.locator('#invoiceNumber').fill('');
  }
  await hold(page, 800);
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

/** After Submit click: Confirm modal → maybe Potential Duplicate → success or hard-dup toast. */
async function finishSubmitThroughModals(page: Page) {
  const softHeading = page.getByRole('heading', {
    name: /Potential Duplicate Detected/i,
  });
  const confirmHeading = page.getByRole('heading', { name: /Confirm submission/i });
  const success = page.getByText(/Expense request submitted/i).first();
  const hardDup = page.getByText(/Duplicate invoice( file| number)? detected/i).first();

  await expect(confirmHeading.or(softHeading).or(success).or(hardDup)).toBeVisible({
    timeout: 60_000,
  });

  if (await confirmHeading.isVisible().catch(() => false)) {
    await confirmSubmissionModal(page);
  }

  // Soft warning is returned from the API after Confirm — handle it here
  await expect(softHeading.or(success).or(hardDup)).toBeVisible({ timeout: 120_000 });
  if (await softHeading.isVisible().catch(() => false)) {
    await page.getByText(/I confirm this is a separate/i).click();
    await hold(page, 600);
    await page.getByRole('button', { name: /Confirm & Submit Expense/i }).click();
    await expect(success.or(hardDup)).toBeVisible({ timeout: 120_000 });
  }
}

/** Success path: fill → confirm → (soft confirm if needed) → toast → Dismiss. */
export async function submitExpenseSuccess(
  page: Page,
  opts: {
    tag: string;
    amount?: string;
    invoicePath?: string;
    clearInvoiceNumber?: boolean;
  },
) {
  await clearExpenseNotices(page);

  // Whole numbers preferred (valid + clear on video); still max 2 dp if caller passes decimals
  const amount = opts.amount || String(200 + Math.floor(Math.random() * 90));
  const invoicePath = opts.invoicePath || uniqueInvoicePath(opts.tag);
  await fillExpenseForm(page, {
    tag: opts.tag,
    amount,
    invoicePath,
    invoiceNumber: opts.clearInvoiceNumber ? '' : opts.tag,
    clearInvoiceNumber: opts.clearInvoiceNumber,
  });
  await clickSubmitExpenseRequest(page);
  await finishSubmitThroughModals(page);

  const success = page.getByText(/Expense request submitted/i).first();
  const hardDup = page.getByText(/Duplicate invoice( file| number)? detected/i).first();
  if (await hardDup.isVisible().catch(() => false)) {
    await hold(page, 1500);
    await dismissStickyToast(page);
    await clearExpenseNotices(page);
    const retryTag = `${opts.tag}-R${Date.now().toString().slice(-5)}`;
    const retryPath = uniqueBlankInvoicePath(retryTag);
    const retryAmount = String(Math.round(Number(amount) + 11 + Math.floor(Math.random() * 7)));
    await fillExpenseForm(page, {
      tag: retryTag,
      amount: retryAmount,
      invoicePath: retryPath,
      clearInvoiceNumber: true,
    });
    await clickSubmitExpenseRequest(page);
    await finishSubmitThroughModals(page);
    await expect(page.getByText(/Expense request submitted/i).first()).toBeVisible({
      timeout: 120_000,
    });
    await hold(page, 2000);
    await dismissStickyToast(page);
    return { amount: retryAmount, invoicePath: retryPath, tag: retryTag };
  }
  await expect(success).toBeVisible({ timeout: 5_000 });
  await hold(page, 2000);
  await dismissStickyToast(page);
  return { amount, invoicePath, tag: opts.tag };
}
