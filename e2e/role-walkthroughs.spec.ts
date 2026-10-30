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
  dismissStickyToast,
  docsTag,
  fillExpenseForm,
  goSubmitExpense,
  rowAction,
  rowActionMatching,
  submitExpenseSuccess,
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
  test.setTimeout(600_000);

  test('01 Requester Demo walkthrough', async ({ page }) => {
    await demoAccessLogin(page, DEMO_REQUESTER);
    await hold(page, 3000);
    await expect(page.getByText(/Demo/i).first()).toBeVisible();

    // --- Error: submit without attachment ---
    await goSubmitExpense(page);
    await clearExpenseNotices(page);
    await clickSubmitExpenseRequest(page);
    await hold(page, 2500);
    await expect(
      page.getByText(/fix|attachment|required|highlighted/i).first(),
    ).toBeVisible({ timeout: 10_000 });
    await hold(page, 2500);

    // --- Error: disallowed file type ---
    const badFile = writeBadTextFixture();
    const errTag = docsTag();
    await fillExpenseForm(page, {
      tag: errTag,
      amount: '18.50',
      invoicePath: badFile,
    });
    // Browser / input accept may block .txt — if file not selected, show note via hold
    await clickSubmitExpenseRequest(page);
    await hold(page, 3000);

    // --- Success submit (unique amount so soft-dup is only vs THIS expense) ---
    const successTag = docsTag();
    const sharedAmount = `${(50 + Math.floor(Math.random() * 40)).toFixed(0)}.${String(Date.now()).slice(-2)}`;
    const success = await submitExpenseSuccess(page, {
      tag: successTag,
      amount: sharedAmount,
    });
    // submitExpenseSuccess already clicks Dismiss on the sticky toast

    // --- Hard duplicate: same invoice FILE hash (new invoice #) ---
    await fillExpenseForm(page, {
      tag: docsTag(),
      amount: '55.00',
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
    // Sticky toast: "Duplicate invoice detected…" — must click Dismiss (same as success)
    await expect(
      page.getByText(/Duplicate invoice( file)? detected/i).first(),
    ).toBeVisible({ timeout: 90_000 });
    await hold(page, 2500);
    await dismissStickyToast(page);

    // --- Soft / potential duplicate: new file + new invoice #, same fuzzy triple ---
    const softTag = `SOFT-${docsTag()}`;
    await fillExpenseForm(page, {
      tag: softTag,
      amount: sharedAmount,
      invoicePath: uniqueInvoicePath(softTag),
      invoiceNumber: softTag,
      reuseLastCatalogs: true,
    });
    await clickSubmitExpenseRequest(page);

    const softHeading = page.getByRole('heading', {
      name: /Potential Duplicate Detected/i,
    });
    const confirmHeading = page.getByRole('heading', { name: /Confirm submission/i });
    const hardDupText = page.getByText(/Duplicate invoice( file| number)? detected/i).first();
    await expect(softHeading.or(confirmHeading).or(hardDupText)).toBeVisible({
      timeout: 90_000,
    });

    if (await hardDupText.isVisible().catch(() => false)) {
      // Unexpected hard block on soft demo — still Dismiss for the video, then continue
      await hold(page, 2500);
      await dismissStickyToast(page);
    } else if (await confirmHeading.isVisible().catch(() => false)) {
      await confirmSubmissionModal(page);
      const successText = page.getByText(/Expense request submitted/i).first();
      await expect(softHeading.or(successText).or(hardDupText)).toBeVisible({
        timeout: 90_000,
      });
    }

    if (await softHeading.isVisible().catch(() => false)) {
      await hold(page, 3000);
      await page.getByText(/I confirm this is a separate/i).click();
      await hold(page, 1500);
      await page.getByRole('button', { name: /Confirm & Submit Expense/i }).click();
      await expect(page.getByText(/Expense request submitted/i).first()).toBeVisible({
        timeout: 120_000,
      });
      await hold(page, 2000);
      await dismissStickyToast(page);
    } else if (await page.getByText(/Expense request submitted/i).first().isVisible().catch(() => false)) {
      await hold(page, 2000);
      await dismissStickyToast(page);
    } else {
      await clearExpenseNotices(page);
    }

    // --- Extra success (unique amount) for Approver queue ---
    await submitExpenseSuccess(page, {
      tag: docsTag(),
      amount: `${(70 + Math.random() * 20).toFixed(2)}`,
    });

    await page.getByRole('link', { name: 'My Requests', exact: true }).click();
    await expect(page).toHaveURL(/my-requests/);
    await hold(page, 3500);
    // Tag may appear in description/invoice columns or be paginated — table rows are enough for the video
    const tagCell = page.getByText(successTag).first();
    if (await tagCell.isVisible({ timeout: 15_000 }).catch(() => false)) {
      await hold(page, 2500);
    } else {
      await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 30_000 });
      await hold(page, 2500);
    }

    await page.getByRole('link', { name: 'Dashboard', exact: true }).first().click();
    await hold(page, 2000);
    await signOutFromDashboard(page);
    await hold(page, 1500);
  });

  test('02 Approver Demo walkthrough', async ({ page }) => {
    await demoAccessLogin(page, DEMO_APPROVER);
    await hold(page, 3000);

    await page.getByRole('link', { name: /^Approver/i }).click();
    await expect(page).toHaveURL(/approver/);
    await hold(page, 3000);

    // 1) Approve
    await rowAction(page, 'Approve', 0);
    await expect(page.getByRole('heading', { name: /Approve Expense/i })).toBeVisible({
      timeout: 15_000,
    });
    await page.locator('#notes').fill('Docs video: approved for payment.');
    await hold(page, 1500);
    await page.getByRole('button', { name: 'Confirm Action' }).click();
    await hold(page, 3000);

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
