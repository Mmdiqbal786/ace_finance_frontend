/** Full app documentation body HTML (screenshots + sections). */
export const DOCS_GUIDE_BODY_HTML = `
<div class="pad" style="background:#203c62;">
        <div class="brand-row">
          <img src="/Ace_logo_small_light.png" alt="" width="44" height="44"
            style="width:44px;height:44px;border-radius:10px;background:#0b1a2e;object-fit:contain;" />
          <div>
            <div class="brand-title">Aceolution <span style="color:#70bcfc;">Finance</span></div>
            <div style="margin-top:2px;font-size:11px;font-weight:600;letter-spacing:0.04em;color:#93c5fd;text-transform:uppercase;">
              Full App Documentation · Real website screenshots
            </div>
          </div>
        </div>
        <div style="font-size:14px;color:#dbeafe;font-weight:600;line-height:1.45;">
          Every login type · every approve / reject / pay path · success &amp; error · captured from the live app UI
        </div>
      </div>

      <div class="pad">
        <p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:#334155;">
          Screenshots below are from the real Aceolution Finance website (not AI mockups).
          Each section lists path, who can access, example steps, success toast, and errors.
        </p>
        <div class="toc">
          <strong style="color:#0f172a;">Contents</strong><br/>
          <a href="#status">1. Status legend &amp; flow</a><br/>
          <a href="#login">2. All login possibilities</a><br/>
          <a href="#login-2fa-methods" style="padding-left:12px;">2a. After password — Email code + Authenticator</a><br/>
          <a href="#first-login-setup" style="padding-left:12px;">2b. First login — Create Password + Set up Authenticator</a><br/>
          <a href="#requester">3. Requester pages (submit, track, edit)</a><br/>
          <a href="#approver">4. Approver — every action</a><br/>
          <a href="#processor">5. Processor — every action</a><br/>
          <a href="#analytics">6. Analytics, details &amp; Excel</a><br/>
          <a href="#profile">7. Profile, password &amp; Authenticator</a><br/>
          <a href="#change-authenticator" style="padding-left:12px;">7a. Change authenticator app</a><br/>
          <a href="#admin">8. Admin pages</a><br/>
          <a href="#emails">9. Emails &amp; attachments</a><br/>
          <a href="#email-requester">9a. Requester emails (inbox screenshots)</a><br/>
          <a href="#email-approver">9b. Approver emails (inbox screenshots)</a><br/>
          <a href="#email-processor">9c. Processor emails (inbox screenshots)</a><br/>
          <a href="#roles">10. Role matrix</a><br/>
          <a href="#errors-gallery">11. Validation &amp; toast gallery</a>
        </div>
      </div>

      <!-- 1 STATUS -->
      <div class="pad-sm" id="status">
        <div class="section-title">1) Status legend &amp; flow</div>
        <div class="scroll-x">
          <table>
            <tr><th>API status</th><th>UI label</th><th>Meaning</th></tr>
            <tr><td><code>PENDING_APPROVER</code></td><td>Awaiting Manager Approval</td><td>Waiting for Approver</td></tr>
            <tr><td><code>CHANGES_REQUESTED</code></td><td>Changes Requested</td><td>Requester must edit &amp; resubmit</td></tr>
            <tr><td><code>APPROVED_APPROVER</code></td><td>Approved - Awaiting Processing</td><td>Ready for payment</td></tr>
            <tr><td><code>PARTIALLY_PAID</code></td><td>Partially Paid</td><td>Remaining &gt; 0</td></tr>
            <tr><td><code>PROCESSED</code></td><td>Disbursed &amp; Paid</td><td>Fully paid</td></tr>
            <tr><td><code>REJECTED_APPROVER</code></td><td>Rejected by Manager</td><td>Terminal</td></tr>
            <tr><td><code>REJECTED_PROCESSOR</code></td><td>Rejected by Finance</td><td>Terminal</td></tr>
          </table>
        </div>
        <div class="status-box">PENDING_APPROVER
→ CHANGES_REQUESTED → edit → resubmit → PENDING_APPROVER
→ APPROVED_APPROVER
→ PARTIALLY_PAID (optional)
→ PROCESSED
or REJECTED_APPROVER / REJECTED_PROCESSOR</div>
      </div>

      <!-- 2 LOGIN -->
      <div class="pad-sm" id="login">
        <div class="section-title">2) All login possibilities</div>
        <p class="meta">Path: <code>/login/</code> · Related: <code>/forgot-password/</code> · <code>/reset-password/</code> · <code>/set-password/</code> · <code>/setup-authenticator/</code></p>

        <figure class="shot">
          <img src="/docs-screenshots/01-landing.png" alt="Landing page" loading="lazy" />
          <figcaption>Landing page — entry to the app</figcaption>
        </figure>

        <figure class="shot">
          <img src="/docs-screenshots/02-login-password.png" alt="Login email password" loading="lazy" />
          <figcaption>Login step 1 — email + password (all roles)</figcaption>
        </figure>

        <div class="block info">
          <h4>Login A — Requester / Approver / Processor (Email OTP + Authenticator)</h4>
          1. Enter email + password → Continue<br/>
          2. App sends 6-digit code to email<br/>
          3. On <strong>Verify Sign In</strong>, choose one method:<br/>
          &nbsp;&nbsp;• <strong>Email code</strong> — code from inbox<br/>
          &nbsp;&nbsp;• <strong>Authenticator</strong> — 6-digit code from the app (shown after authenticator is set up)<br/>
          4. Verify &amp; Sign In<br/>
          5. If first login after welcome email → <code>/set-password/</code> then <code>/setup-authenticator/</code><br/>
          6. If authenticator not set yet → <code>/setup-authenticator/</code> (required)<br/>
          7. Otherwise → role dashboard
        </div>

        <div class="block info" id="login-2fa-methods">
          <h4>2a) After password — Email code + Authenticator tabs</h4>
          When authenticator is enabled, Verify Sign In shows two options on the same screen:<br/>
          <strong>Email code</strong> | <strong>Authenticator</strong> — use either one to finish sign-in (not both).
        </div>
        <figure class="shot">
          <img src="/docs-screenshots/05-login-otp-challenge.png" alt="Email OTP verify screen" loading="lazy" />
          <figcaption>Login step 2 — Email code tab (Requester / Approver / Processor)</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/05c-login-authenticator-challenge.png" alt="Authenticator code verify screen" loading="lazy" />
          <figcaption>Login step 2 — Authenticator tab (same screen; switch Email code ↔ Authenticator)</figcaption>
        </figure>

        <div class="block info">
          <h4>Login B — Admin (password only)</h4>
          Admin has no email OTP by default. Password success goes straight to dashboard. Authenticator is optional for Admin.
        </div>
        <figure class="shot">
          <img src="/docs-screenshots/04-login-admin-dashboard.png" alt="Admin dashboard after login" loading="lazy" />
          <figcaption>Admin login success → Dashboard home</figcaption>
        </figure>

        <div class="block info">
          <h4>Login C — Admin with Authenticator (optional)</h4>
          If Admin enabled TOTP in Profile: after password, enter 6-digit authenticator code (no email OTP).
        </div>

        <div class="block info" id="first-login-setup">
          <h4>2b) First login after welcome email — Create Password + Set up Authenticator</h4>
          Separate gated pages (not the verify tabs above):<br/>
          <strong>1. Create Password</strong> (<code>/set-password/</code>) — replace temporary password<br/>
          <strong>2. Set up Authenticator</strong> (<code>/setup-authenticator/</code>) — scan QR + confirm 6-digit code<br/>
          Then the user reaches the dashboard. Authenticator is required for Requester / Approver / Processor.
        </div>
        <figure class="shot">
          <img src="/docs-screenshots/email-requester-10-welcome.png" alt="Welcome email" loading="lazy" />
          <figcaption>Welcome email — temporary password + sign-in link (starts the flow)</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/28-set-password-first-login.png" alt="First login set password" loading="lazy" />
          <figcaption>Option / step 1 — Create Password (after welcome email / first login)</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/28c-setup-authenticator-required.png" alt="Required authenticator setup" loading="lazy" />
          <figcaption>Option / step 2 — Set up Authenticator (required before dashboard)</figcaption>
        </figure>

        <div class="block ok">
          <h4>Success</h4>
          Token stored → <code>/set-password/</code> (if required) → <code>/setup-authenticator/</code> (non-admin without TOTP) → role dashboard.
        </div>

        <div class="block err">
          <h4>Errors (all login types)</h4>
          • Invalid email or password<br/>
          • Your account has been deactivated<br/>
          • We could not send the verification email…<br/>
          • Enter the 6-digit verification code.<br/>
          • Invalid or expired verification code.<br/>
          • Verification session expired. Please sign in again.<br/>
          • Invalid authenticator code (setup / login TOTP)
        </div>

        <figure class="shot">
          <img src="/docs-screenshots/03-login-error-invalid.png" alt="Invalid login error" loading="lazy" />
          <figcaption>Error example — invalid email or password</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/05b-login-otp-error.png" alt="Invalid OTP error" loading="lazy" />
          <figcaption>Error example — wrong / expired OTP code</figcaption>
        </figure>

        <figure class="shot">
          <img src="/docs-screenshots/06-forgot-password.png" alt="Forgot password page" loading="lazy" />
          <figcaption>Forgot password — request reset link</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/29-reset-password-invalid.png" alt="Reset password invalid link" loading="lazy" />
          <figcaption>Reset password — invalid / expired link error</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/29b-reset-password-missing-token.png" alt="Reset password missing token" loading="lazy" />
          <figcaption>Reset password — missing token</figcaption>
        </figure>
        <div class="block info">
          <h4>Forgot / Reset password</h4>
          Reset link ~1 hour.<br/>
          Success: “Your password has been updated…” / password changed → post-auth destination (authenticator setup if still required).<br/>
          Errors: invalid/expired link · password &lt; 8 chars · need letter+number · passwords do not match · current password incorrect · Enter the temporary password…
        </div>
      </div>

      <!-- 3 REQUESTER -->
      <div class="pad-sm" id="requester">
        <div class="section-title">3) Requester pages</div>
        <p class="meta">Access: <strong>Requester only</strong> · Login: Email OTP</p>

        <figure class="shot">
          <img src="/docs-screenshots/07-requester-dashboard.png" alt="Requester dashboard" loading="lazy" />
          <figcaption>Requester dashboard home</figcaption>
        </figure>

        <div class="block info">
          <h4>Submit Expense · <code>/dashboard/submit-expense/</code></h4>
          Country (currency) · Project · Category · optional invoice number/date · Due Date · Amount · description · attachment → Submit.<br/>
          System stores USD + FX rate/date → status Pending Approver.
        </div>
        <figure class="shot">
          <img src="/docs-screenshots/08-submit-expense.png" alt="Submit expense form" loading="lazy" />
          <figcaption>Submit Expense form (real page)</figcaption>
        </figure>
        <div class="block ok"><h4>Success</h4>Toast: <strong>Expense request submitted.</strong></div>
        <div class="block err">
          <h4>Errors</h4>
          Required selects · amount rules · date rules · description ≤500 · PDF/image max 5 MB · Failed to submit…
        </div>
        <figure class="shot">
          <img src="/docs-screenshots/41-submit-validation-errors.png" alt="Submit validation errors" loading="lazy" />
          <figcaption>Submit Expense — client validation errors when required fields are empty</figcaption>
        </figure>

        <div class="block info">
          <h4>My Requests · <code>/dashboard/my-requests/</code></h4>
          Track status / paid / remaining. <strong>Edit only when Changes Requested</strong> → resubmit.
        </div>
        <figure class="shot">
          <img src="/docs-screenshots/09-my-requests.png" alt="My Requests page" loading="lazy" />
          <figcaption>My Requests tracker</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/30-my-requests-with-changes.png" alt="My Requests Changes Requested" loading="lazy" />
          <figcaption>My Requests — row with status Changes Requested (Edit available)</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/31a-edit-menu-open.png" alt="Edit menu" loading="lazy" />
          <figcaption>Open row menu → Edit (only for Changes Requested)</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/31-edit-resubmit-modal.png" alt="Edit and resubmit modal" loading="lazy" />
          <figcaption>Edit Expense Request modal — save/resubmit after changes</figcaption>
        </figure>
        <div class="block ok"><h4>Success (resubmit)</h4>Toast: <strong>Changes saved — request resubmitted for approval.</strong></div>
        <div class="block err"><h4>Errors</h4>You can only edit after staff requested changes · same field validations · Failed to update expense</div>
      </div>

      <!-- 4 APPROVER -->
      <div class="pad-sm" id="approver">
        <div class="section-title">4) Approver — every possible action</div>
        <p class="meta">Path: <code>/dashboard/approver/</code> · Access: Approver + Admin · Login: Email OTP (Approver)</p>

        <figure class="shot">
          <img src="/docs-screenshots/10-approver-queue.png" alt="Approver queue" loading="lazy" />
          <figcaption>Approver queue — pending expenses</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/11-approver-actions-menu.png" alt="Approver action menu" loading="lazy" />
          <figcaption>Row actions menu: Approve · Reject · View · Request Changes · Delete</figcaption>
        </figure>

        <div class="scroll-x">
          <table>
            <tr><th>Action</th><th>Result status</th><th>Success toast</th></tr>
            <tr><td><strong>Approve</strong></td><td>Approved - Awaiting Processing</td><td>Expense approved.</td></tr>
            <tr><td><strong>Reject</strong></td><td>Rejected by Manager</td><td>Expense rejected.</td></tr>
            <tr><td><strong>Request Changes</strong></td><td>Changes Requested</td><td>Changes requested — requester can edit and resubmit.</td></tr>
            <tr><td><strong>View</strong></td><td>(no status change)</td><td>Opens Expense Details &amp; Audit</td></tr>
            <tr><td><strong>Delete</strong> (staff)</td><td>Removed</td><td>Expense deleted.</td></tr>
          </table>
        </div>

        <figure class="shot">
          <img src="/docs-screenshots/13-approver-approve-modal.png" alt="Approve action on approver panel" loading="lazy" />
          <figcaption>Approve path — open from Approver panel</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/14-approver-reject-modal.png" alt="Reject expense modal" loading="lazy" />
          <figcaption>Reject Expense modal — reason required</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/42-reject-validation-error.png" alt="Reject validation" loading="lazy" />
          <figcaption>Reject — validation when reason is missing / too short</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/15-approver-request-changes-modal.png" alt="Request changes modal" loading="lazy" />
          <figcaption>Request Changes modal — notes required (≥5 chars)</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/35-expense-details-audit.png" alt="Expense details audit" loading="lazy" />
          <figcaption>View — Expense Details &amp; Audit (invoice, FX, history)</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/36-approve-modal-detail.png" alt="Approve modal" loading="lazy" />
          <figcaption>Approve modal — notes optional, confirm approval</figcaption>
        </figure>

        <div class="block ex">
          <h4>Example — full loop</h4>
          Request Changes (“Please update description”) → Requester edits → Approve (“ok”) → goes to Processor.
        </div>
        <div class="block err">
          <h4>Errors</h4>
          Rejection/change notes required (≥5, ≤500) · Cannot approve/reject when status is wrong · Action failed
        </div>
      </div>

      <!-- 5 PROCESSOR -->
      <div class="pad-sm" id="processor">
        <div class="section-title">5) Processor — every possible action</div>
        <p class="meta">Path: <code>/dashboard/processor/</code> · Access: Processor + Admin · Login: Email OTP (Processor)</p>

        <figure class="shot">
          <img src="/docs-screenshots/16-processor-queue.png" alt="Processor queue" loading="lazy" />
          <figcaption>Processor queue — approved / partially paid</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/17-processor-actions-menu.png" alt="Processor actions menu" loading="lazy" />
          <figcaption>Processor row actions menu</figcaption>
        </figure>

        <div class="scroll-x">
          <table>
            <tr><th>Action</th><th>Result</th><th>Success toast</th></tr>
            <tr><td><strong>Partial Pay</strong></td><td>Partially Paid (or Processed if clears remaining)</td><td>Partial payment of $X recorded. · or · Final payment recorded — expense fully paid.</td></tr>
            <tr><td><strong>Process / Mark Paid</strong></td><td>Disbursed &amp; Paid</td><td>Expense marked as fully paid.</td></tr>
            <tr><td><strong>Reject Payout</strong></td><td>Rejected by Finance</td><td>Expense rejected.</td></tr>
            <tr><td><strong>Request Changes → Requester</strong></td><td>Changes Requested</td><td>Changes requested — requester can edit and resubmit.</td></tr>
            <tr><td><strong>Request Changes → Approver</strong></td><td>Pending Approver</td><td>Expense returned to approver queue.</td></tr>
          </table>
        </div>

        <figure class="shot">
          <img src="/docs-screenshots/18-processor-partial-pay-modal.png" alt="Partial payment modal" loading="lazy" />
          <figcaption>Record Partial Payment — amount ≤ remaining + receipt required</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/19-processor-full-pay-modal.png" alt="Full pay modal" loading="lazy" />
          <figcaption>Full pay / Process modal — receipt required</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/20-processor-reject-modal.png" alt="Processor reject modal" loading="lazy" />
          <figcaption>Processor Reject Payout modal</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/21-processor-request-changes-modal.png" alt="Processor request changes" loading="lazy" />
          <figcaption>Processor Request Changes (Requester or Approver)</figcaption>
        </figure>

        <div class="block err">
          <h4>Errors</h4>
          Payment receipt required · amount &gt; 0 and ≤ remaining · Cannot request changes after a partial payment · wrong status · Partial payment failed / Action failed
        </div>
      </div>

      <!-- 6 ANALYTICS -->
      <div class="pad-sm" id="analytics">
        <div class="section-title">6) Analytics &amp; Excel export</div>
        <p class="meta">Path: <code>/dashboard/analytics/</code> · Approver + Processor + Admin</p>
        <figure class="shot">
          <img src="/docs-screenshots/22-analytics.png" alt="Analytics page" loading="lazy" />
          <figcaption>Analytics &amp; Tracker — filter, details, Export Excel</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/37-analytics-full.png" alt="Analytics full" loading="lazy" />
          <figcaption>Analytics full page with data</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/39-analytics-expense-details.png" alt="Analytics expense details" loading="lazy" />
          <figcaption>Expense details opened from Analytics</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/38-export-clicked-toast.png" alt="Excel export toast" loading="lazy" />
          <figcaption>After Export — toast / download feedback</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/38b-export-workbook-example.png" alt="Exported Excel workbook opened in Microsoft Excel" loading="lazy" />
          <figcaption>Real Excel export — AceolutionFinance_Report opened in Microsoft Excel (Expense Report · Change Requests · Workflow History · Payment History)</figcaption>
        </figure>
        <div class="block ok">
          <h4>Success</h4>
          Toast: <strong>Report downloaded.</strong><br/>
          Sheets: Expense Report · Change Requests · Workflow History · Payment History
        </div>
        <div class="block err"><h4>Errors</h4>No data available to export. · Failed to open/download invoice or receipt</div>
      </div>

      <!-- 7 PROFILE -->
      <div class="pad-sm" id="profile">
        <div class="section-title">7) Profile, password &amp; Authenticator</div>
        <p class="meta">Path: <code>/dashboard/profile/</code> · All roles · Authenticator <strong>required</strong> for Requester / Approver / Processor · <strong>optional</strong> for Admin</p>
        <figure class="shot">
          <img src="/docs-screenshots/32-profile-full.png" alt="Profile page" loading="lazy" />
          <figcaption>Profile — details, change password, authenticator (required for non-admin)</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/32d-profile-authenticator-enabled.png" alt="Authenticator enabled on profile" loading="lazy" />
          <figcaption>Authenticator section — enabled + Change authenticator app</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/32b-profile-edit-mode.png" alt="Edit profile" loading="lazy" />
          <figcaption>Edit Profile mode — update name</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/40-toast-profile-success.png" alt="Profile success toast" loading="lazy" />
          <figcaption>Success toast after profile update</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/32c-password-validation-errors.png" alt="Password validation" loading="lazy" />
          <figcaption>Change Password — validation errors</figcaption>
        </figure>

        <div class="block info">
          <h4>Authenticator — required (non-admin) / optional (Admin)</h4>
          Non-admin must enroll after welcome email / login if missing (<code>/setup-authenticator/</code>).<br/>
          Admin may enable from Profile. Non-admin cannot disable authenticator.
        </div>
        <figure class="shot">
          <img src="/docs-screenshots/28c-setup-authenticator-required.png" alt="Setup authenticator page" loading="lazy" />
          <figcaption>Setup Authenticator page — QR + Confirm &amp; Continue (gated before dashboard)</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/33-totp-setup-qr.png" alt="Authenticator QR setup" loading="lazy" />
          <figcaption>Authenticator QR + manual secret (setup page or Profile first-time enable)</figcaption>
        </figure>

        <div class="block info" id="change-authenticator">
          <h4>7a) Change authenticator app (replace — all roles with TOTP on)</h4>
          Profile → <strong>Change authenticator app</strong> → current password + email code → new QR → Confirm &amp; Replace.<br/>
          Confirming <strong>deletes the old secret</strong> — previous authenticator entries stop working. Authenticator stays required (never turns off for non-admin).
        </div>
        <figure class="shot">
          <img src="/docs-screenshots/34-totp-change-authenticator.png" alt="Change authenticator on profile" loading="lazy" />
          <figcaption>Profile — Change authenticator app (password + email code, then new QR)</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/email-requester-11-change-authenticator.png" alt="Change authenticator email" loading="lazy" />
          <figcaption>Email — code to change / replace authenticator</figcaption>
        </figure>

        <div class="block info">
          <h4>Disable Authenticator (Admin only)</h4>
          Requires current password + email code. Non-admin roles cannot disable — use Change authenticator instead.<br/>
          Success: Authenticator app disabled. · Admin becomes password-only again.
        </div>
        <div class="block ok">
          <h4>Success</h4>
          Profile updated successfully. · Password changed successfully. · Authenticator app enabled. · Authenticator replaced… · Authenticator app disabled. · Email code sent.
        </div>
        <div class="block err">
          <h4>Errors</h4>
          Failed to load profile · invalid authenticator code · wrong password · SMTP fail on email code · weak password rules · Current password is incorrect · Authenticator is required… cannot be disabled
        </div>
      </div>

      <!-- 8 ADMIN -->
      <div class="pad-sm" id="admin">
        <div class="section-title">8) Admin pages</div>
        <p class="meta">Access: <strong>Admin only</strong> · Login: password only (or TOTP if enabled)</p>

        <figure class="shot">
          <img src="/docs-screenshots/24-admin-users.png" alt="User management" loading="lazy" />
          <figcaption>User Management — create / edit / delete</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/44-admin-create-user-modal.png" alt="Create user modal" loading="lazy" />
          <figcaption>Create User modal — welcome email + temp password + force password change</figcaption>
        </figure>
        <div class="block ok">
          <h4>Users — Success</h4>
          User created — welcome email… · User updated successfully! · User deleted.
        </div>
        <div class="block err"><h4>Users — Errors</h4>User with email … already exists · Failed to create/update/delete · Access denied</div>

        <figure class="shot">
          <img src="/docs-screenshots/25-admin-categories.png" alt="Categories" loading="lazy" />
          <figcaption>Categories catalog</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/45-admin-create-category-modal.png" alt="Create category" loading="lazy" />
          <figcaption>Create Category modal</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/26-admin-projects.png" alt="Projects" loading="lazy" />
          <figcaption>Projects catalog</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/27-admin-countries.png" alt="Countries" loading="lazy" />
          <figcaption>Countries / currencies (drives FX)</figcaption>
        </figure>
        <div class="block ok"><h4>Catalogs — Success</h4>{Singular} created/updated successfully! · {Singular} deleted.</div>
      </div>

      <!-- 9 EMAILS -->
      <div class="pad-sm" id="emails">
        <div class="section-title">9) Emails &amp; attachments</div>
        <div class="scroll-x">
          <table>
            <tr><th>When</th><th>Who</th></tr>
            <tr><td>Login OTP (non-admin)</td><td>That user</td></tr>
            <tr><td>Submit / resubmit</td><td>Requester + Approvers</td></tr>
            <tr><td>Approve</td><td>Processors</td></tr>
            <tr><td>Reject (approver/processor)</td><td>Requester</td></tr>
            <tr><td>Request changes / return to approver</td><td>Requester or Approvers</td></tr>
            <tr><td>Fully paid</td><td>Requester</td></tr>
            <tr><td>Due in 3 days / due tomorrow (daily cron)</td><td>Approvers / Processors</td></tr>
            <tr><td>Welcome / reset / change TOTP / disable TOTP</td><td>That user</td></tr>
          </table>
        </div>
        <div class="block info">
          <h4>Attachments</h4>
          Invoice + payment receipts: PDF / JPG / PNG / WEBP / GIF · max <strong>5 MB</strong>. Partial payments do not email until fully paid.
        </div>
      </div>

      <!-- 9a REQUESTER EMAILS -->
      <div class="pad-sm" id="email-requester">
        <div class="section-title">9a) Requester emails — real Gmail screenshots</div>
        <p class="meta">
          Real inbox screenshots for the <strong>Requester</strong> role.
        </p>

        <div class="block info">
          <h4>When Requester receives email</h4>
          Login OTP · Welcome (new account) · Password reset · Expense submitted · Changes requested ·
          Rejected by Approver · Rejected by Processor · Expense paid · Disable authenticator code
        </div>

        <figure class="shot">
          <img src="/docs-screenshots/email-requester-01-login-otp.png" alt="Login OTP email" loading="lazy" />
          <figcaption>Login — “Your Aceolution Finance sign-in code” (6-digit OTP, expires ~10 minutes)</figcaption>
        </figure>

        <figure class="shot">
          <img src="/docs-screenshots/email-requester-10-welcome.png" alt="Welcome email" loading="lazy" />
          <figcaption>Welcome — new account created (email + temporary password + role + must set password)</figcaption>
        </figure>

        <figure class="shot">
          <img src="/docs-screenshots/email-requester-08-password-reset.png" alt="Password reset email" loading="lazy" />
          <figcaption>Forgot password — “Reset your Aceolution Finance password” (Set New Password, link expires 1 hour)</figcaption>
        </figure>

        <figure class="shot">
          <img src="/docs-screenshots/email-requester-05-expense-submitted.png" alt="Expense submitted email" loading="lazy" />
          <figcaption>Submit Expense — “Expense request submitted” (awaiting approver) + View My Requests</figcaption>
        </figure>

        <figure class="shot">
          <img src="/docs-screenshots/email-requester-02-changes-requested.png" alt="Changes requested email" loading="lazy" />
          <figcaption>Changes requested — edit &amp; resubmit from My Requests (includes staff notes)</figcaption>
        </figure>

        <figure class="shot">
          <img src="/docs-screenshots/email-requester-06-changes-requested-alt.png" alt="Changes requested email alt" loading="lazy" />
          <figcaption>Changes requested — another example with notes</figcaption>
        </figure>

        <figure class="shot">
          <img src="/docs-screenshots/email-requester-07-rejected-by-approver.png" alt="Rejected by approver email" loading="lazy" />
          <figcaption>Rejected by Approver — reason in Notes + View My Requests</figcaption>
        </figure>

        <figure class="shot">
          <img src="/docs-screenshots/email-requester-09-rejected-by-processor.png" alt="Rejected by processor email" loading="lazy" />
          <figcaption>Rejected by Processor — reason in Notes + View My Requests</figcaption>
        </figure>

        <figure class="shot">
          <img src="/docs-screenshots/email-requester-04-expense-paid.png" alt="Expense paid email" loading="lazy" />
          <figcaption>Fully paid — “Expense paid” confirmation + View My Requests</figcaption>
        </figure>

        <figure class="shot">
          <img src="/docs-screenshots/email-requester-03-disable-authenticator.png" alt="Disable authenticator email" loading="lazy" />
          <figcaption>Disable Authenticator — email code (Admin only)</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/email-requester-11-change-authenticator.png" alt="Change authenticator email" loading="lazy" />
          <figcaption>Change authenticator — email code (replace flow; old secret deleted on confirm)</figcaption>
        </figure>
      </div>

      <!-- 9b APPROVER EMAILS -->
      <div class="pad-sm" id="email-approver">
        <div class="section-title">9b) Approver emails — real Gmail screenshots</div>
        <p class="meta">
          Real inbox screenshots for the <strong>Approver</strong> role.
        </p>

        <div class="block info">
          <h4>When Approver receives email</h4>
          New expense awaiting approval · Expense returned for re-approval (from Processor) · Due tomorrow reminder (still pending)
        </div>

        <figure class="shot">
          <img src="/docs-screenshots/email-approver-01-new-expense-awaiting.png" alt="New expense awaiting approval email" loading="lazy" />
          <figcaption>New expense awaiting approval — Open Approver Queue</figcaption>
        </figure>

        <figure class="shot">
          <img src="/docs-screenshots/email-approver-02-returned-for-reapproval.png" alt="Returned for re-approval email" loading="lazy" />
          <figcaption>Expense returned for re-approval — Processor sent back with notes</figcaption>
        </figure>

        <figure class="shot">
          <img src="/docs-screenshots/email-approver-03-due-tomorrow-reminder.png" alt="Due tomorrow reminder email" loading="lazy" />
          <figcaption>Reminder: expense due tomorrow — still awaiting approval (1 day left)</figcaption>
        </figure>
      </div>

      <!-- 9c PROCESSOR EMAILS -->
      <div class="pad-sm" id="email-processor">
        <div class="section-title">9c) Processor emails — real Gmail screenshots</div>
        <p class="meta">
          Real inbox screenshots for the <strong>Processor</strong> role.
        </p>

        <div class="block info">
          <h4>When Processor receives email</h4>
          Expense approved — ready for payment · Reminder: approved expense due tomorrow (still unpaid)
        </div>

        <figure class="shot">
          <img src="/docs-screenshots/email-processor-01-approved-ready-for-payment.png" alt="Approved ready for payment email" loading="lazy" />
          <figcaption>Expense approved — ready for payment — Open Processor Queue</figcaption>
        </figure>

        <figure class="shot">
          <img src="/docs-screenshots/email-processor-02-due-tomorrow-reminder.png" alt="Processor due tomorrow reminder" loading="lazy" />
          <figcaption>Reminder: approved expense due tomorrow — still awaiting payment (1 day left)</figcaption>
        </figure>
      </div>

      <!-- 10 ROLES -->
      <div class="pad-sm" id="roles">
        <div class="section-title">10) Role capability matrix</div>
        <div class="scroll-x">
          <table>
            <tr><th>Capability</th><th>Requester</th><th>Approver</th><th>Processor</th><th>Admin</th></tr>
            <tr><td>Submit / My Requests</td><td>Yes</td><td>—</td><td>—</td><td>—</td></tr>
            <tr><td>Approve / Reject / Request Changes</td><td>—</td><td>Yes</td><td>—</td><td>Yes</td></tr>
            <tr><td>Pay / Partial / Reject payout</td><td>—</td><td>—</td><td>Yes</td><td>Yes</td></tr>
            <tr><td>Analytics &amp; Excel</td><td>—</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
            <tr><td>Users / Catalogs</td><td>—</td><td>—</td><td>—</td><td>Yes</td></tr>
            <tr><td>Profile / change password</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
            <tr><td>Authenticator required</td><td>Yes</td><td>Yes</td><td>Yes</td><td>No (optional)</td></tr>
            <tr><td>Change authenticator (replace)</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
            <tr><td>Disable authenticator</td><td>—</td><td>—</td><td>—</td><td>Yes</td></tr>
            <tr><td>Login email OTP</td><td>Yes</td><td>Yes</td><td>Yes</td><td>No*</td></tr>
          </table>
        </div>
        <p class="meta">*Admin password-only unless Authenticator enabled in Profile. Non-admin: Email OTP + required Authenticator after enrollment.</p>
      </div>

      <!-- 11 GALLERY -->
      <div class="pad-sm" id="errors-gallery">
        <div class="section-title">11) Validation &amp; toast gallery (extra)</div>
        <p class="meta">Quick visual reference for common success/error UI from the real app.</p>
        <figure class="shot">
          <img src="/docs-screenshots/03-login-error-invalid.png" alt="Login error" loading="lazy" />
          <figcaption>Login error — invalid credentials</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/05b-login-otp-error.png" alt="OTP error" loading="lazy" />
          <figcaption>OTP error — invalid / expired code</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/41-submit-validation-errors.png" alt="Submit errors" loading="lazy" />
          <figcaption>Submit validation errors</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/42-reject-validation-error.png" alt="Reject errors" loading="lazy" />
          <figcaption>Reject validation errors</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/32c-password-validation-errors.png" alt="Password errors" loading="lazy" />
          <figcaption>Password change validation errors</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/40-toast-profile-success.png" alt="Success toast" loading="lazy" />
          <figcaption>Success toast example</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/38-export-clicked-toast.png" alt="Export toast" loading="lazy" />
          <figcaption>Export Excel toast / feedback</figcaption>
        </figure>
        <figure class="shot">
          <img src="/docs-screenshots/43-processor-menu-all-actions.png" alt="Processor all actions" loading="lazy" />
          <figcaption>Processor — all row actions visible</figcaption>
        </figure>
      </div>

      <div class="pad-footer">
        <p style="margin:0 0 10px;font-size:14px;color:#334155;line-height:1.6;">
          Demo walkthrough + test accounts:
          <a href="/demo-guide/"><strong>Live Demo Guide</strong></a>.<br/>
          Refresh screenshots from local app:<br/>
          <code>node scripts/capture-docs-auth.cjs</code> (password + authenticator)<br/>
          <code>node scripts/capture-docs-refresh.cjs</code><br/>
          <code>node scripts/capture-docs-screenshots.cjs</code><br/>
          <code>node scripts/capture-docs-screenshots-gaps.cjs</code><br/>
          <code>node scripts/capture-docs-extra.cjs</code>
        </p>
        <p style="margin:0;font-size:15px;color:#0f172a;">
          Thanks,<br/><strong style="color:#203c62;">Aceolution Finance</strong>
        </p>
      </div>

      <div style="background:#203c62;padding:14px 16px;text-align:center;font-size:12px;color:#93c5fd;">
        Real website screenshots · every login · every approve / reject / pay path
      </div>
    </div>
`;
