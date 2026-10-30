import { test, expect } from '@playwright/test';
import {
  DEMO_APPROVER,
  DEMO_PROCESSOR,
  DEMO_REQUESTER,
  adminPasswordLoginDemo,
  demoAccessLogin,
  hold,
  signOutFromDashboard,
} from './helpers';
import {
  RECEIPT_PNG,
  clickSubmitExpenseRequest,
  closeModalIfOpen,
  clearExpenseNotices,
  confirmSubmissionModal,
  createDialog,
  dismissInlineSubmitError,
  dismissStickyToast,
  docsTag,
  fillExpenseForm,
  goSubmitExpense,
  rowAction,
  rowActionMatching,
  submitExpenseSuccess,
  uniqueBlankInvoicePath,
  uniqueInvoicePath,
  writeBadTextFixture,
} from './docs-flow-helpers';

/**
 * @docs Full Demo role flows for training videos + voice-over.
 *
 * Requester covers: validation error, bad file, success, hard duplicate, soft duplicate.
 * Approver: approve / request changes / reject / report.
 * Processor: full pay / partial / changes / reject payout.
 * Admin: CRUD projects, categories, countries, users.
 *
 *   npm run test:e2e:docs
 *   npm run docs:publish-videos
 *
 * Narration: docs/videos/VOICE-SCRIPTS.md
 */
