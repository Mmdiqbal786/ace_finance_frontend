"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

/* Exact mindustrious-style layout · Aceolution Finance content */

const HERO_POINTS = [
  {
    label: "Multi-Currency FX",
    color: "text-teal-500",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    label: "Secure & Audited",
    color: "text-blue-500",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    label: "Role-Based Access",
    color: "text-violet-500",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
] as const;

const VALUES = [
  {
    title: "Goal-Oriented Approvals",
    body: "Align every expense with projects, categories, and due dates before payout.",
    accent: "#2dd4bf",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4} aria-hidden>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Agile Disbursements",
    body: "Faster payouts through full or partial payments with attached receipts.",
    accent: "#60a5fa",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: "Transparent Process",
    body: "Clear status history, change requests, and notes at every step of the way.",
    accent: "#a78bfa",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-1m0-8V6a2 2 0 012-2h6a2 2 0 012 2v2M7 10H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l4-4h4" />
      </svg>
    ),
  },
  {
    title: "Client-Centric Roles",
    body: "Requesters, approvers, processors, and admins each see the right queues.",
    accent: "#86efac",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
] as const;

const SERVICES = [
  {
    title: "Expense Requests",
    body: "Submit reimbursements with multi-currency amounts, live FX, invoices, and due dates.",
    circle: "from-teal-400 to-emerald-500",
    icon: (
      <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "Approvals & Changes",
    body: "Managers approve, reject, or request changes. Every note stays in history.",
    circle: "from-sky-400 to-blue-600",
    icon: (
      <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "Disbursements",
    body: "Finance records full or partial payouts with receipts and remaining balances.",
    circle: "from-violet-400 to-purple-600",
    icon: (
      <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "Analytics & Export",
    body: "Open Analytics or Tracker and export multi-sheet Excel for audit reporting.",
    circle: "from-orange-400 to-amber-500",
    icon: (
      <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
  },
] as const;

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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
      { threshold: 0.1, rootMargin: "0px 0px -24px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`af-reveal ${visible ? "af-reveal-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/** Dashboard UI painted inside the laptop screen */
function ScreenUI() {
  return (
    <div className="flex h-full flex-col bg-[#0b1a2e] text-left">
      <div className="flex items-center gap-1.5 border-b border-white/10 bg-[#0d2137] px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
        <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
        <span className="h-2 w-2 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-[9px] font-semibold text-white/60">Expense dashboard</span>
        <span className="ml-auto text-[8px] font-bold uppercase tracking-wider text-emerald-300">Live</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5 border-b border-white/10 bg-[#132744] px-2.5 py-2">
        {[
          ["Pending", "12"],
          ["Approved", "8"],
          ["Paid", "34"],
        ].map(([l, v]) => (
          <div key={l} className="rounded bg-white/5 px-1.5 py-1">
            <p className="text-[7px] font-semibold uppercase tracking-wide text-sky-200/70">{l}</p>
            <p className="text-sm font-bold text-white">{v}</p>
          </div>
        ))}
      </div>
      <div className="flex-1 space-y-0 bg-[#f8fafc]">
        {[
          ["Client travel", "$1,240", "bg-amber-100 text-amber-800"],
          ["Software sub", "$89", "bg-sky-100 text-sky-800"],
          ["Team offsite", "$620", "bg-emerald-100 text-emerald-800"],
        ].map(([n, a, t]) => (
          <div key={n} className="flex items-center justify-between border-b border-slate-200 px-2.5 py-1.5">
            <span className="text-[10px] font-semibold text-slate-800">{n}</span>
            <span className="font-mono text-[10px] font-bold text-slate-700">{a}</span>
            <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold ${t}`}>•</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhoneUI() {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="bg-[#0d2137] px-2 pb-2 pt-3">
        <div className="mx-auto mb-2 h-1 w-8 rounded-full bg-white/30" />
        <p className="text-[8px] font-bold text-white">Approvals</p>
        <p className="text-[14px] font-extrabold text-teal-300">3 pending</p>
      </div>
      <div className="space-y-1.5 p-2">
        {["Travel claim", "SaaS invoice", "Catering"].map((item, i) => (
          <div key={item} className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">
            <p className="text-[8px] font-bold text-slate-800">{item}</p>
            <p className="text-[7px] text-slate-500">{i === 0 ? "Awaiting you" : "In queue"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Hero visual: laptop + phone — sample composition */
function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-[5/4] w-full max-w-[560px] lg:max-w-none">
      {/* Laptop */}
      <div className="absolute left-[6%] top-[10%] z-10 w-[78%]">
        <div className="overflow-hidden rounded-t-xl border-[3px] border-[#1e293b] bg-[#1e293b] shadow-2xl shadow-black/40">
          <div className="mx-auto mt-1.5 h-1 w-12 rounded-full bg-slate-600/80" />
          <div className="m-1.5 mt-2 aspect-[16/10] overflow-hidden rounded-md bg-black">
            <ScreenUI />
          </div>
        </div>
        {/* Laptop base */}
        <div className="relative mx-auto h-3 w-[108%] -translate-x-[3.5%] rounded-b-md bg-gradient-to-b from-slate-400 to-slate-500 shadow-md">
          <div className="absolute left-1/2 top-0.5 h-1 w-16 -translate-x-1/2 rounded-b bg-slate-600/40" />
        </div>
        <div className="mx-auto h-1.5 w-[112%] -translate-x-[5%] rounded-b-xl bg-slate-600/80" />
      </div>

      {/* Phone */}
      <div className="absolute bottom-[6%] right-[2%] z-20 w-[26%] max-w-[110px]">
        <div className="overflow-hidden rounded-[1.1rem] border-[3px] border-[#0f172a] bg-[#0f172a] shadow-2xl shadow-black/50">
          <div className="aspect-[9/16] overflow-hidden rounded-[0.85rem] bg-white">
            <PhoneUI />
          </div>
        </div>
      </div>
    </div>
  );
}

function RocketGraphic() {
  return (
    <svg className="h-32 w-32 sm:h-40 sm:w-40" viewBox="0 0 140 140" fill="none" aria-hidden>
      <ellipse cx="92" cy="112" rx="22" ry="10" fill="rgba(255,255,255,0.18)" />
      <path d="M62 88c-10 12-12 26-9 34 10-5 22-12 32-24L62 88z" fill="#fbbf24" />
      <path d="M58 92c-5 8-6 16-4 22 6-3 14-8 20-14L58 92z" fill="#f97316" />
      <path d="M52 28c22-26 50-30 62-20 10 12 4 40-22 62L52 28z" fill="#fff" />
      <path d="M52 28c16-18 40-24 52-18 8 10 2 32-18 50L52 28z" fill="#dbeafe" />
      <circle cx="80" cy="44" r="10" fill="#38bdf8" />
      <circle cx="80" cy="44" r="5" fill="#fff" />
      <path d="M52 72l-16 5 10 14 12-7-6-12z" fill="#67e8f9" />
      <path d="M72 92l5 16 14-9-7-12-12 5z" fill="#67e8f9" />
    </svg>
  );
}

export default function HomeLanding() {
  return (
    <div id="home" className="af-landing relative flex flex-1 flex-col overflow-x-hidden bg-white">
      {/* ——— Hero ——— */}
      <section className="relative overflow-hidden bg-white">
        {/* Exact sample: large navy circle bleeding off the right */}
        <div
          className="pointer-events-none absolute -right-[22%] top-[-5%] hidden h-[115%] w-[62%] rounded-full bg-[#0a1628] lg:block"
          aria-hidden
        />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-20 pt-12 sm:px-6 sm:pb-24 sm:pt-14 lg:grid-cols-2 lg:gap-6 lg:px-8 lg:pb-28 lg:pt-16">
          <div className="max-w-xl">
            <p className="flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[0.22em] text-teal-600">
              <span className="h-[3px] w-7 rounded-full bg-teal-500" />
              Digital solutions
            </p>

            <h1 className="mt-4 text-[clamp(2.15rem,5.2vw,3.4rem)] font-extrabold leading-[1.1] tracking-tight text-[#0f172a]">
              We Turn <span className="text-teal-500">Expenses</span> Into Intelligent{" "}
              <span className="text-blue-600">Payouts</span>
            </h1>

            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-slate-500 sm:text-base">
              Custom expense workflows that drive growth, efficiency, and innovation — approvals, disbursements, and audit trails in one place.
            </p>

            <div className="mt-8">
              <Link
                href="/login"
                className="group inline-flex h-[52px] items-center gap-3 rounded-full bg-[#0a1628] pl-7 pr-1.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#132338]"
              >
                Let&apos;s Build Together
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-400 text-[#0a1628] transition-transform group-hover:translate-x-0.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
                  </svg>
                </span>
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-4">
              {HERO_POINTS.map((p) => (
                <div key={p.label} className="flex items-center gap-2.5">
                  <span className={p.color}>{p.icon}</span>
                  <span className="max-w-[6.5rem] text-[12px] font-extrabold leading-snug text-slate-800">{p.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:pl-4">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* ——— Full-bleed navy values (connects under navy circle) ——— */}
      <section id="workflow" className="relative z-20 bg-[#0a1628]">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 sm:py-14 lg:grid-cols-4 lg:gap-0 lg:px-8 lg:py-16">
          {VALUES.map((item, index) => (
            <Reveal key={item.title} delay={index * 80} className="!h-auto">
              <div
                className={`flex flex-col items-center px-3 text-center lg:px-5 ${
                  index > 0 ? "lg:border-l lg:border-white/10" : ""
                }`}
              >
                <span
                  className="flex h-[76px] w-[76px] items-center justify-center rounded-full border-[1.5px]"
                  style={{ borderColor: item.accent, color: item.accent }}
                >
                  {item.icon}
                </span>
                <h3 className="mt-4 text-[15px] font-extrabold text-white">{item.title}</h3>
                <p className="mt-2 max-w-[200px] text-[13px] leading-relaxed text-slate-300">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ——— Our Core Services — 4 cards ——— */}
      <section id="services" className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <Reveal className="!h-auto">
            <div className="text-center">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-teal-500">What we do</p>
              <h2 className="mt-3 text-[clamp(1.5rem,3.5vw,2rem)] font-extrabold tracking-tight text-[#0f172a]">
                Our Core Services
              </h2>
            </div>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((item, i) => (
              <Reveal key={item.title} delay={i * 90}>
                <article className="flex h-full flex-col items-center rounded-2xl border border-slate-100 bg-white px-5 py-8 text-center shadow-[0_10px_40px_rgba(15,23,42,0.07)] transition-transform duration-300 hover:-translate-y-1.5">
                  <span className={`flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br shadow-md ${item.circle}`}>
                    {item.icon}
                  </span>
                  <h3 className="mt-5 text-[15px] font-extrabold text-[#0f172a]">{item.title}</h3>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-slate-500">{item.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ——— CTA ——— */}
      <section className="bg-white pb-10 sm:pb-12">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal className="!h-auto">
            <div className="relative flex flex-col items-start gap-5 overflow-hidden rounded-[1.75rem] bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600 px-6 py-8 sm:flex-row sm:items-center sm:px-8 sm:py-9 lg:px-10">
              <div className="pointer-events-none absolute -right-4 bottom-0 sm:right-2" aria-hidden>
                <RocketGraphic />
              </div>

              <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-teal-600 shadow">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </span>

              <div className="relative z-10 min-w-0 flex-1 sm:pr-32">
                <h2 className="text-[clamp(1.25rem,3vw,1.65rem)] font-extrabold text-white">Have an Idea?</h2>
                <p className="mt-1 text-sm text-white/90">Let&apos;s turn it into something amazing.</p>
              </div>

              <Link
                href="/login"
                className="group relative z-10 inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-extrabold text-[#0a1628] shadow sm:w-auto"
              >
                Start Your Project
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0a1628] text-white transition-transform group-hover:translate-x-0.5">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
                  </svg>
                </span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
