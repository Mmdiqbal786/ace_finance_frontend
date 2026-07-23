"use client";

import { useState } from "react";
import { toast } from "../../lib/toast";
import {
  DEMO_ACCOUNTS,
  DEMO_API_URL,
  DEMO_APP_URL,
  DEMO_AUDIT_CHECKS,
  DEMO_DOCS_URL,
  DEMO_EXTRA_STAFF,
  DEMO_FLOW_A_STEPS,
  DEMO_ROLE_CAPABILITIES,
  DEMO_SECTIONS,
  DEMO_SECURITY_FEATURES,
  DEMO_SIGN_IN_STEPS,
  DEMO_UI_CHECKS,
  buildAccountsCopyText,
  buildFullGuideCopyText,
  buildShareInviteText,
  copyPlainText,
} from "../../lib/demo-guide";

export default function DemoGuideContent() {
  const [copying, setCopying] = useState<string | null>(null);

  async function handleCopy(kind: "invite" | "guide" | "accounts") {
    setCopying(kind);
    try {
      const text =
        kind === "invite"
          ? buildShareInviteText()
          : kind === "guide"
            ? buildFullGuideCopyText()
            : buildAccountsCopyText();
      await copyPlainText(text);
      toast.success(
        kind === "invite"
          ? "Invite text copied — paste in Teams"
          : kind === "guide"
            ? "Full guide copied as plain text"
            : "Accounts copied"
      );
    } catch {
      toast.error("Copy failed — try again");
    } finally {
      setCopying(null);
    }
  }

  return (
    <div className="portal-page relative min-w-0 flex-1 overflow-x-hidden">
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto grid w-full max-w-[1600px] grid-cols-2 gap-2 px-3 py-3 sm:flex sm:flex-wrap sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => handleCopy("invite")}
            disabled={Boolean(copying)}
            className="col-span-2 inline-flex min-h-10 items-center justify-center rounded-xl bg-[var(--af-navy)] px-3 py-2 text-center text-xs font-bold text-white shadow hover:bg-[var(--af-navy-soft)] disabled:opacity-60 sm:col-auto sm:px-4"
          >
            {copying === "invite" ? "Copying…" : "Share access invite"}
          </button>
          <button
            type="button"
            onClick={() => handleCopy("guide")}
            disabled={Boolean(copying)}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 sm:px-4"
          >
            {copying === "guide" ? "Copying…" : "Copy full guide"}
          </button>
          <button
            type="button"
            onClick={() => handleCopy("accounts")}
            disabled={Boolean(copying)}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 sm:px-4"
          >
            {copying === "accounts" ? "Copying…" : "Copy accounts only"}
          </button>
          <a
            href={DEMO_DOCS_URL}
            className="col-span-2 inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50 sm:col-auto sm:px-4"
          >
            Open full documentation
          </a>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-6 sm:py-7 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:rounded-3xl">
          <div className="bg-[var(--af-navy)] px-5 py-7 sm:px-8 sm:py-10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-300">
                  Expense Approval & Tracking
                </p>
                <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
                  Full Live <span className="text-sky-300">Demo Guide</span>
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-sky-100 sm:text-base">
                  Sign-in → every role → end-to-end expense cycle. Covers login security, FX
                  submission, approver decisions, change requests, processor payments with
                  receipts, and full audit/export.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <a
                  href={DEMO_APP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-4 text-center text-sm font-bold text-[var(--af-navy)] shadow sm:px-5"
                >
                  Open App →
                </a>
                <a
                  href={DEMO_API_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/40 px-4 text-center text-sm font-bold text-white hover:bg-white/10 sm:px-5"
                >
                  Wake Backend API
                </a>
              </div>
            </div>
          </div>

          <div className="grid min-w-0 gap-0 lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="hidden border-r border-slate-200 bg-slate-50/80 p-5 lg:block">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                On this page
              </p>
              <nav className="mt-3 space-y-1">
                {DEMO_SECTIONS.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white hover:text-[var(--af-accent)]"
                  >
                    {section.label}
                  </a>
                ))}
              </nav>
            </aside>

            <div className="min-w-0 space-y-8 p-4 sm:p-7 lg:p-8">
              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Live URLs</h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Frontend (App)
                      </p>
                      <a
                        href={DEMO_APP_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 break-all text-sm font-semibold text-[var(--af-accent)] hover:underline"
                      >
                        {DEMO_APP_URL}
                      </a>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Backend (API)
                      </p>
                      <a
                        href={DEMO_API_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 break-all text-sm font-semibold text-[var(--af-accent)] hover:underline"
                      >
                        {DEMO_API_URL}
                      </a>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <strong>Note:</strong> The backend is on Render’s free tier and may sleep after
                  inactivity. Open the Backend URL once first (wait until it loads — up to ~50
                  seconds), then use the Frontend.
                </div>
              </section>

              <section id="accounts" className="scroll-mt-28 space-y-4">
                <h2 className="text-xl font-extrabold text-slate-900">1) Test accounts</h2>
                <p className="text-sm text-slate-600">
                  Primary accounts use real Gmail inboxes for Email OTP. Requester/Approver are
                  project-scoped — pick a project both share (Media pair below).
                </p>
                <div className="af-table-wrap rounded-2xl border border-slate-200">
                  <table className="af-table min-w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--af-navy)] text-white">
                        <th className="px-3 py-3 text-left">Use as</th>
                        <th className="px-3 py-3 text-left">Email</th>
                        <th className="px-3 py-3 text-left">Password</th>
                        <th className="px-3 py-3 text-left">Role</th>
                        <th className="px-3 py-3 text-left">Assigned projects</th>
                        <th className="px-3 py-3 text-left">Login 2FA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DEMO_ACCOUNTS.map((account) => (
                        <tr key={account.email} className="border-t border-slate-100">
                          <td className="px-3 py-3 font-bold text-[var(--af-accent)]">
                            {account.label}
                          </td>
                          <td className="px-3 py-3 font-mono text-xs">{account.email}</td>
                          <td className="px-3 py-3 font-mono text-xs">{account.password}</td>
                          <td className="px-3 py-3 text-slate-700">{account.role}</td>
                          <td className="px-3 py-3 text-xs text-slate-700 max-w-[220px]">
                            {account.projects}
                          </td>
                          <td className="px-3 py-3 text-slate-700">{account.login2fa}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-500">
                  *Admin has no email OTP by default. Optional Authenticator app can be enabled in
                  Profile.
                </p>

                <h3 className="text-base font-extrabold text-slate-900">
                  Project-scoped demo users (seeded)
                </h3>
                <p className="text-sm text-slate-600">
                  Different Requesters and Approvers for different project groups. These
                  accounts are <strong>password-only</strong> (no Email OTP, no Authenticator)
                  so you can switch personas quickly during demos.
                </p>
                <div className="af-table-wrap rounded-2xl border border-slate-200">
                  <table className="af-table min-w-full text-sm">
                    <thead>
                      <tr className="bg-slate-700 text-white">
                        <th className="px-3 py-3 text-left">Name</th>
                        <th className="px-3 py-3 text-left">Email</th>
                        <th className="px-3 py-3 text-left">Password</th>
                        <th className="px-3 py-3 text-left">Role</th>
                        <th className="px-3 py-3 text-left">Assigned projects</th>
                        <th className="px-3 py-3 text-left">Login</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DEMO_EXTRA_STAFF.map((staff) => (
                        <tr key={staff.email} className="border-t border-slate-100">
                          <td className="px-3 py-3 font-semibold text-slate-900">{staff.name}</td>
                          <td className="px-3 py-3 font-mono text-xs">{staff.email}</td>
                          <td className="px-3 py-3 font-mono text-xs">{staff.password}</td>
                          <td className="px-3 py-3 text-slate-700">{staff.role}</td>
                          <td className="px-3 py-3 text-xs text-slate-700 max-w-[280px]">
                            {staff.projects}
                          </td>
                          <td className="px-3 py-3 text-xs text-slate-700">{staff.login2fa}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
                  <strong>Pairing tip:</strong> Requester News ↔ Approver Media (GNL/GNP) ·
                  Requester Systems ↔ Approver Systems · Requester Ops ↔ Approver Ops · Requester
                  GAC ↔ Approver Media.
                </div>
              </section>

              <section id="sign-in" className="scroll-mt-28 space-y-3">
                <h2 className="text-xl font-extrabold text-slate-900">2) How to sign in</h2>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <ol className="space-y-3">
                    {DEMO_SIGN_IN_STEPS.map((step, index) => (
                      <li key={step} className="flex gap-3 text-sm leading-relaxed text-slate-700">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--af-navy)] text-xs font-bold text-white">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>

              <section id="workflow" className="scroll-mt-28 space-y-5">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    3) Complete business flow
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    This is the proper path that exercises every major function.
                  </p>
                </div>

                <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
                  <p className="text-sm font-extrabold text-[var(--af-accent)]">
                    FLOW A — Happy path with partial payment
                  </p>
                </div>

                <div className="space-y-4">
                  {DEMO_FLOW_A_STEPS.map((step) => (
                    <article
                      key={step.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row">
                        <div className="flex items-center justify-center bg-[var(--af-navy)] px-4 py-4 text-sm font-extrabold text-white sm:w-16 sm:flex-col">
                          {step.id}
                        </div>
                        <div className="flex-1 p-4 sm:p-5">
                          <h3 className="text-base font-extrabold text-slate-900">{step.title}</h3>
                          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-600">
                            {step.body.map((line) => (
                              <li key={line}>• {line}</li>
                            ))}
                          </ul>
                          {step.actions && (
                            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                              <table className="min-w-full text-xs">
                                <thead>
                                  <tr className="bg-slate-100 text-left text-slate-700">
                                    <th className="px-3 py-2">Action</th>
                                    <th className="px-3 py-2">Result</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {step.actions.map((action) => (
                                    <tr key={action.action} className="border-t border-slate-100">
                                      <td className="px-3 py-2 font-bold text-slate-900">
                                        {action.action}
                                      </td>
                                      <td className="px-3 py-2 text-slate-600">{action.result}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                          {step.tip && (
                            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
                              {step.tip}
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                  <p className="text-sm font-extrabold text-emerald-800">
                    FLOW B — Quick reject path (optional second test)
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-emerald-900/80">
                    Submit another expense as Requester → Approver <strong>Reject</strong> (reason
                    required) → status Rejected by Approver · requester notified. Or approve then
                    Processor <strong>Reject Payout</strong> → Rejected by Processor.
                  </p>
                </div>
              </section>

              <section id="audit" className="scroll-mt-28 space-y-3">
                <h2 className="text-xl font-extrabold text-slate-900">4) Verify audit trail</h2>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-700">
                  <p className="font-semibold text-slate-900">
                    Open the paid request → Expense Details & Audit and confirm:
                  </p>
                  <ul className="mt-3 space-y-2">
                    {DEMO_AUDIT_CHECKS.map((item) => (
                      <li key={item}>✓ {item}</li>
                    ))}
                  </ul>
                  <p className="mt-4">
                    Then open <strong>Analytics / Tracker</strong> → <strong>Export Excel</strong>{" "}
                    and open all sheets: Expense Report · Change Requests · Workflow History ·
                    Payment History
                  </p>
                </div>
              </section>

              <section id="roles" className="scroll-mt-28 space-y-3">
                <h2 className="text-xl font-extrabold text-slate-900">5) Role capabilities</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {DEMO_ROLE_CAPABILITIES.map((role) => (
                    <article
                      key={role.role}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <h3 className="text-sm font-extrabold text-[var(--af-accent)]">{role.role}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{role.canDo}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section id="status" className="scroll-mt-28 space-y-3">
                <h2 className="text-xl font-extrabold text-slate-900">6) Typical status flow</h2>
                <pre className="overflow-x-auto rounded-2xl bg-slate-900 p-5 text-xs leading-relaxed text-slate-100 sm:text-sm">
                  {`Submitted (Pending Approver)
→ optional Changes Requested → edit → resubmit
→ Approved (Pending Processing)
→ optional Partially Paid
→ Processed & Paid
(or Rejected by Approver / Rejected by Processor)`}
                </pre>
              </section>

              <section id="security" className="scroll-mt-28 space-y-3">
                <h2 className="text-xl font-extrabold text-slate-900">7) Security features to try</h2>
                <ul className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
                  {DEMO_SECURITY_FEATURES.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </section>

              <section id="ui-checks" className="scroll-mt-28 space-y-3">
                <h2 className="text-xl font-extrabold text-slate-900">8) What to watch for in the UI</h2>
                <ul className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
                  {DEMO_UI_CHECKS.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
                <p className="text-sm leading-relaxed text-slate-700">
                  Please try the full path above (<strong>FLOW A: A1→A7</strong>), verify audit +
                  Excel export, and share feedback (bugs, UX, missing fields, email delays, etc.).
                  For page-by-page success/error reference, open the{" "}
                  <a href={DEMO_DOCS_URL} className="font-bold text-[var(--af-accent)] hover:underline">
                    Full App Documentation
                  </a>
                  .
                </p>
                <p className="mt-4 text-sm text-slate-900">
                  Thanks,
                  <br />
                  <strong className="text-[var(--af-navy)]">Aceolution Finance</strong>
                </p>
              </section>
            </div>
          </div>

          <div className="border-t border-slate-800 bg-[var(--af-navy)] px-6 py-4 text-center text-xs leading-relaxed text-sky-200">
            Secure internal expense requests, multi-currency FX, approvals, disbursements, audit
            history, and payment tracking.
          </div>
        </div>
      </div>
    </div>
  );
}