test.describe('Role walkthroughs (Demo) @docs', () => {
  test.setTimeout(900_000);

  test('01 Requester Demo walkthrough', async ({ page }) => {
    await demoAccessLogin(page, DEMO_REQUESTER);
    await hold(page, 4000);
    await expect(page.getByText(/Demo/i).first()).toBeVisible();

    // --- Error: submit without attachment ---
    await goSubmitExpense(page);
    await clearExpenseNotices(page);
    await hold(page, 2500); // project dropdown = assigned projects only
    await clickSubmitExpenseRequest(page);
    await hold(page, 3000);
    await expect(
      page.getByText(/Form|attachment|required|highlighted/i).first(),
    ).toBeVisible({ timeout: 10_000 });
    await hold(page, 3000);

    // --- Error: disallowed file type ---
    const badFile = writeBadTextFixture();
    const errTag = docsTag();
    await fillExpenseForm(page, {
      tag: errTag,
      amount: '200',
      invoicePath: badFile,
    });
    await clickSubmitExpenseRequest(page);
    await hold(page, 3500);

    // --- Success: local currency → USD/FX + emails (blank invoice = clean soft-dup anchor) ---
    // Whole amounts (e.g. 200) — form allows no decimals; also safe above USD $1 after FX
    const successTag = docsTag();
    const sharedAmount = String(200 + (Date.now() % 90)); // 200–289, no decimal point
    const success = await submitExpenseSuccess(page, {
      tag: successTag,
      amount: sharedAmount,
      invoicePath: uniqueBlankInvoicePath(successTag),
      clearInvoiceNumber: true,
    });
    // Use returned amount (retry may bump it) so soft-dup fuzzy triple matches
    const softAmount = success.amount;

    // --- Hard duplicate: SAME invoice FILE bytes (new invoice #) → blocked ---
    await fillExpenseForm(page, {
      tag: docsTag(),
      amount: '250',
      invoicePath: success.invoicePath,
      invoiceNumber: `HARD-${docsTag()}`,
      reuseLastCatalogs: true,
    });
    await clickSubmitExpenseRequest(page);
    if (
      await page
        .getByRole('heading', { name: /Confirm submission/i })
        .isVisible({ timeout: 5_000 })
        .catch(() => false)
    ) {
      await confirmSubmissionModal(page);
    }
    await expect(
      page.getByText(/Duplicate invoice( file)? detected/i).first(),
    ).toBeVisible({ timeout: 90_000 });
    await hold(page, 3500);
    await dismissStickyToast(page);

    // --- Soft / potential duplicate (MUST show Potential Duplicate Detected modal) ---
    // Soft trigger = SAME project + category + amount + currency (country) + expense date (±1 day).
    // Different file (blank unique PNG) + empty invoice # so HARD file/invoice-# rules do not fire first.
    async function forceSoftDuplicateModal(amount: string) {
      for (let attempt = 0; attempt < 4; attempt++) {
        const tag = `SOFT-${docsTag()}-${attempt}`;
        await clearExpenseNotices(page);
        await fillExpenseForm(page, {
          tag,
          amount,
          invoicePath: uniqueBlankInvoicePath(tag),
          clearInvoiceNumber: true,
          reuseLastCatalogs: true, // same country(=currency) + project + category as success
        });
        // Lock soft-dup fields again after OCR (must match the success row exactly)
        await page.locator('#invoiceNumber').fill('');
        await page.locator('#amount').fill('');
        await page.locator('#amount').fill(amount);
        const today = new Date().toISOString().slice(0, 10);
        const dateField = page.locator('#date');
        if (await dateField.isVisible().catch(() => false)) {
          await dateField.fill(today);
        }
        await hold(page, 1000);
        await clickSubmitExpenseRequest(page);

        const softHeading = page.getByRole('heading', {
          name: /Potential Duplicate Detected/i,
        });
        const confirmHeading = page.getByRole('heading', {
          name: /Confirm submission/i,
        });
        const hardDupText = page
          .getByText(/Duplicate invoice( file| number)? detected/i)
          .first();

        await expect(softHeading.or(confirmHeading).or(hardDupText)).toBeVisible({
          timeout: 90_000,
        });

        if (await hardDupText.isVisible().catch(() => false)) {
          await hold(page, 2000);
          await dismissStickyToast(page);
          await dismissInlineSubmitError(page);
          continue;
        }

        if (await confirmHeading.isVisible().catch(() => false)) {
          await confirmSubmissionModal(page);
        }

        // Soft modal appears after Confirm when API returns POTENTIAL_DUPLICATE
        const softVisible = await softHeading
          .isVisible({ timeout: 60_000 })
          .catch(() => false);
        if (!softVisible) {
          // Accidental plain success — create a fresh amount anchor and retry
          await dismissStickyToast(page);
          await clearExpenseNotices(page);
          const refreshed = await submitExpenseSuccess(page, {
            tag: docsTag(),
            amount: String(Number(amount) + 10 + attempt), // whole number, same currency path
            invoicePath: uniqueBlankInvoicePath(`anchor-${docsTag()}`),
            clearInvoiceNumber: true,
          });
          amount = refreshed.amount;
          continue;
        }

        // Hold long so the Potential Duplicate form is clear on the video
        await hold(page, 5000);
        await page.getByText(/I confirm this is a separate/i).click();
        await hold(page, 2500);
        await page.getByRole('button', { name: /Confirm & Submit Expense/i }).click();
        await expect(page.getByText(/Expense request submitted/i).first()).toBeVisible({
          timeout: 120_000,
        });
        await hold(page, 3000);
        await dismissStickyToast(page);
        return;
      }
      throw new Error(
        'Potential Duplicate Detected modal never appeared after retries — soft-dup not captured',
      );
    }

    await forceSoftDuplicateModal(softAmount);

    // Extra unique submits so Approver Media (same GAC project) has queue items
    await submitExpenseSuccess(page, {
      tag: docsTag(),
      amount: String(300 + (Date.now() % 50)),
      invoicePath: uniqueBlankInvoicePath(docsTag()),
      clearInvoiceNumber: true,
    });
    await submitExpenseSuccess(page, {
      tag: docsTag(),
      amount: String(350 + (Date.now() % 40)),
      invoicePath: uniqueBlankInvoicePath(docsTag()),
      clearInvoiceNumber: true,
    });

    await page.getByRole('link', { name: 'My Requests', exact: true }).click();
    await expect(page).toHaveURL(/my-requests/);
    await hold(page, 4000);
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 30_000 });

    // View — local amount, USD, FX rate (submit already emailed requester + project approvers)
    await rowAction(page, 'View', 0);
    await hold(page, 4500);
    await closeModalIfOpen(page);
    await hold(page, 1500);

    await page.getByRole('link', { name: 'Dashboard', exact: true }).first().click();
    await hold(page, 2500);
    await signOutFromDashboard(page);
    await hold(page, 2000);
  });

  test('02 Approver Demo walkthrough', async ({ page }) => {
    await demoAccessLogin(page, DEMO_APPROVER);
    await hold(page, 4000);

    await page.getByRole('link', { name: /^Approver/i }).click();
    await expect(page).toHaveURL(/approver/);
    await hold(page, 4000); // queue = assigned projects only (e.g. GAC/GNL/GNP for Approver Media)

    // 1) Approve — processors get email; requester sees status (no approve email)
    await rowAction(page, 'Approve', 0);
    await expect(page.getByRole('heading', { name: /Approve Expense/i })).toBeVisible({
      timeout: 15_000,
    });
    await hold(page, 2000);
    await page.locator('#notes').fill('Docs video: approved for payment.');
    await hold(page, 2000);
    await page.getByRole('button', { name: 'Confirm Action' }).click();
    await hold(page, 3500);

    // 2) Request Changes → requester
    await rowAction(page, 'Request Changes', 0);
    await expect(page.getByRole('heading', { name: /Request Changes/i })).toBeVisible({
      timeout: 15_000,
    });
    await page.locator('#changeNotes').fill('Docs video: please attach a clearer invoice.');
    await hold(page, 1500);
    await page.getByRole('button', { name: 'Send Request Changes' }).click();
    await hold(page, 3000);

    // 3) Reject
    await rowAction(page, 'Reject', 0);
    await expect(page.getByRole('heading', { name: /Reject Expense/i })).toBeVisible({
      timeout: 15_000,
    });
    await page.locator('#notes').fill('Docs video: rejected — policy example.');
    await hold(page, 1500);
    await page.getByRole('button', { name: 'Confirm Action' }).click();
    await hold(page, 3000);

    // 4) View one + Analytics report
    if (await page.locator('table tbody tr').first().isVisible().catch(() => false)) {
      await rowAction(page, 'View', 0);
      await hold(page, 3000);
      await closeModalIfOpen(page);
    }

    await page.getByRole('link', { name: /Analytics/i }).click();
    await expect(page).toHaveURL(/analytics/);
    await hold(page, 3000);
    const exportBtn = page.getByRole('button', { name: /Export Excel Report/i });
    if (await exportBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 30_000 }).catch(() => null),
        exportBtn.click(),
      ]);
      if (download) await hold(page, 2000);
    }
    await hold(page, 2500);

    await signOutFromDashboard(page);
    await hold(page, 1500);
  });

  test('03 Processor Demo walkthrough', async ({ page }) => {
    await demoAccessLogin(page, DEMO_PROCESSOR);
    await hold(page, 3000);

    await page.getByRole('link', { name: /^Processor/i }).click();
    await expect(page).toHaveURL(/processor/);
    await hold(page, 3000);

    // Ensure we have approved rows — if empty, skip gracefully after hold
    const hasRows = await page
      .locator('table tbody tr')
      .first()
      .isVisible({ timeout: 15_000 })
      .catch(() => false);

    if (hasRows) {
      // 1) Mark Paid (full)
      await rowAction(page, 'Mark Paid', 0);
      await expect(
        page.getByRole('heading', { name: /Mark as Processed|Paid/i }),
      ).toBeVisible({ timeout: 15_000 });
      await page.locator('#processReceipt').setInputFiles(RECEIPT_PNG);
      await page.locator('#notes').fill('Docs video: full payment released.');
      await hold(page, 1500);
      await page.getByRole('button', { name: 'Confirm Action' }).click();
      await hold(page, 3500);

      // 2) Partial pay
      if (await page.locator('table tbody tr').first().isVisible().catch(() => false)) {
        await rowAction(page, 'Partially Paid', 0);
        await expect(
          page.getByRole('heading', { name: /Partial Payment/i }),
        ).toBeVisible({ timeout: 15_000 });
        const maxHint = await page.locator('body').innerText();
        const maxMatch = maxHint.match(/Max\s+([\d.]+)/i);
        const partial = maxMatch ? Math.min(5, Number(maxMatch[1]) || 5).toFixed(2) : '5.00';
        await page.locator('#paymentAmount').fill(partial);
        await page.locator('#partialReceipt').setInputFiles(RECEIPT_PNG);
        await page.locator('#partialNotes').fill('Docs video: partial payment.');
        await hold(page, 1500);
        await page.getByRole('button', { name: 'Record Partial Payment' }).click();
        await hold(page, 3500);
      }

      // 3) Request Changes → Approver (needs APPROVED_APPROVER)
      const rowsLeft = await page.locator('table tbody tr').count();
      if (rowsLeft > 0) {
        await rowAction(page, 'Request Changes', 0);
        const changesHeading = page.getByRole('heading', { name: /Request Changes/i });
        if (await changesHeading.isVisible({ timeout: 8_000 }).catch(() => false)) {
          const approverRadio = page.locator('input[name="changeTarget"][value="approver"]');
          if (await approverRadio.isVisible().catch(() => false)) {
            await approverRadio.check();
          }
          await page
            .locator('#changeNotes')
            .fill('Docs video: send back to Approver for re-check.');
          await hold(page, 1500);
          await page.getByRole('button', { name: 'Send Request Changes' }).click();
          await hold(page, 3000);
        } else {
          await closeModalIfOpen(page);
        }
      }

      // 4) Reject Payout
      if (await page.locator('table tbody tr').first().isVisible().catch(() => false)) {
        await rowAction(page, 'Reject Payout', 0);
        await expect(
          page.getByRole('heading', { name: /Reject Disbursement|Reject/i }),
        ).toBeVisible({ timeout: 15_000 });
        await page.locator('#notes').fill('Docs video: payout rejected — training example.');
        await hold(page, 1500);
        await page.getByRole('button', { name: 'Confirm Action' }).click();
        await hold(page, 3000);
      }
    }

    await page.getByRole('link', { name: /Analytics/i }).click();
    await hold(page, 3000);

    await signOutFromDashboard(page);
    await hold(page, 1500);
  });

  test('04 Admin Demo walkthrough', async ({ page }) => {
    test.setTimeout(900_000);
    const tag = docsTag();
    await adminPasswordLoginDemo(page);
    await hold(page, 3000);
    await expect(page.getByText(/Demo/i).first()).toBeVisible();

    // --- Projects: create → edit → delete ---
    await page.getByRole('link', { name: /^Projects$/i }).click();
    await expect(page).toHaveURL(/projects/);
    await hold(page, 2000);
    await page.getByRole('button', { name: /Add Project/i }).click();
    await hold(page, 1000);
    // Placeholders are unique to the create form (Modal has no role=dialog)
    await page.getByPlaceholder('Aceolution Portal').fill(`Docs Project ${tag}`);
    await page.getByRole('button', { name: /^Create Project$/i }).click();
    await hold(page, 2500);
    await expect(page.getByText(`Docs Project ${tag}`).first()).toBeVisible({
      timeout: 30_000,
    });

    await rowActionMatching(page, 'Edit', `Docs Project ${tag}`);
    await hold(page, 800);
    let dialog = createDialog(page);
    await expect(dialog.getByRole('heading', { name: /Edit Project/i })).toBeVisible({
      timeout: 15_000,
    });
    await dialog.locator('input.af-input').first().fill(`Docs Project ${tag} Edited`);
    await dialog.getByRole('button', { name: /Save Changes/i }).click();
    await hold(page, 2000);

    await rowActionMatching(page, 'Delete', `Docs Project ${tag} Edited`);
    await page.getByRole('button', { name: /Yes, Delete/i }).click();
    await hold(page, 2000);

    // --- Categories: create → edit → delete ---
    await page.getByRole('link', { name: /^Categories$/i }).click();
    await hold(page, 1500);
    await page.getByRole('button', { name: /Add Category/i }).click();
    await hold(page, 800);
    await page.getByPlaceholder('Travel', { exact: true }).fill(`docs-cat-${tag}`);
    await page.getByPlaceholder('Travel & Lodging').fill(`Docs Category ${tag}`);
    await page.getByRole('button', { name: /^Create Category$/i }).click();
    await hold(page, 2500);
    await expect(page.getByText(`Docs Category ${tag}`).first()).toBeVisible({
      timeout: 30_000,
    });

    await rowActionMatching(page, 'Edit', `Docs Category ${tag}`);
    await hold(page, 800);
    dialog = createDialog(page);
    await dialog.locator('input.af-input').nth(1).fill(`Docs Category ${tag} Edited`);
    await dialog.getByRole('button', { name: /Save Changes/i }).click();
    await hold(page, 2000);

    await rowActionMatching(page, 'Delete', `Docs Category ${tag} Edited`);
    await page.getByRole('button', { name: /Yes, Delete/i }).click();
    await hold(page, 2000);

    // --- Countries: create → edit → delete ---
    await page.getByRole('link', { name: /^Countries$/i }).click();
    await hold(page, 1500);
    await page.getByRole('button', { name: /Add Country/i }).click();
    await hold(page, 800);
    // Short unique name + unused currency code (USD is already taken)
    const countryName = `DocsLand ${tag.slice(-6)}`;
    await page.getByPlaceholder('United Arab Emirates').fill(countryName);
    await page.getByPlaceholder('AED').fill('XDD');
    await page.getByRole('button', { name: /^Create Country$/i }).click();
    await hold(page, 2500);
    // 248 countries — new row is not on page 1; search first
    await page.getByPlaceholder(/Search name or currency/i).fill(countryName);
    await hold(page, 800);
    await expect(page.getByText(countryName).first()).toBeVisible({
      timeout: 30_000,
    });

    await rowActionMatching(page, 'Edit', countryName);
    await hold(page, 800);
    dialog = createDialog(page);
    await dialog.locator('input.af-input').first().fill(`${countryName} Edited`);
    await dialog.getByRole('button', { name: /Save Changes/i }).click();
    await hold(page, 2000);

    await rowActionMatching(page, 'Delete', `${countryName} Edited`);
    await page.getByRole('button', { name: /Yes, Delete/i }).click();
    await hold(page, 2000);

    // --- Users: create → edit → delete ---
    // Full name = letters only. Click project LABEL (React controlled checkbox).
    await page.getByRole('link', { name: /User Management/i }).click();
    await hold(page, 2000);
    await page.getByRole('button', { name: /Add New User/i }).click();
    await hold(page, 1000);
    const userName = 'Docs Walkthrough User';
    const userEmail = `docswt${Date.now().toString().slice(-8)}@acefinance.com`;
    await page.getByPlaceholder('Jane Smith').fill(userName);
    await page.getByPlaceholder('jane@aceolution.com').fill(userEmail);
    await page.locator('select.af-select').first().selectOption('REQUESTER');
    await hold(page, 800);
    // Prefer a known catalog project; fall back to first row in the projects list
    const projectLabel = page
      .locator('div.max-h-40 label')
      .filter({ hasText: /Art and culture|News Lab|GAC|Google/i })
      .first();
    if (await projectLabel.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await projectLabel.click();
    } else {
      await page.locator('div.max-h-40 label').first().click();
    }
    await hold(page, 800);
    await page.getByRole('button', { name: 'Create User' }).click();
    await hold(page, 3500);
    // Clear role filter + search so the new user is visible
    const roleFilter = page.locator('select').filter({ has: page.locator('option', { hasText: 'All Roles' }) }).first();
    if (await roleFilter.isVisible().catch(() => false)) {
      await roleFilter.selectOption({ label: 'All Roles' });
    }
    await page.getByPlaceholder(/Search name or email/i).fill(userName);
    await hold(page, 1000);
    await expect(page.getByText(userName).first()).toBeVisible({ timeout: 30_000 });

    await rowActionMatching(page, 'Edit', userName);
    await hold(page, 1000);
    // Edit form has no Jane Smith placeholder — use first af-input in the modal
    dialog = createDialog(page);
    await expect(dialog.getByRole('heading', { name: /Edit User/i })).toBeVisible({
      timeout: 15_000,
    });
    await dialog.locator('input.af-input').first().fill(`${userName} Edited`);
    const saveUser = dialog.getByRole('button', { name: /^Save Changes$/i });
    await saveUser.scrollIntoViewIfNeeded();
    await saveUser.click();
    await hold(page, 2500);

    await rowActionMatching(page, 'Delete', `${userName} Edited`);
    await page.getByRole('button', { name: /Yes, Delete/i }).click();
    await hold(page, 2500);

    // Oversight panels
    await page.getByRole('link', { name: /^Approver/i }).click();
    await hold(page, 2500);
    await page.getByRole('link', { name: /^Processor/i }).click();
    await hold(page, 2500);

    await signOutFromDashboard(page);
    await hold(page, 1500);
  });
});
