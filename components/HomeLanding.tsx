"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

const WORKFLOW = [
  {
    title: "Submit",
    description:
      "Create a reimbursement with project, category, multi-currency amount, FX rate, due date, and invoice.",
    color: "#1850a8",
    soft: "rgba(24,80,168,0.12)",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: "Approve",
    description: "Managers approve, reject, or request changes with notes â€” then items move to finance.",
    color: "#0d9488",
    soft: "rgba(13,148,136,0.14)",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Pay",
    description: "Processors record full or partial payouts with receipts, or send the request back.",
    color: "#0284c7",
    soft: "rgba(2,132,199,0.14)",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    title: "Track",
    description: "Follow paid vs remaining balances, full change history, analytics, and Excel export.",
    color: "#d97706",
    soft: "rgba(217,119,6,0.14)",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
] as const;

const MARQUEE = [
  "Multi-currency FX",
  "Email OTP",
  "Partial payments",
  "Change history",
  "Excel export",
  "Due-soon reminders",
  "Invoice uploads",
  "Payment receipts",
  "Role-based access",
  "Audit trail",
] as const;

const CAPABILITY_COLORS = [
  { bg: "from-sky-500 to-blue-700", soft: "bg-sky-50 border-sky-200" },
  { bg: "from-teal-500 to-emerald-700", soft: "bg-teal-50 border-teal-200" },
  { bg: "from-amber-400 to-orange-600", soft: "bg-amber-50 border-amber-200" },
  { bg: "from-cyan-500 to-sky-700", soft: "bg-cyan-50 border-cyan-200" },
  { bg: "from-rose-400 to-rose-700", soft: "bg-rose-50 border-rose-200" },
  { bg: "from-slate-600 to-[#203c62]", soft: "bg-slate-50 border-slate-300" },
] as const;

const ROLES = [
  {
    role: "Requester",
    detail: "Own the expense from draft to payout.",
    accent: "#1850a8",
    capabilities: [
      "Submit expenses with FX, invoice, and due date",
      "Track status, paid amount, and remaining balance",
      "Edit & resubmit only when Changes Requested",
      "Email alerts: submitted, rejected, changes, paid",
    ],
  },
  {
    role: "Approver",
    detail: "Decide what moves to finance.",
    accent: "#0d9488",
    capabilities: [
      "Queue of pending requests with count badge",
      "Approve, Reject, or Request Changes with notes",
      "View invoice, FX line, notes, and history",
      "Analytics + Excel export Â· due-soon reminders",
    ],
  },
  {
    role: "Processor",
    detail: "Close the money loop.",
    accent: "#0369a1",
    capabilities: [
      "Queue of approved & partially paid items",
      "Full pay or partial pay with payment receipts",
      "Reject payout or request changes to requester/approver",
      "Analytics + Excel Â· unpaid due-soon reminders",
    ],
  },
  {
    role: "Admin",
    detail: "Configure the whole platform.",
    accent: "#203c62",
    capabilities: [
      "Full approver + processor visibility",
      "User management with welcome email & temp password",
      "Categories, projects, countries & currencies",
      "Full analytics and Excel export",
    ],
  },
] as const;

const STATUSES = [
  {
    label: "Awaiting manager approval",
    meaning: "Submitted â€” waiting in the Approver queue.",
    tone: "bg-amber-100 text-amber-900 border-amber-200",
  },
  {
    label: "Changes requested",
    meaning: "Sent back for edits. Requester can edit and resubmit only in this state.",
    tone: "bg-orange-100 text-orange-900 border-orange-200",
  },
  {
    label: "Ready to pay",
    meaning: "Approved â€” waiting in the Processor queue.",
    tone: "bg-sky-100 text-sky-900 border-sky-200",
  },
  {
    label: "Partially paid",
    meaning: "Some amount disbursed; remaining balance still open.",
    tone: "bg-emerald-100 text-emerald-900 border-emerald-200",
  },
  {
    label: "Paid",
    meaning: "Fully processed and closed.",
    tone: "bg-slate-100 text-slate-800 border-slate-200",
  },
  {
    label: "Rejected",
    meaning: "Rejected by Approver or Processor â€” requester is notified by email.",
    tone: "bg-rose-100 text-rose-900 border-rose-200",
  },
] as const;

const CAPABILITIES = [
  {
    title: "Multi-currency & FX",
    body: "Submit in local currency with a live FX line (e.g. 1 EUR = x.xxxxxx USD â€” date) so finance sees the converted amount clearly.",
  },
  {
    title: "Invoices & payment receipts",
    body: "Attach invoices on submit. Processors attach payment receipts on full or partial payout â€” view and download anytime.",
  },
  {
    title: "Change-request history",
    body: "Every back-and-forth note is kept â€” not only the latest. Excel export includes a Change Requests sheet that matches the UI.",
  },
  {
    title: "Analytics & Excel export",
    body: "Approvers, processors, and admins open Analytics / Tracker and export multi-sheet workbooks for audit and reporting.",
  },
  {
    title: "Due-soon reminders",
    body: "Email reminders one day before due for items still waiting on approvers or unpaid after approval.",
  },
  {
    title: "Catalogs & users",
    body: "Admins manage categories, projects, countries with currencies, and users (roles, active status, force password change).",
  },
] as const;

const ROLE_SOFT = [
  "bg-gradient-to-br from-sky-50 to-blue-100/80 border-sky-200",
  "bg-gradient-to-br from-teal-50 to-emerald-100/70 border-teal-200",
  "bg-gradient-to-br from-cyan-50 to-sky-100/80 border-cyan-200",
  "bg-gradient-to-br from-slate-50 to-blue-100/60 border-slate-300",
] as const;

const SECURITY = [
  {
    title: "Email OTP login",
    body: "Non-admin users sign in with password + one-time code sent to email.",
  },
  {
    title: "Optional authenticator",
    body: "Enable TOTP in Profile. Disable with password + email code if the phone app was reinstalled.",
  },
  {
    title: "Password lifecycle",
    body: "Forgot / reset password, first-login set password, and admin-issued temp passwords with forced change.",
  },
  {
    title: "Full audit trail",
    body: "Status changes, notes, payments, and receipts stay linked to each expense for review and Excel export.",
  },
] as const;

const MOCK_ROWS = [
  { name: "Client travel â€” Singapore", amount: "$1,240.00", status: "Awaiting approval", tone: "amber" },
  { name: "Software subscription", amount: "$89.00", status: "Ready to pay", tone: "sky" },
  { name: "Team offsite catering", amount: "$620.50", status: "Partially paid", tone: "emerald" },
  { name: "Office supplies Q2", amount: "$156.00", status: "Paid", tone: "slate" },
] as const;

const statusTone: Record<(typeof MOCK_ROWS)[number]["tone"], string> = {
  amber: "bg-amber-100 text-amber-900",
  sky: "bg-sky-100 text-sky-900",
  emerald: "bg-emerald-100 text-emerald-900",
  slate: "bg-slate-100 text-slate-700",
};

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -32px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`af-reveal h-full min-h-0 ${visible ? "af-reveal-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function ProductMock() {
  return (
    <div className="af-landing-mock group relative w-full">
      <div className="af-landing-mock-glow pointer-events-none absolute -inset-6 rounded-[2rem] opacity-70" />
      <div className="af-landing-mock-frame relative overflow-hidden rounded-none border-y border-white/20 bg-[#0b1a2e] sm:rounded-2xl sm:border lg:rounded-[1.35rem]">
        <div className="flex items-center gap-2 border-b border-white/10 bg-[var(--af-navy)] px-4 py-3 sm:px-5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
          <span className="ml-3 text-xs font-semibold tracking-wide text-white/70">Expense dashboard</span>
          <span className="af-live-dot ml-auto hidden items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Live
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 border-b border-white/10 bg-[#132744] px-4 py-3 sm:gap-3 sm:px-5">
          {[
            { label: "Pending", value: "12", bar: "68%" },
            { label: "Approved", value: "8", bar: "45%" },
            { label: "Paid", value: "34", bar: "92%" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="af-mock-stat rounded-lg bg-white/5 px-3 py-2.5"
              style={{ animationDelay: `${400 + i * 120}ms` }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-200/70">{stat.label}</p>
              <p className="mt-0.5 text-lg font-bold text-white sm:text-xl">{stat.value}</p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="af-mock-bar h-full rounded-full bg-[#70bcfc]" style={{ ["--bar-w" as string]: stat.bar }} />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#f8fafc]">
          <div className="hidden grid-cols-[1fr_auto_auto] gap-4 border-b border-slate-200 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:grid sm:px-5">
            <span>Request</span>
            <span>Amount</span>
            <span>Status</span>
          </div>
          {MOCK_ROWS.map((row, i) => (
            <div
              key={row.name}
              className="af-mock-row grid grid-cols-1 gap-1 border-b border-slate-200 px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-4 sm:px-5"
              style={{ animationDelay: `${700 + i * 140}ms` }}
            >
              <p className="text-sm font-semibold text-slate-900">{row.name}</p>
              <p className="font-mono text-sm font-semibold text-slate-800 sm:text-right">{row.amount}</p>
              <span
                className={`inline-flex w-fit items-center rounded-md px-2 py-1 text-[11px] font-bold sm:justify-self-end ${statusTone[row.tone]} ${
                  row.tone === "amber" ? "af-status-pulse" : ""
                }`}
              >
                {row.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomeLanding() {
  const heroRef = useRef<HTMLElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState({ x: 50, y: 30 });
  const [flowOn, setFlowOn] = useState(false);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setPointer({ x, y });
    };
    el.addEventListener("pointermove", onMove);
    return () => el.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => {
    const el = flowRef.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setFlowOn(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setFlowOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);


  return (
    <div className="af-landing relative flex flex-1 flex-col overflow-x-hidden bg-[var(--af-bg)]">
      {/* ——— Hero ——— */}
      <section
        ref={heroRef}
        className="af-landing-hero relative overflow-hidden sm:min-h-[min(70vh,720px)] lg:min-h-[min(92vh,880px)]"
      >
        <div className="af-landing-hero-base pointer-events-none absolute inset-0" />
        <div
          className="af-landing-spotlight pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(540px circle at ${pointer.x}% ${pointer.y}%, rgba(112,188,252,0.32), transparent 55%)`,
          }}
        />
        <div className="af-orb af-orb-a pointer-events-none absolute -left-24 top-16 hidden h-72 w-72 rounded-full sm:block" />
        <div className="af-orb af-orb-b pointer-events-none absolute -right-16 top-8 hidden h-80 w-80 rounded-full sm:block" />
        <div className="af-orb af-orb-c pointer-events-none absolute bottom-10 left-1/3 hidden h-64 w-64 rounded-full sm:block" />
        <div className="af-orb af-orb-d pointer-events-none absolute right-1/4 top-1/2 hidden h-48 w-48 rounded-full lg:block" />
        <div className="af-landing-grid pointer-events-none absolute inset-0" />
        <div className="af-landing-scan pointer-events-none absolute inset-x-0 top-0 h-40" />
        <div className="af-particles pointer-events-none absolute inset-0" aria-hidden>
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className={`af-particle af-particle-${i + 1}`} />
          ))}
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col justify-center px-4 pb-12 pt-10 sm:min-h-[min(70vh,720px)] sm:px-6 sm:pb-16 sm:pt-12 lg:min-h-[min(92vh,880px)] lg:px-8 lg:pb-20 lg:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14">
            <div className="max-w-xl">
              <p className="af-hero-line af-pill-live inline-flex items-center gap-2 rounded-full border border-sky-300/70 bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--af-navy-muted)] backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Expense approval &amp; tracking
              </p>
              <h1 className="af-hero-line af-hero-brand mt-5 text-[clamp(1.85rem,6vw,3.5rem)] font-extrabold leading-[1.05] tracking-tight text-[var(--af-navy)]">
                Aceolution{" "}
                <span className="af-brand-shimmer">Finance</span>
              </h1>
              <p
                className="af-hero-line mt-5 text-[clamp(1.1rem,3.2vw,1.5rem)] font-bold leading-snug tracking-tight text-slate-900"
                style={{ animationDelay: "120ms" }}
              >
                Submit, approve, and pay expenses in one place
              </p>
              <p
                className="af-hero-line mt-4 max-w-md text-[clamp(0.95rem,2.5vw,1.05rem)] leading-relaxed text-slate-600"
                style={{ animationDelay: "200ms" }}
              >
                Secure internal requests with multi-currency FX, manager approvals, partial or full
                disbursements, email OTP, and a full audit trail — all in one dashboard.
              </p>
              <div
                className="af-hero-line mt-8 flex w-full flex-col gap-3 sm:mt-9 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
                style={{ animationDelay: "280ms" }}
              >
                <Link
                  href="/login"
                  className="af-cta-primary inline-flex h-12 w-full items-center justify-center rounded-xl px-8 text-sm font-bold text-white sm:w-auto"
                >
                  <span className="relative z-10">Sign In</span>
                </Link>
                <Link
                  href="/demo-guide"
                  className="af-cta-ghost inline-flex h-12 w-full items-center justify-center rounded-xl border border-sky-300/80 bg-white/75 px-5 text-sm font-bold text-[var(--af-navy)] backdrop-blur-sm sm:w-auto"
                >
                  Live demo guide
                </Link>
              </div>
            </div>

            <div className="af-hero-mock -mx-4 sm:mx-0" style={{ animationDelay: "180ms" }}>
              <ProductMock />
            </div>
          </div>
        </div>
      </section>

      {/* ——— Marquee ——— */}
      <div className="af-marquee-band relative overflow-hidden border-y border-sky-400/30 py-3">
        <div className="af-marquee-track flex w-max gap-8 whitespace-nowrap">
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span key={`${item}-${i}`} className="inline-flex items-center gap-8 text-sm font-bold tracking-wide text-white">
              <span>{item}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#70bcfc]" />
            </span>
          ))}
        </div>
      </div>

      {/* ——— Workflow ——— */}
      <section className="af-section-sky relative overflow-hidden border-t border-sky-200/60">
        <div className="af-blob af-blob-1 pointer-events-none absolute -left-20 top-10 hidden h-64 w-64 rounded-full sm:block" />
        <div className="af-blob af-blob-2 pointer-events-none absolute -right-16 bottom-0 hidden h-72 w-72 rounded-full sm:block" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <Reveal className="!h-auto">
            <h2 className="text-[clamp(1.35rem,3.5vw,1.875rem)] font-extrabold tracking-tight text-slate-900">
              From request to payout
            </h2>
            <p className="mt-3 max-w-2xl text-[clamp(0.95rem,2.4vw,1rem)] text-slate-600">
              One connected cycle: submit with invoice and FX, approve or send back for changes, pay in full or
              in parts, then track every status in the UI and Excel.
            </p>
          </Reveal>

          <div ref={flowRef} className="relative mt-10 sm:mt-12 lg:mt-14">
            <div className="af-flow-track pointer-events-none absolute left-0 right-0 top-[28px] hidden h-[3px] lg:block">
              <div
                className={`af-flow-progress h-full w-full origin-left rounded-full ${
                  flowOn ? "af-flow-progress-on" : ""
                }`}
              />
            </div>

            <div className="af-equal-grid grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              {WORKFLOW.map((step, index) => (
                <Reveal key={step.title} delay={index * 100}>
                  <article
                    className="af-equal-card af-flow-card group relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-2xl border border-white/80 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-lg sm:min-h-[240px]"
                    style={{ background: step.soft }}
                  >
                    <div
                      className="af-flow-node relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                      style={{ background: step.color }}
                    >
                      {step.icon}
                    </div>
                    <div className="mt-4 flex min-h-0 min-w-0 flex-1 flex-col">
                      <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                        Step {index + 1}
                      </span>
                      <h3 className="mt-1 text-lg font-bold text-slate-900">{step.title}</h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{step.description}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ——— Status legend ——— */}
      <section className="af-section-aurora relative overflow-hidden border-t border-teal-200/50">
        <div className="af-aurora pointer-events-none absolute inset-0" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <Reveal className="!h-auto">
            <h2 className="text-[clamp(1.35rem,3.5vw,1.875rem)] font-extrabold tracking-tight text-slate-900">
              Statuses you will see
            </h2>
            <p className="mt-3 max-w-2xl text-[clamp(0.95rem,2.4vw,1rem)] text-slate-700">
              Every expense moves through a clear path — including optional change loops and partial payments.
            </p>
          </Reveal>

          <div className="af-equal-grid mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {STATUSES.map((item, index) => (
              <Reveal key={item.label} delay={index * 70}>
                <div className="af-equal-card af-status-card group flex h-full min-h-[140px] flex-col rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:min-h-[156px]">
                  <span className={`af-chip-bounce inline-flex w-fit rounded-md border px-2.5 py-1 text-[11px] font-bold ${item.tone}`}>
                    {item.label}
                  </span>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{item.meaning}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="!h-auto" delay={120}>
            <p className="af-flow-code mt-8 overflow-hidden rounded-xl border border-sky-400/30 bg-slate-900 px-4 py-3 font-mono text-xs leading-relaxed text-sky-100 sm:text-[13px]">
              <span className="af-typewriter">
                Submitted → optional Changes Requested → Approved → optional Partially Paid → Paid
              </span>
              <span className="text-slate-400"> · or Rejected by Approver / Processor</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ——— Platform capabilities ——— */}
      <section className="af-section-warm relative overflow-hidden border-t border-amber-200/60">
        <div className="af-blob af-blob-amber pointer-events-none absolute -right-10 top-8 hidden h-56 w-56 rounded-full sm:block" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <Reveal className="!h-auto">
            <h2 className="text-[clamp(1.35rem,3.5vw,1.875rem)] font-extrabold tracking-tight text-slate-900">
              Built for real finance operations
            </h2>
            <p className="mt-3 max-w-2xl text-[clamp(0.95rem,2.4vw,1rem)] text-slate-600">
              Beyond submit and approve — FX, receipts, reminders, catalogs, and export that match the UI history.
            </p>
          </Reveal>

          <div className="af-equal-grid mt-10 grid grid-cols-1 gap-5 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((item, index) => {
              const tone = CAPABILITY_COLORS[index % CAPABILITY_COLORS.length];
              return (
                <Reveal key={item.title} delay={index * 80}>
                  <article
                    className={`af-equal-card af-cap-card group relative flex h-full min-h-[200px] flex-col overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg sm:min-h-[220px] ${tone.soft}`}
                  >
                    <div className={`af-cap-orb mb-4 h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br ${tone.bg} shadow-md`} />
                    <h3 className="text-base font-extrabold text-[var(--af-navy)]">{item.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{item.body}</p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ——— Roles ——— */}
      <section className="af-section-roles relative overflow-hidden border-t border-slate-200/80">
        <div className="relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <Reveal className="!h-auto">
            <h2 className="text-[clamp(1.35rem,3.5vw,1.875rem)] font-extrabold tracking-tight text-slate-900">
              Built for every role in the cycle
            </h2>
            <p className="mt-3 max-w-2xl text-[clamp(0.95rem,2.4vw,1rem)] text-slate-600">
              Clear permissions so requesters, managers, finance, and admins each see the right queues and actions.
            </p>
          </Reveal>

          <div className="af-equal-grid mt-10 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 lg:gap-5">
            {ROLES.map((item, index) => (
              <Reveal key={item.role} delay={index * 90}>
                <article
                  className={`af-equal-card af-role-panel group relative flex h-full min-h-[280px] flex-col overflow-hidden rounded-2xl border p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl sm:min-h-[300px] sm:p-6 ${ROLE_SOFT[index]}`}
                >
                  <span
                    className="absolute inset-x-0 top-0 h-1.5 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                    style={{ background: item.accent }}
                  />
                  <div
                    className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-extrabold text-white shadow-sm"
                    style={{ background: item.accent }}
                  >
                    {item.role[0]}
                  </div>
                  <h3 className="text-lg font-extrabold text-[var(--af-navy)]">{item.role}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{item.detail}</p>
                  <ul className="mt-4 flex-1 space-y-2">
                    {item.capabilities.map((cap) => (
                      <li key={cap} className="flex gap-2 text-sm leading-relaxed text-slate-600">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: item.accent }} />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ——— Security ——— */}
      <section className="af-section-secure relative overflow-hidden border-t border-teal-300/40">
        <div className="af-secure-glow pointer-events-none absolute inset-0" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <Reveal className="!h-auto">
            <h2 className="text-[clamp(1.35rem,3.5vw,1.875rem)] font-extrabold tracking-tight text-white">
              Security built into every login
            </h2>
            <p className="mt-3 max-w-2xl text-[clamp(0.95rem,2.4vw,1rem)] text-teal-50/90">
              Password plus email OTP for staff roles, optional authenticator, and a complete audit trail on every expense.
            </p>
          </Reveal>

          <div className="af-equal-grid mt-10 grid grid-cols-1 gap-5 sm:mt-12 sm:grid-cols-2">
            {SECURITY.map((item, index) => (
              <Reveal key={item.title} delay={index * 80}>
                <div className="af-equal-card af-secure-card flex h-full min-h-[140px] flex-col rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/15 sm:min-h-[156px]">
                  <h3 className="text-base font-extrabold text-white">{item.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-teal-50/85">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ——— Docs / demo ——— */}
      <section className="relative overflow-hidden border-t border-sky-200/70 bg-gradient-to-r from-sky-100 via-white to-amber-50">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <Reveal className="!h-auto">
            <div className="af-docs-panel flex flex-col gap-6 rounded-2xl border border-sky-200 bg-white/90 p-6 shadow-lg shadow-sky-200/40 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div className="max-w-xl">
                <h2 className="text-[clamp(1.15rem,3vw,1.5rem)] font-extrabold tracking-tight text-slate-900">
                  Need a walkthrough?
                </h2>
                <p className="mt-2 text-[clamp(0.9rem,2.3vw,1rem)] leading-relaxed text-slate-600">
                  Open the live demo guide for test accounts and FLOW A, or the full documentation with real
                  website screenshots for every login and approval path.
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
                <Link
                  href="/demo-guide"
                  className="af-cta-primary inline-flex h-11 w-full items-center justify-center rounded-xl px-5 text-sm font-bold text-white sm:w-auto"
                >
                  <span className="relative z-10">Demo guide</span>
                </Link>
                <a
                  href="/docs-guide.html"
                  className="af-cta-ghost inline-flex h-11 w-full items-center justify-center rounded-xl border border-sky-300 bg-white px-5 text-sm font-bold text-[var(--af-navy)] sm:w-auto"
                >
                  Full documentation
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ——— Closing CTA ——— */}
      <section className="af-cta-band relative overflow-hidden border-t border-white/10">
        <div className="af-cta-band-shine pointer-events-none absolute inset-0" />
        <div className="af-cta-orbs pointer-events-none absolute inset-0">
          <span className="af-cta-orb af-cta-orb-a" />
          <span className="af-cta-orb af-cta-orb-b" />
        </div>
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-stretch justify-between gap-6 px-4 py-12 sm:flex-row sm:items-center sm:gap-8 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <Reveal className="!h-auto">
            <h2 className="text-[clamp(1.15rem,3vw,1.5rem)] font-extrabold tracking-tight text-white">
              Ready to manage expenses?
            </h2>
            <p className="mt-2 text-[clamp(0.9rem,2.3vw,1rem)] text-sky-100/90">
              Sign in with your Aceolution Finance account to continue.
            </p>
          </Reveal>
          <Reveal className="!h-auto" delay={120}>
            <Link
              href="/login"
              className="af-cta-secondary inline-flex h-12 w-full shrink-0 items-center justify-center rounded-xl px-8 text-sm font-bold text-[#0f172a] sm:w-auto"
            >
              Sign In
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
