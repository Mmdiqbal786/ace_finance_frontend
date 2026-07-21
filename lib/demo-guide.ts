export const DEMO_APP_URL = "https://ace-finance-frontend.onrender.com/";
export const DEMO_API_URL = "https://ace-finance-backend.onrender.com/";
export const DEMO_GUIDE_URL = "https://ace-finance-frontend.onrender.com/demo-guide/";
export const DEMO_ACCESS_CODE = "Aceolution_2024";
export const DEMO_DOCS_URL = "/docs-guide/";

export type DemoAccount = {
  label: string;
  email: string;
  password: string;
  role: string;
  login2fa: string;
};

export type DemoStaff = {
  name: string;
  email: string;
  password: string;
  role: string;
};

export type DemoFlowStep = {
  id: string;
  title: string;
  body: string[];
  actions?: { action: string; result: string }[];
  tip?: string;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: "Requester",
    email: "iqbal.ace786@gmail.com",
    password: "Aceolution_2024",
    role: "Submit & track expenses",
    login2fa: "Email OTP",
  },
  {
    label: "Approver",
    email: "iqbal.dev98@gmail.com",
    password: "Approver@1234",
    role: "Approve / reject / request changes",
    login2fa: "Email OTP",
  },
  {
    label: "Processor",
    email: "mmdiqbal786@gmail.com",
    password: "Processor@1234",
    role: "Pay / partial pay / request changes",
    login2fa: "Email OTP",
  },
  {
    label: "Admin",
    email: "admin@acefinance.com",
    password: "Admin@1234",
    role: "Users, catalogs, full access",
    login2fa: "Password only*",
  },
];

export const DEMO_EXTRA_STAFF: DemoStaff[] = [
  {
    name: "Sarah Johnson",
    email: "sarah.approver@acefinance.com",
    password: "Approver@1234",
    role: "APPROVER",
  },
  {
    name: "David Lee",
    email: "david.approver@acefinance.com",
    password: "Approver@1234",
    role: "APPROVER",
  },
  {
    name: "Priya Sharma",
    email: "priya.processor@acefinance.com",
    password: "Processor@1234",
    role: "PROCESSOR",
  },
];

export const DEMO_SIGN_IN_STEPS = [
  "Open the Frontend → click Dashboard Login / Sign In",
  "Enter email + password for a test account",
  "Requester / Approver / Processor: after password is accepted, the app sends a 6-digit verification code to that user’s email. Enter the code to finish sign-in (2FA). Use Resend if needed.",
  "Admin: password only (no email OTP by default). Admin can optionally enable an Authenticator app later in Profile.",
  "You land on /dashboard/ (home). Use the sidebar for your role pages.",
  "Always Sign Out before switching to another role account.",
];

export const DEMO_FLOW_A_STEPS: DemoFlowStep[] = [
  {
    id: "A1",
    title: "Requester creates expense",
    body: [
      "Login as Requester → Submit Expense",
      "Fill: Country (auto currency) · Project · Category · Local amount · Due date · Description · Invoice file (invoice number/date optional)",
      "Submit → system stores USD amount + FX rate + date",
      "Status becomes Pending Approver",
      "Check My Requests and confirmation email",
    ],
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
      "Dashboard home · Submit Expense (multi-currency + FX + invoice) · My Requests (track status, paid/remaining) · Edit/resubmit only when Changes Requested · Profile (name, password, optional Authenticator) · cannot delete own requests · Emails: submitted, rejected, changes requested, paid",
  },
  {
    role: "Approver",
    canDo:
      "Approver queue (pending count) · Approve / Reject / Request Changes · view invoice, FX, notes, history · Analytics & Excel export · Due-soon reminder emails (3-day and 1-day before due)",
  },
  {
    role: "Processor",
    canDo:
      "Processor queue (approved / partially paid) · Full pay + Partial pay with receipts · Reject payout · Request Changes → Requester or Approver · Analytics & Excel · Due-soon reminders for unpaid approved items",
  },
  {
    role: "Admin",
    canDo:
      "Everything above (approver + processor views) · User Management: create users (welcome email + temp password + force password change), edit role/active, delete · Categories / Projects / Countries (with currencies) · Full analytics & export",
  },
];

export const DEMO_SECTIONS = [
  { id: "accounts", label: "Test accounts" },
  { id: "sign-in", label: "Sign in" },
  { id: "workflow", label: "Full workflow" },
  { id: "audit", label: "Audit trail" },
  { id: "roles", label: "Role capabilities" },
  { id: "status", label: "Status flow" },
  { id: "security", label: "Security" },
  { id: "ui-checks", label: "UI checks" },
] as const;

export const DEMO_SECURITY_FEATURES = [
  "Email OTP at login (non-admin)",
  "Profile → Authenticator App (optional TOTP)",
  "Disable authenticator with password + email code (works if phone app was reinstalled)",
  "Forgot password / reset password / first-login set password",
];

export const DEMO_UI_CHECKS = [
  "FX line: e.g. 1 EUR = x.xxxxxx USD — date",
  "Change Request History lists all back-and-forth commands (not only the latest)",
  "Payment receipts listed separately with view/download",
  "Excel Change Requests sheet matches the UI history",
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
    "1) Wake backend first (wait up to ~50 seconds if sleeping):",
    DEMO_API_URL,
    "",
    "2) Open the app:",
    DEMO_APP_URL,
    "",
    "3) Open the protected demo guide:",
    DEMO_GUIDE_URL,
    "",
    "4) Access code (enter on the guide page):",
    DEMO_ACCESS_CODE,
    "",
    "After unlock you will see test accounts and the full walkthrough.",
    "",
    "Thanks,",
    "Aceolution Finance",
  ].join("\n");
}

export function buildAccountsCopyText(): string {
  const lines = ["Test accounts", ""];
  for (const account of DEMO_ACCOUNTS) {
    lines.push(
      account.label,
      `Email: ${account.email}`,
      `Password: ${account.password}`,
      `Login 2FA: ${account.login2fa.replace("*", "")}`,
      `Role: ${account.role}`,
      ""
    );
  }
  lines.push("Optional extra staff", "");
  for (const staff of DEMO_EXTRA_STAFF) {
    lines.push(`${staff.name} — ${staff.email} — ${staff.password} — ${staff.role}`);
  }
  return lines.join("\n");
}

export function buildFullGuideCopyText(): string {
  const lines: string[] = [
    "Aceolution Finance — Full Live Demo Guide",
    "Expense Approval & Tracking",
    "",
    "Live URLs",
    `Frontend (App): ${DEMO_APP_URL}`,
    `Backend (API): ${DEMO_API_URL}`,
    "",
    "Note: The backend is on Render’s free tier and may sleep after inactivity. Open the Backend URL once first (wait until it loads — up to ~50 seconds), then use the Frontend.",
    "",
    "1) Test accounts",
    buildAccountsCopyText(),
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
    ...DEMO_AUDIT_CHECKS.map((item) => `✓ ${item}`),
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
