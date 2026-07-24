/** Full SOP slide deck — mirrors /docs-guide/ (all pages, role flows, emails). Shared by present mode + PowerPoint. */

export type SopSlideKind = "title" | "agenda" | "section" | "content";

export type SopSlide = {
  id: string;
  kind: SopSlideKind;
  title: string;
  subtitle?: string;
  bullets?: string[];
  /** Path under public/, e.g. /docs-screenshots/08-submit-expense.png */
  image?: string;
  notes?: string;
};

export const SOP_PRESENTATION_TITLE = "Aceolution Finance — Full App SOP";
export const SOP_PPTX_FILENAME = "Aceolution-Finance-SOP.pptx";

const shot = (file: string) => `/docs-screenshots/${file}`;

export const SOP_SLIDES: SopSlide[] = [
  // ═══════════════════════════════════════════════
  // OPENING
  // ═══════════════════════════════════════════════
  {
    id: "title",
    kind: "title",
    title: "Aceolution Finance",
    subtitle: "Full App SOP · Real website screenshots · Every role · Every path",
    bullets: [
      "Login · MFA · Forgot password · First-time setup",
      "Requester · Approver · Processor · Admin — complete flows",
      "Emails, analytics, profile, validation gallery",
    ],
  },
  {
    id: "agenda",
    kind: "agenda",
    title: "Agenda — full documentation map",
    bullets: [
      "1. Status legend & expense lifecycle",
      "2. Landing, login types & password reset",
      "3. Requester flow — home → submit → track → edit",
      "4. Approver flow — every action",
      "5. Processor flow — every action",
      "6. Analytics, details & Excel",
      "7. Profile, password & Authenticator",
      "8. Admin flow — users & catalogs",
      "9. Emails by role (Requester / Approver / Processor)",
      "10. Role matrix",
      "11. Validation & toast gallery",
    ],
  },
  {
    id: "how-to-read",
    kind: "content",
    title: "How this deck is organized",
    bullets: [
      "Same coverage as /docs-guide/ — not a summary-only deck",
      "Flows are role-by-role: Requester → Approver → Processor → Admin",
      "Each screenshot slide = one real UI capture from the live app",
      "Present mode: ← → / Space · F fullscreen · Esc exit",
      "Download PowerPoint uses this exact slide list",
    ],
  },

  // ═══════════════════════════════════════════════
  // 1 STATUS
  // ═══════════════════════════════════════════════
  {
    id: "sec-status",
    kind: "section",
    title: "1) Status legend & flow",
    subtitle: "API status → UI label → meaning",
  },
  {
    id: "status-table",
    kind: "content",
    title: "Status mapping",
    bullets: [
      "PENDING_APPROVER → Awaiting Manager Approval",
      "CHANGES_REQUESTED → Requester must edit & resubmit",
      "APPROVED_APPROVER → Approved - Awaiting Processing",
      "PARTIALLY_PAID → Remaining > 0",
      "PROCESSED → Disbursed & Paid (fully paid)",
      "REJECTED_APPROVER → Rejected by Manager (terminal)",
      "REJECTED_PROCESSOR → Rejected by Finance (terminal)",
    ],
  },
  {
    id: "status-flow",
    kind: "content",
    title: "Expense lifecycle (happy + branch paths)",
    bullets: [
      "Submit → PENDING_APPROVER",
      "Approver: Approve → APPROVED_APPROVER | Reject → REJECTED_APPROVER | Request Changes → CHANGES_REQUESTED",
      "Requester edits after Changes Requested → resubmit → PENDING_APPROVER",
      "Processor: Partial Pay → PARTIALLY_PAID | Full Pay → PROCESSED",
      "Processor: Reject → REJECTED_PROCESSOR | Request Changes → Requester or back to Approver",
    ],
  },

  // ═══════════════════════════════════════════════
  // 2 LOGIN
  // ═══════════════════════════════════════════════
  {
    id: "sec-login",
    kind: "section",
    title: "2) All login possibilities",
    subtitle: "/login/ · /forgot-password/ · /set-password/ · /setup-authenticator/",
  },
  {
    id: "landing",
    kind: "content",
    title: "Landing page — entry to the app",
    image: shot("01-landing.png"),
    bullets: ["Public home · path into Sign in / demo"],
  },
  {
    id: "login-password",
    kind: "content",
    title: "Login step 1 — email + password (all roles)",
    image: shot("02-login-password.png"),
    bullets: [
      "Path: /login/",
      "Continue → next step depends on role & MFA settings",
    ],
  },
  {
    id: "login-a-flow",
    kind: "content",
    title: "Login A — Requester / Approver / Processor",
    bullets: [
      "1. Email + password → Continue",
      "2. App sends 6-digit Email OTP",
      "3. Verify Sign In: Email code OR Authenticator (either one)",
      "4. First login after welcome → /set-password/ then /setup-authenticator/",
      "5. If TOTP missing → /setup-authenticator/ (required)",
      "6. Else → role dashboard",
      "Demo isDemo users: password only (no Email OTP / Authenticator)",
    ],
  },
  {
    id: "login-otp",
    kind: "content",
    title: "Login step 2 — Email code tab",
    image: shot("05-login-otp-challenge.png"),
    bullets: [
      "Requester / Approver / Processor",
      "Same Verify Sign In screen as Authenticator tab",
    ],
  },
  {
    id: "login-totp",
    kind: "content",
    title: "Login step 2 — Authenticator tab",
    image: shot("05c-login-authenticator-challenge.png"),
    bullets: [
      "Switch Email code ↔ Authenticator on the same screen",
      "Use either method — not both",
    ],
  },
  {
    id: "login-b-admin",
    kind: "content",
    title: "Login B — Admin (password only by default)",
    image: shot("04-login-admin-dashboard.png"),
    bullets: [
      "No email OTP by default",
      "Password success → Admin dashboard home",
      "Authenticator optional for Admin",
    ],
  },
  {
    id: "login-c-admin-totp",
    kind: "content",
    title: "Login C — Admin with Authenticator (optional)",
    bullets: [
      "If Admin enabled TOTP in Profile:",
      "After password → enter 6-digit authenticator code",
      "No email OTP for Admin",
    ],
  },
  {
    id: "sec-first-login",
    kind: "section",
    title: "2b) First login setup",
    subtitle: "Welcome email → Create Password → Set up Authenticator",
  },
  {
    id: "welcome-email",
    kind: "content",
    title: "Welcome email — temporary password",
    image: shot("email-requester-10-welcome.png"),
    bullets: ["Starts first-login flow · temp password + sign-in link"],
  },
  {
    id: "set-password",
    kind: "content",
    title: "Create Password — /set-password/",
    image: shot("28-set-password-first-login.png"),
    bullets: ["Replace temporary password after welcome email"],
  },
  {
    id: "setup-totp-required",
    kind: "content",
    title: "Set up Authenticator — required before dashboard",
    image: shot("28c-setup-authenticator-required.png"),
    bullets: [
      "Path: /setup-authenticator/",
      "Required for Requester / Approver / Processor",
      "Scan QR + confirm 6-digit code",
    ],
  },
  {
    id: "login-errors",
    kind: "content",
    title: "Login errors — invalid credentials",
    image: shot("03-login-error-invalid.png"),
    bullets: [
      "Invalid email or password",
      "Also: deactivated account · SMTP fail · session expired",
    ],
  },
  {
    id: "otp-error",
    kind: "content",
    title: "OTP error — wrong / expired code",
    image: shot("05b-login-otp-error.png"),
    bullets: ["Enter the 6-digit verification code · Invalid or expired"],
  },
  {
    id: "forgot-password",
    kind: "content",
    title: "Forgot password — request reset link",
    image: shot("06-forgot-password.png"),
    bullets: ["Path: /forgot-password/ · Reset link ~1 hour"],
  },
  {
    id: "reset-invalid",
    kind: "content",
    title: "Reset password — invalid / expired link",
    image: shot("29-reset-password-invalid.png"),
    bullets: ["Path: /reset-password/"],
  },
  {
    id: "reset-missing",
    kind: "content",
    title: "Reset password — missing token",
    image: shot("29b-reset-password-missing-token.png"),
    bullets: [
      "Password rules: ≥8 chars · letter + number · passwords must match",
    ],
  },

  // ═══════════════════════════════════════════════
  // 3 REQUESTER FLOW
  // ═══════════════════════════════════════════════
  {
    id: "sec-requester",
    kind: "section",
    title: "3) Requester flow",
    subtitle: "Home → Submit → My Requests → Edit & resubmit",
  },
  {
    id: "requester-overview",
    kind: "content",
    title: "Requester — who & access",
    bullets: [
      "Access: Requester only",
      "Login: Email OTP + Authenticator (real) · isDemo: password only",
      "Project-scoped: only assigned projects in Submit dropdown",
      "If no projects assigned → contact Admin",
      "Pages: Dashboard · Submit Expense · My Requests · Profile",
    ],
  },
  {
    id: "requester-home",
    kind: "content",
    title: "Requester dashboard home",
    image: shot("07-requester-dashboard.png"),
    bullets: ["Landing after successful login for Requester role"],
  },
  {
    id: "submit-steps",
    kind: "content",
    title: "Submit Expense — step list",
    bullets: [
      "Path: /dashboard/submit-expense/",
      "1. Country (currency) · Project · Category · optional invoice #/date · Due · Amount · Description",
      "2. Attachment required (PDF/image, max 5 MB) → inline preview",
      "3. Submit Expense Request → client validation",
      "4. Confirm submission modal (full summary + preview)",
      "5. Confirm & Submit → Pending Approver",
      "Only Approvers assigned to that project get email / queue item",
    ],
  },
  {
    id: "submit-form",
    kind: "content",
    title: "Submit Expense form",
    image: shot("08-submit-expense.png"),
    bullets: ["Filled fields + attachment area"],
  },
  {
    id: "submit-preview",
    kind: "content",
    title: "Attachment preview (before submit)",
    image: shot("08b-submit-attachment-preview.png"),
    bullets: ["Image thumbnail or embedded PDF under Attachment"],
  },
  {
    id: "submit-confirm",
    kind: "content",
    title: "Confirm submission modal",
    image: shot("08c-submit-confirm-modal.png"),
    bullets: [
      "Review all details + attachment",
      "Cancel → form · Confirm & Submit → create request",
      "Success toast: Expense request submitted + Expense ID",
    ],
  },
  {
    id: "submit-validation",
    kind: "content",
    title: "Submit — validation errors",
    image: shot("41-submit-validation-errors.png"),
    bullets: [
      "Required selects · amount/date rules · description ≤500",
      "PDF/image max 5 MB · no projects assigned",
    ],
  },
  {
    id: "my-requests",
    kind: "content",
    title: "My Requests tracker",
    image: shot("09-my-requests.png"),
    bullets: [
      "Path: /dashboard/my-requests/",
      "Track status / paid / remaining",
      "Edit only when status = Changes Requested",
    ],
  },
  {
    id: "my-requests-changes",
    kind: "content",
    title: "My Requests — Changes Requested",
    image: shot("30-my-requests-with-changes.png"),
    bullets: ["Edit available on this status only"],
  },
  {
    id: "edit-menu",
    kind: "content",
    title: "Row menu → Edit",
    image: shot("31a-edit-menu-open.png"),
    bullets: ["Open row actions · Edit (Changes Requested)"],
  },
  {
    id: "edit-steps",
    kind: "content",
    title: "Edit & resubmit — step list",
    bullets: [
      "1. Change allowed fields (email locked for Requesters)",
      "2. Current invoice: View / Download",
      "3. Replace attachment optional → preview · or keep current",
      "4. Save Changes → Confirm changes summary",
      "5. Confirm & Resubmit → Pending Approver again",
      "Success: Changes saved — request resubmitted for approval",
    ],
  },
  {
    id: "edit-modal",
    kind: "content",
    title: "Edit Expense Request modal",
    image: shot("31-edit-resubmit-modal.png"),
    bullets: ["Fields + Current invoice + Replace attachment"],
  },
  {
    id: "edit-replace",
    kind: "content",
    title: "Replace attachment + preview",
    image: shot("31b-edit-replace-preview.png"),
    bullets: ["New file preview · Clear new file to discard"],
  },
  {
    id: "edit-confirm",
    kind: "content",
    title: "Confirm changes & resubmit",
    image: shot("31c-edit-confirm-modal.png"),
    bullets: [
      "Shows new file (will replace) or keeping existing",
      "Cancel → edit form · Confirm & Resubmit → save",
    ],
  },

  // ═══════════════════════════════════════════════
  // 4 APPROVER FLOW
  // ═══════════════════════════════════════════════
  {
    id: "sec-approver",
    kind: "section",
    title: "4) Approver flow — every action",
    subtitle: "/dashboard/approver/ · project-scoped queue & emails",
  },
  {
    id: "approver-overview",
    kind: "content",
    title: "Approver — who & access",
    bullets: [
      "Access: Approver + Admin",
      "Login: Email OTP + Authenticator (Approver)",
      "Queue / emails / due-soon reminders = assigned projects only",
      "Actions: Approve · Reject · Request Changes · View · Delete (staff)",
    ],
  },
  {
    id: "approver-queue",
    kind: "content",
    title: "Approver queue — pending expenses",
    image: shot("10-approver-queue.png"),
    bullets: ["Only expenses for assigned projects"],
  },
  {
    id: "approver-menu",
    kind: "content",
    title: "Approver row actions menu",
    image: shot("11-approver-actions-menu.png"),
    bullets: ["Approve · Reject · View · Request Changes · Delete"],
  },
  {
    id: "approver-action-table",
    kind: "content",
    title: "Approver actions → result",
    bullets: [
      "Approve → Approved - Awaiting Processing · toast: Expense approved",
      "Reject → Rejected by Manager · toast: Expense rejected",
      "Request Changes → Changes Requested · requester can edit",
      "View → Expense Details & Audit (no status change)",
      "Delete (staff) → Removed · Expense deleted",
    ],
  },
  {
    id: "approver-approve",
    kind: "content",
    title: "Approve path",
    image: shot("13-approver-approve-modal.png"),
    bullets: ["Open from Approver panel"],
  },
  {
    id: "approver-approve-detail",
    kind: "content",
    title: "Approve modal — notes optional",
    image: shot("36-approve-modal-detail.png"),
    bullets: ["Confirm approval → Processor queue + email"],
  },
  {
    id: "approver-reject",
    kind: "content",
    title: "Reject Expense — reason required",
    image: shot("14-approver-reject-modal.png"),
    bullets: ["Terminal for requester · reason ≥5 chars"],
  },
  {
    id: "approver-reject-val",
    kind: "content",
    title: "Reject — validation error",
    image: shot("42-reject-validation-error.png"),
    bullets: ["Missing / too short reason"],
  },
  {
    id: "approver-changes",
    kind: "content",
    title: "Request Changes — notes required",
    image: shot("15-approver-request-changes-modal.png"),
    bullets: ["≥5 chars · Requester edits & resubmits"],
  },
  {
    id: "approver-view",
    kind: "content",
    title: "View — Expense Details & Audit",
    image: shot("35-expense-details-audit.png"),
    bullets: ["Invoice · FX · description · history"],
  },
  {
    id: "approver-loop",
    kind: "content",
    title: "Example — full Approver loop",
    bullets: [
      "Request Changes (“Please update description”)",
      "→ Requester edits & resubmits",
      "→ Approve (“ok”)",
      "→ Goes to Processor",
    ],
  },

  // ═══════════════════════════════════════════════
  // 5 PROCESSOR FLOW
  // ═══════════════════════════════════════════════
  {
    id: "sec-processor",
    kind: "section",
    title: "5) Processor flow — every action",
    subtitle: "/dashboard/processor/ · pay · reject · request changes",
  },
  {
    id: "processor-overview",
    kind: "content",
    title: "Processor — who & access",
    bullets: [
      "Access: Processor + Admin",
      "Login: Email OTP + Authenticator",
      "Sees approved / partially paid (all projects — not project-scoped)",
      "Partial Pay · Full Pay · Reject · Request Changes → Requester or Approver",
    ],
  },
  {
    id: "processor-queue",
    kind: "content",
    title: "Processor queue",
    image: shot("16-processor-queue.png"),
    bullets: ["Approved / partially paid expenses"],
  },
  {
    id: "processor-menu",
    kind: "content",
    title: "Processor row actions menu",
    image: shot("17-processor-actions-menu.png"),
    bullets: ["All payment and return actions"],
  },
  {
    id: "processor-menu-all",
    kind: "content",
    title: "Processor — all row actions visible",
    image: shot("43-processor-menu-all-actions.png"),
    bullets: ["Reference shot of full action set"],
  },
  {
    id: "processor-action-table",
    kind: "content",
    title: "Processor actions → result",
    bullets: [
      "Partial Pay → Partially Paid (or Processed if clears remaining)",
      "Process / Mark Paid → Disbursed & Paid",
      "Reject Payout → Rejected by Finance",
      "Request Changes → Requester → Changes Requested",
      "Request Changes → Approver → Pending Approver",
    ],
  },
  {
    id: "processor-partial",
    kind: "content",
    title: "Record Partial Payment",
    image: shot("18-processor-partial-pay-modal.png"),
    bullets: [
      "Amount ≤ remaining · payment receipt required",
      "Partial payments do not email until fully paid",
    ],
  },
  {
    id: "processor-full",
    kind: "content",
    title: "Full pay / Process — receipt required",
    image: shot("19-processor-full-pay-modal.png"),
    bullets: ["Clears remaining · Status → Fully Paid · emails Requester"],
  },
  {
    id: "processor-reject",
    kind: "content",
    title: "Processor Reject Payout",
    image: shot("20-processor-reject-modal.png"),
    bullets: ["Reason required · Rejected by Finance"],
  },
  {
    id: "processor-changes",
    kind: "content",
    title: "Processor Request Changes",
    image: shot("21-processor-request-changes-modal.png"),
    bullets: [
      "Send to Requester OR return to Approver",
      "Cannot request changes after a partial payment",
    ],
  },

  // ═══════════════════════════════════════════════
  // 6 ANALYTICS
  // ═══════════════════════════════════════════════
  {
    id: "sec-analytics",
    kind: "section",
    title: "6) Analytics, details & Excel",
    subtitle: "/dashboard/analytics/ · Approver + Processor + Admin",
  },
  {
    id: "analytics",
    kind: "content",
    title: "Analytics & Tracker",
    image: shot("22-analytics.png"),
    bullets: ["Filter · details · Export Excel"],
  },
  {
    id: "analytics-full",
    kind: "content",
    title: "Analytics full page with data",
    image: shot("37-analytics-full.png"),
    bullets: ["Role-aware totals and filters"],
  },
  {
    id: "analytics-details",
    kind: "content",
    title: "Expense details from Analytics",
    image: shot("39-analytics-expense-details.png"),
    bullets: ["Open any row for full audit view"],
  },
  {
    id: "export-toast",
    kind: "content",
    title: "Export Excel — toast feedback",
    image: shot("38-export-clicked-toast.png"),
    bullets: ["Toast: Report downloaded"],
  },
  {
    id: "export-workbook",
    kind: "content",
    title: "Excel workbook — AceolutionFinance_Report",
    image: shot("38b-export-workbook-example.png"),
    bullets: [
      "Sheets: Expense Report · Change Requests · Workflow History · Payment History",
    ],
  },

  // ═══════════════════════════════════════════════
  // 7 PROFILE
  // ═══════════════════════════════════════════════
  {
    id: "sec-profile",
    kind: "section",
    title: "7) Profile, password & Authenticator",
    subtitle: "/dashboard/profile/ · all roles",
  },
  {
    id: "profile",
    kind: "content",
    title: "Profile page",
    image: shot("32-profile-full.png"),
    bullets: [
      "Details · change password · authenticator",
      "Authenticator required for non-admin · optional for Admin",
    ],
  },
  {
    id: "profile-totp-on",
    kind: "content",
    title: "Authenticator enabled + Change app",
    image: shot("32d-profile-authenticator-enabled.png"),
    bullets: ["Non-admin cannot disable — use Change authenticator"],
  },
  {
    id: "profile-edit",
    kind: "content",
    title: "Edit Profile — update name",
    image: shot("32b-profile-edit-mode.png"),
    bullets: ["Success toast after save"],
  },
  {
    id: "profile-toast",
    kind: "content",
    title: "Profile success toast",
    image: shot("40-toast-profile-success.png"),
    bullets: ["Profile updated successfully"],
  },
  {
    id: "password-val",
    kind: "content",
    title: "Change Password — validation errors",
    image: shot("32c-password-validation-errors.png"),
    bullets: ["Weak password · mismatch · wrong current password"],
  },
  {
    id: "totp-setup-page",
    kind: "content",
    title: "Setup Authenticator page (gated)",
    image: shot("28c-setup-authenticator-required.png"),
    bullets: ["QR + Confirm & Continue before dashboard"],
  },
  {
    id: "totp-qr",
    kind: "content",
    title: "Authenticator QR + manual secret",
    image: shot("33-totp-setup-qr.png"),
    bullets: ["Setup page or Profile first-time enable"],
  },
  {
    id: "sec-change-totp",
    kind: "section",
    title: "7a) Change authenticator app",
    subtitle: "Replace flow — old secret deleted on confirm",
  },
  {
    id: "change-totp",
    kind: "content",
    title: "Change authenticator — Profile",
    image: shot("34-totp-change-authenticator.png"),
    bullets: [
      "Current password + email code → new QR → Confirm & Replace",
      "Previous authenticator entries stop working",
    ],
  },
  {
    id: "change-totp-email",
    kind: "content",
    title: "Change authenticator — email code",
    image: shot("email-requester-11-change-authenticator.png"),
    bullets: ["Code for replace flow"],
  },
  {
    id: "disable-totp",
    kind: "content",
    title: "Disable Authenticator — Admin only",
    bullets: [
      "Requires current password + email code",
      "Non-admin cannot disable",
      "Success: Admin becomes password-only again",
    ],
  },

  // ═══════════════════════════════════════════════
  // 8 ADMIN FLOW
  // ═══════════════════════════════════════════════
  {
    id: "sec-admin",
    kind: "section",
    title: "8) Admin flow",
    subtitle: "Users · Categories · Projects · Countries",
  },
  {
    id: "admin-overview",
    kind: "content",
    title: "Admin — who & access",
    bullets: [
      "Access: Admin only",
      "Login: password only (or TOTP if enabled in Profile)",
      "Pages: Dashboard · Users · Categories · Projects · Countries · Approver/Processor queues · Analytics · Profile",
      "Not project-scoped for viewing; assigns projects to Requesters & Approvers",
    ],
  },
  {
    id: "admin-users",
    kind: "content",
    title: "User Management",
    image: shot("24-admin-users.png"),
    bullets: ["Create / edit / delete users"],
  },
  {
    id: "admin-create-user",
    kind: "content",
    title: "Create User modal",
    image: shot("44-admin-create-user-modal.png"),
    bullets: [
      "Welcome email + temp password + force password change",
      "Requester/Approver: assign one or more projects (required)",
      "isDemo badge: password-only demo personas",
    ],
  },
  {
    id: "admin-projects-rules",
    kind: "content",
    title: "Project assignment rules",
    bullets: [
      "Requester: submit only assigned projects",
      "Approver: queue / emails / reminders only for assigned projects",
      "Admin & Processor: not project-scoped",
      "Users with no projects → no project access until Admin assigns",
    ],
  },
  {
    id: "admin-categories",
    kind: "content",
    title: "Categories catalog",
    image: shot("25-admin-categories.png"),
    bullets: ["Master data for expense categories"],
  },
  {
    id: "admin-create-category",
    kind: "content",
    title: "Create Category modal",
    image: shot("45-admin-create-category-modal.png"),
    bullets: ["Add / edit category"],
  },
  {
    id: "admin-projects",
    kind: "content",
    title: "Projects catalog",
    image: shot("26-admin-projects.png"),
    bullets: ["Projects used in submit + assignment"],
  },
  {
    id: "admin-countries",
    kind: "content",
    title: "Countries / currencies (FX)",
    image: shot("27-admin-countries.png"),
    bullets: ["Drives currency + FX conversion on submit"],
  },

  // ═══════════════════════════════════════════════
  // 9 EMAILS
  // ═══════════════════════════════════════════════
  {
    id: "sec-emails",
    kind: "section",
    title: "9) Emails & attachments",
    subtitle: "Who gets what · attachment rules",
  },
  {
    id: "email-matrix",
    kind: "content",
    title: "Email matrix — when / who",
    bullets: [
      "Login OTP (non-admin) → that user",
      "Submit / resubmit → Requester + Approvers (assigned)",
      "Approve → Processors",
      "Reject (approver/processor) → Requester",
      "Request changes / return to approver → Requester or Approvers",
      "Fully paid → Requester",
      "Due in 3 days / due tomorrow (cron) → Approvers / Processors",
      "Welcome / reset / change TOTP / disable TOTP → that user",
    ],
  },
  {
    id: "attachment-rules",
    kind: "content",
    title: "Attachments",
    bullets: [
      "Invoice + payment receipts: PDF / JPG / PNG / WEBP / GIF",
      "Max 5 MB",
      "Partial payments do not email until fully paid",
    ],
  },

  // 9a Requester emails
  {
    id: "sec-email-requester",
    kind: "section",
    title: "9a) Requester emails",
    subtitle: "Real Gmail inbox screenshots",
  },
  {
    id: "er-otp",
    kind: "content",
    title: "Requester — Login OTP email",
    image: shot("email-requester-01-login-otp.png"),
    bullets: ["6-digit sign-in code · expires ~10 minutes"],
  },
  {
    id: "er-welcome",
    kind: "content",
    title: "Requester — Welcome email",
    image: shot("email-requester-10-welcome.png"),
    bullets: ["Temp password · role · must set password"],
  },
  {
    id: "er-reset",
    kind: "content",
    title: "Requester — Password reset email",
    image: shot("email-requester-08-password-reset.png"),
    bullets: ["Set New Password · link expires 1 hour"],
  },
  {
    id: "er-submitted",
    kind: "content",
    title: "Requester — Expense submitted",
    image: shot("email-requester-05-expense-submitted.png"),
    bullets: ["Awaiting approver · View My Requests"],
  },
  {
    id: "er-changes",
    kind: "content",
    title: "Requester — Changes requested",
    image: shot("email-requester-02-changes-requested.png"),
    bullets: ["Edit & resubmit · includes staff notes"],
  },
  {
    id: "er-changes-alt",
    kind: "content",
    title: "Requester — Changes requested (alt)",
    image: shot("email-requester-06-changes-requested-alt.png"),
    bullets: ["Another example with notes"],
  },
  {
    id: "er-rej-appr",
    kind: "content",
    title: "Requester — Rejected by Approver",
    image: shot("email-requester-07-rejected-by-approver.png"),
    bullets: ["Reason in Notes · View My Requests"],
  },
  {
    id: "er-rej-proc",
    kind: "content",
    title: "Requester — Rejected by Processor",
    image: shot("email-requester-09-rejected-by-processor.png"),
    bullets: ["Reason in Notes · View My Requests"],
  },
  {
    id: "er-paid",
    kind: "content",
    title: "Requester — Expense paid",
    image: shot("email-requester-04-expense-paid.png"),
    bullets: ["Fully paid confirmation"],
  },
  {
    id: "er-disable",
    kind: "content",
    title: "Requester — Disable authenticator code",
    image: shot("email-requester-03-disable-authenticator.png"),
    bullets: ["Admin-only disable flow"],
  },
  {
    id: "er-change-totp",
    kind: "content",
    title: "Requester — Change authenticator code",
    image: shot("email-requester-11-change-authenticator.png"),
    bullets: ["Replace flow email code"],
  },

  // 9b Approver emails
  {
    id: "sec-email-approver",
    kind: "section",
    title: "9b) Approver emails",
    subtitle: "Assigned-project notifications",
  },
  {
    id: "ea-new",
    kind: "content",
    title: "Approver — New expense awaiting",
    image: shot("email-approver-01-new-expense-awaiting.png"),
    bullets: ["Open Approver Queue"],
  },
  {
    id: "ea-return",
    kind: "content",
    title: "Approver — Returned for re-approval",
    image: shot("email-approver-02-returned-for-reapproval.png"),
    bullets: ["Processor sent back with notes"],
  },
  {
    id: "ea-due",
    kind: "content",
    title: "Approver — Due tomorrow reminder",
    image: shot("email-approver-03-due-tomorrow-reminder.png"),
    bullets: ["Still awaiting approval · 1 day left"],
  },

  // 9c Processor emails
  {
    id: "sec-email-processor",
    kind: "section",
    title: "9c) Processor emails",
    subtitle: "Payment queue notifications",
  },
  {
    id: "ep-ready",
    kind: "content",
    title: "Processor — Approved ready for payment",
    image: shot("email-processor-01-approved-ready-for-payment.png"),
    bullets: ["Open Processor Queue"],
  },
  {
    id: "ep-due",
    kind: "content",
    title: "Processor — Due tomorrow reminder",
    image: shot("email-processor-02-due-tomorrow-reminder.png"),
    bullets: ["Approved expense still unpaid · 1 day left"],
  },

  // ═══════════════════════════════════════════════
  // 10 ROLE MATRIX
  // ═══════════════════════════════════════════════
  {
    id: "sec-roles",
    kind: "section",
    title: "10) Role capability matrix",
    subtitle: "Who can do what",
  },
  {
    id: "roles-matrix",
    kind: "content",
    title: "Capabilities by role",
    bullets: [
      "Submit / My Requests → Requester only",
      "Approve / Reject / Request Changes → Approver + Admin",
      "Pay / Partial / Reject payout → Processor + Admin",
      "Analytics & Excel → Approver + Processor + Admin",
      "Users / Catalogs → Admin only",
      "Project-scoped submit/approve → assigned only · Processor pays all",
      "Authenticator required → Requester/Approver/Processor · Admin optional",
      "Disable authenticator → Admin only",
      "Login email OTP → non-admin (Admin password-only unless TOTP on)",
    ],
  },

  // ═══════════════════════════════════════════════
  // 11 GALLERY
  // ═══════════════════════════════════════════════
  {
    id: "sec-gallery",
    kind: "section",
    title: "11) Validation & toast gallery",
    subtitle: "Quick visual reference",
  },
  {
    id: "gal-login",
    kind: "content",
    title: "Gallery — Login error",
    image: shot("03-login-error-invalid.png"),
    bullets: ["Invalid credentials"],
  },
  {
    id: "gal-otp",
    kind: "content",
    title: "Gallery — OTP error",
    image: shot("05b-login-otp-error.png"),
    bullets: ["Invalid / expired code"],
  },
  {
    id: "gal-submit",
    kind: "content",
    title: "Gallery — Submit validation",
    image: shot("41-submit-validation-errors.png"),
    bullets: ["Required fields empty"],
  },
  {
    id: "gal-reject",
    kind: "content",
    title: "Gallery — Reject validation",
    image: shot("42-reject-validation-error.png"),
    bullets: ["Reason missing / too short"],
  },
  {
    id: "gal-password",
    kind: "content",
    title: "Gallery — Password validation",
    image: shot("32c-password-validation-errors.png"),
    bullets: ["Change password rules"],
  },
  {
    id: "gal-toast",
    kind: "content",
    title: "Gallery — Success toast",
    image: shot("40-toast-profile-success.png"),
    bullets: ["Sticky success feedback"],
  },
  {
    id: "gal-export",
    kind: "content",
    title: "Gallery — Export toast",
    image: shot("38-export-clicked-toast.png"),
    bullets: ["Excel download feedback"],
  },

  // ═══════════════════════════════════════════════
  // CLOSE
  // ═══════════════════════════════════════════════
  {
    id: "closing",
    kind: "title",
    title: "Thank you",
    subtitle: "Aceolution Finance · Full App SOP",
    bullets: [
      "Long-form docs: /docs-guide/",
      "Present this deck: /docs-guide/present/",
      "Live demo guide: /demo-guide/",
    ],
  },
];
