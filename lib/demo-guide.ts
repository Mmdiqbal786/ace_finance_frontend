function withTrailingSlash(url: string): string {
  const trimmed = url.trim().replace(/\/$/, "");
  return trimmed ? `${trimmed}/` : "";
}

/** Live app URL — set NEXT_PUBLIC_APP_URL (e.g. https://finance.aceolution.com). */
export const DEMO_APP_URL = withTrailingSlash(
  process.env.NEXT_PUBLIC_APP_URL || "",
);

/** Live API URL — same as API_URL from NEXT_PUBLIC_API_URL. */
export const DEMO_API_URL = withTrailingSlash(
  process.env.NEXT_PUBLIC_API_URL || "",
);

/** Absolute demo-guide link when APP_URL is set; otherwise same-origin path. */
export const DEMO_GUIDE_URL = DEMO_APP_URL
  ? `${DEMO_APP_URL.replace(/\/$/, "")}/demo-guide/`
  : "/demo-guide/";

export const DEMO_DOCS_URL = "/docs-guide/";
export const DEMO_ARCHITECTURE_URL = "/architecture/";
/** Session unlock flag after access password (demo + docs + present). */
export const DEMO_GUIDE_GATE_KEY = "ace_demo_guide_unlocked";
export const DEMO_GUIDE_GATE_EVENT = "ace-demo-guide-gate";

function notifyDemoGuideGateChange(): void {
  try {
    window.dispatchEvent(new Event(DEMO_GUIDE_GATE_EVENT));
  } catch {
    // ignore
  }
}

export function isDemoGuideUnlocked(): boolean {
  try {
    return sessionStorage.getItem(DEMO_GUIDE_GATE_KEY) === "1";
  } catch {
    return false;
  }
}

const DEMO_ACCESS_CODE_SESSION_KEY = "ace_demo_access_code";

export function unlockDemoGuideAccess(accessCode?: string): void {
  try {
    sessionStorage.setItem(DEMO_GUIDE_GATE_KEY, "1");
    const code = (accessCode || "").trim();
    if (code) {
      sessionStorage.setItem(DEMO_ACCESS_CODE_SESSION_KEY, code);
    }
  } catch {
    // ignore
  }
  notifyDemoGuideGateChange();
}

/** Clear guide access — requires access password again. */
export function lockDemoGuideAccess(): void {
  try {
    sessionStorage.removeItem(DEMO_GUIDE_GATE_KEY);
    sessionStorage.removeItem(DEMO_ACCESS_CODE_SESSION_KEY);
  } catch {
    // ignore
  }
  notifyDemoGuideGateChange();
}

/**
 * Code for `X-Demo-Access-Code` on demo-accounts / demo-login / demo-guide-pack.
 * Only from session after server-verified unlock — never from NEXT_PUBLIC_*.
 */
export function getDemoAccessCodeForApi(): string {
  try {
    const fromSession = sessionStorage.getItem(DEMO_ACCESS_CODE_SESSION_KEY);
    if (fromSession?.trim()) return fromSession.trim();
  } catch {
    // ignore
  }
  return "";
}

export function demoAccessHeaders(): HeadersInit {
  const code = getDemoAccessCodeForApi();
  return code ? { "X-Demo-Access-Code": code } : {};
}

export type DemoAccount = {
  label: string;
  email: string;
  password: string;
  role: string;
  login2fa: string;
  projects: string;
};

export type DemoStaff = {
  name: string;
  email: string;
  password: string;
  role: string;
  projects: string;
  login2fa: string;
};

export type DemoFlowStep = {
  id: string;
  title: string;
  body: string[];
  actions?: { action: string; result: string }[];
  tip?: string;
};

export type DemoGuidePack = {
  primaryAccounts: DemoAccount[];
  demoStaff: DemoStaff[];
};

/** Load test credentials from the API after DEMO_ACCESS_CODE unlock (never baked into JS). */
export async function fetchDemoGuidePack(): Promise<DemoGuidePack> {
  const { API_URL, apiFetch } = await import("./api");
  if (!API_URL) {
    throw new Error("API URL is not configured.");
  }
  const res = await apiFetch(`${API_URL}/auth/demo-guide-pack`, {
    headers: {
      "Content-Type": "application/json",
      ...demoAccessHeaders(),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      Array.isArray(data?.message)
        ? data.message.join(" ")
        : data?.message || "Could not load demo accounts.",
    );
  }
  return {
    primaryAccounts: Array.isArray(data?.primaryAccounts)
      ? data.primaryAccounts
      : [],
    demoStaff: Array.isArray(data?.demoStaff) ? data.demoStaff : [],
  };
}

export const DEMO_SIGN_IN_STEPS = [
  "Open the Frontend → click Dashboard Login / Sign In",
  "Main login is Microsoft-first: Sign in with Microsoft · Demo Access · Use password instead.",
  "Company staff (@aceolution.*): Sign in with Microsoft. Company MFA covers Ace OTP/TOTP. If the same email exists in Live and Demo, choose a workspace — each option shows your role in that store (e.g. Live REQUESTER / Demo ADMIN).",
  "Demos / training: Demo Access loads active isDemo users from the demo database (dynamic). Click a role — demo DB + demo file storage only. Admin can add/remove Demo Access users in Demo workspace → Users.",
  "Admin / legacy / no-Microsoft: Use password instead. Microsoft-linked accounts cannot use password or forgot-password.",
  "After password (or Microsoft) for dual-store accounts: Choose Live or Demo — role is shown on each card. Header/sidebar shows Live or Demo workspace badge.",
  "Primary Gmail OTP test accounts (via password on Live): Email OTP (+ Authenticator when enrolled).",
  "Admin finance@aceolution.com: password → Choose Live/Demo (or Microsoft if that account is Entra-linked). Optional Authenticator in Profile.",
  "You land on /dashboard/ (home). Use the sidebar for your role pages.",
  "Always Sign Out before switching role or workspace.",
  "Project scoping: each Requester/Approver only sees assigned projects. Match requester + approver pairs that share a project.",
];

export const DEMO_FLOW_A_STEPS: DemoFlowStep[] = [
  {
    id: "A1",
    title: "Requester creates expense",
    body: [
      "Login as Requester (Media) → Submit Expense",
      "Project dropdown shows only assigned projects (GAC / GNL for the primary Media requester)",
      "Fill: Country (auto currency) · Project · Category · Local amount · Due date · Description · Invoice file (invoice number/date optional)",
      "Attachment shows PDF/image preview under the field",
      "Submit → Confirm submission modal (review all details + attachment) → Confirm & Submit",
      "System stores USD amount + FX rate + date",
      "Status becomes Pending Approver — only Approvers assigned to that project get the email",
      "Check My Requests and confirmation email",
    ],
    tip: "To demo Systems/Ops projects, use Demo Access (or the matching @acefinance.com personas) for the project-scoped Requester + Approver pair.",
  },
  {
    id: "A2",
    title: "Approver first review — Request Changes",
    body: [
      "Sign out → Login as Approver (password + email OTP)",
      "Open Approver queue → open the request → View details",
      "Confirm you see: USD amount, local amount, FX rate, invoice preview/download, description, due date, history",
      "Choose one action:",
    ],
    actions: [
      { action: "Approve", result: "Moves to Processor queue (Pending Processing). Notes saved." },
      { action: "Reject", result: "Ends workflow (reason required). Requester notified." },
      {
        action: "Request Changes",
        result: "Status → Changes Requested. Command/notes saved. Requester must edit & resubmit.",
      },
    ],
    tip: 'Try this: use Request Changes once (e.g. “Please update description / amount”), then continue the loop below.',
  },
  {
    id: "A3",
    title: "Requester edits & resubmits (only when Changes Requested)",
    body: [
      "Login as Requester → My Requests",
      "Find status Changes Requested → use Edit (Edit is available only in this status)",
      "Update description/amount/invoice as asked → save/resubmit",
      "History adds: Request Details Modified + Resubmitted after Changes",
      "Status returns to Pending Approver · Approver reviews again and can Approve",
      "Requester cannot delete requests. Staff can delete when permitted.",
    ],
  },
  {
    id: "A4",
    title: "Approver approves",
    body: [
      "Login as Approver → open request → Approve (add notes, e.g. “ok”)",
      "Status → Pending Processing (ready for finance)",
      "Processor receives email notification",
    ],
  },
  {
    id: "A5",
    title: "Processor optional return (test control)",
    body: [
      "Login as Processor (password + email OTP) → Processor queue",
      "Optional test: Request Changes",
      "Back to Requester → Changes Requested again",
      "Back to Approver → returns to Approver queue for re-approval",
      "Then bring it back to approved/pending processing before payment",
    ],
  },
  {
    id: "A6",
    title: "Processor payment (full or partial)",
    body: [
      "Login as Processor (password + email OTP) → Processor queue. Options:",
    ],
    actions: [
      {
        action: "Partial Pay",
        result: "Amount < total + receipt + notes → Partially Paid. Remaining balance shown.",
      },
      {
        action: "Mark Paid / Process",
        result: "Pay remaining (or full) + receipt → Processed & Paid.",
      },
      { action: "Reject Payout", result: "Reject with reason; requester notified." },
      {
        action: "Request Changes",
        result: "Send back to Requester or Back to Approver with command/notes.",
      },
    ],
    tip: "Suggested: Partial pay first + receipt → then pay remaining + second receipt. Details should show Total Paid, Remaining $0.00, both receipts, payment history.",
  },
  {
    id: "A7",
    title: "Processor final payment",
    body: [
      "Pay remaining amount · upload second receipt · notes (e.g. “done”)",
      "Status → Processed & Paid · Remaining $0.00",
      "Requester receives “paid” email · both receipts visible in details",
    ],
  },
];

export const DEMO_ROLE_CAPABILITIES = [
  {
    role: "Requester",
    canDo:
      "Dashboard home · Submit Expense (only Admin-assigned projects; multi-currency + FX + invoice) · My Requests (track status, paid/remaining) · Edit/resubmit only when Changes Requested · Profile (name, password, required Authenticator + Change authenticator) · cannot delete own requests · Emails: submitted, rejected, changes requested, paid",
  },
  {
    role: "Approver",
    canDo:
      "Approver queue filtered to assigned projects · Approve / Reject / Request Changes only for those projects · view invoice, FX, notes, history · Analytics & Excel export · Due-soon reminder emails (3-day and 1-day before due) for assigned projects",
  },
  {
    role: "Processor",
    canDo:
      "Processor queue (approved / partially paid) · Full pay + Partial pay with receipts · Reject payout · Request Changes → Requester or Approver · Analytics & Excel · Due-soon reminders for unpaid approved items",
  },
  {
    role: "Admin",
    canDo:
      "Everything above (approver + processor views, all projects) · User Management: create users (welcome email + temp password + force password change), assign one or more projects for Requester/Approver, edit role/active, delete · Categories / Projects / Countries (with currencies) · Full analytics & export",
  },
];

export const DEMO_SECTIONS = [
  { id: "accounts", label: "Test accounts" },
  { id: "sign-in", label: "Sign in" },
  { id: "training-videos", label: "Training videos" },
  { id: "workflow", label: "Full workflow" },
  { id: "audit", label: "Audit trail" },
  { id: "roles", label: "Role capabilities" },
  { id: "status", label: "Status flow" },
  { id: "security", label: "Security" },
  { id: "ui-checks", label: "UI checks" },
] as const;

export const DEMO_SECURITY_FEATURES = [
  "Microsoft Entra sign-in for company staff (Ace OTP/TOTP skipped when Microsoft-linked)",
  "Password login blocked for Microsoft-linked accounts; forgot-password blocked for Microsoft-linked accounts",
  "Live vs Demo isolated MongoDB databases + Azure blob containers (JWT store claim)",
  "Workspace picker when the same email exists in Live and Demo (role shown per store)",
  "Demo Access list is dynamic (isDemo users in demo DB); one-click demo-login",
  "Email OTP at login (password non-admin, non-Microsoft)",
  "Required Authenticator for Requester / Approver / Processor (password path after welcome email)",
  "Optional Authenticator for Admin (password path)",
  "Profile → Change / disable authenticator (password accounts)",
  "Forgot password / reset / first-login set password (password accounts only)",
  "Project scoping: Requester/Approver only submit/approve/email for Admin-assigned projects",
  "Duplicate invoice hard-block: same file hash or invoice # (request not created); potential duplicate warning needs confirm",
];

export const DEMO_UI_CHECKS = [
  "FX line: e.g. 1 EUR = x.xxxxxx USD — date",
  "Change Request History lists all back-and-forth commands (not only the latest)",
  "Payment receipts listed separately with view/download",
  "Excel Change Requests sheet matches the UI history",
  "Submit: attachment preview (PDF/image) under the field, then Confirm submission modal before create",
  "Edit (Changes Requested): Replace attachment optional + Confirm changes before save/resubmit",
  "Demo Access list matches active isDemo users in demo DB (add/remove via Admin → Demo → Users)",
  "Live / Demo workspace badge visible after login when applicable",
];

export const DEMO_AUDIT_CHECKS = [
  "Invoice + all payment receipts (view/download)",
  "Change Request History shows every request-change / return (not only latest)",
  "Approver notes + Processor notes",
  "Workflow timeline: Submitted → Requested Changes → Modified → Resubmitted → Approved → Partially Paid → Paid",
];

export function buildShareInviteText(): string {
  return [
    "Aceolution Finance — Live Demo Access",
    "",
    "Hi,",
    "",
    "You are invited to try the Aceolution Finance live demo.",
    "",
    "How to access:",
    "",
    "1) Open the API (optional health check):",
    DEMO_API_URL,
    "",
    "2) Open the app:",
    DEMO_APP_URL,
    "",
    "3) Open the protected demo guide:",
    DEMO_GUIDE_URL,
    "",
    "4) Access code (enter on the guide page — ask the Aceolution Finance team):",
    "(shared separately — not embedded in the app)",
    "",
    "After unlock you will see test accounts and the full walkthrough.",
    "",
    "Thanks,",
    "Aceolution Finance",
  ].join("\n");
}

export function buildAccountsCopyText(pack: DemoGuidePack): string {
  const lines = ["Test accounts (primary — real inbox OTP)", ""];
  for (const account of pack.primaryAccounts) {
    lines.push(
      account.label,
      `Email: ${account.email}`,
      `Password: ${account.password}`,
      `Login 2FA: ${account.login2fa.replace("*", "")}`,
      `Role: ${account.role}`,
      `Projects: ${account.projects}`,
      ""
    );
  }
  lines.push(
    "Project-scoped demo users (prefer Demo Access on login; list is dynamic from demo DB)",
    ""
  );
  for (const staff of pack.demoStaff) {
    lines.push(
      `${staff.name} — ${staff.email} — ${staff.password} — ${staff.role}`,
      `Login: ${staff.login2fa}`,
      `Projects: ${staff.projects}`,
      ""
    );
  }
  return lines.join("\n");
}

export function buildFullGuideCopyText(pack: DemoGuidePack): string {
  const lines: string[] = [
    "Aceolution Finance — Full Live Demo Guide",
    "Expense Approval & Tracking",
    "",
    "Live URLs",
    `Frontend (App): ${DEMO_APP_URL}`,
    `Backend (API): ${DEMO_API_URL}`,
    "",
    "Note: Hosted on Azure (Static Web Apps + App Service). Use the Frontend URL for the app and the Backend URL for the API.",
    "",
    "1) Test accounts",
    buildAccountsCopyText(pack),
    "",
    "2) How to sign in (important)",
    ...DEMO_SIGN_IN_STEPS.map((step, index) => `${String.fromCharCode(65 + index)}. ${step}`),
    "",
    "3) Complete business flow (do this end-to-end)",
    "FLOW A — Happy path with partial payment",
  ];

  for (const step of DEMO_FLOW_A_STEPS) {
    lines.push("", `${step.id} — ${step.title}`, ...step.body.map((line) => `- ${line}`));
    if (step.actions?.length) {
      for (const action of step.actions) {
        lines.push(`  • ${action.action}: ${action.result}`);
      }
    }
    if (step.tip) lines.push(`Tip: ${step.tip}`);
  }

  lines.push(
    "",
    "FLOW B — Quick reject path (optional second test)",
    "Submit another expense as Requester → Approver Reject (reason required) → status Rejected by Approver · requester notified.",
    "Or approve then Processor Reject Payout → Rejected by Processor.",
    "",
    "4) Verify audit trail (must check)",
    ...DEMO_AUDIT_CHECKS.map((item) => `- ${item}`),
    "Then open Analytics / Tracker → Export Excel and open all sheets: Expense Report · Change Requests · Workflow History · Payment History",
    "",
    "5) Role capabilities (full list)"
  );

  for (const role of DEMO_ROLE_CAPABILITIES) {
    lines.push(`${role.role}: ${role.canDo}`);
  }

  lines.push(
    "",
    "6) Typical status flow",
    "Submitted (Pending Approver)",
    "→ optional Changes Requested → edit → resubmit",
    "→ Approved (Pending Processing)",
    "→ optional Partially Paid",
    "→ Processed & Paid",
    "(or Rejected by Approver / Rejected by Processor)",
    "",
    "7) Security features to try",
    ...DEMO_SECURITY_FEATURES.map((item) => `- ${item}`),
    "",
    "8) What to watch for in the UI",
    ...DEMO_UI_CHECKS.map((item) => `- ${item}`),
    "",
    "Please try the full path above (FLOW A: A1→A7), verify audit + Excel export, and share feedback.",
    "",
    "Thanks,",
    "Aceolution Finance"
  );

  return lines.join("\n");
}

export async function copyPlainText(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}
