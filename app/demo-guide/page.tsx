"use client";

import { FormEvent, useEffect, useState } from "react";

const GATE_KEY = "ace_demo_guide_unlocked";
const PASSWORD_HASH =
  "8585d94dbcfb942496f2a594b59221254add41dd39f68de8b9b1c3551ef82fa9";

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function DemoGuideGatePage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(GATE_KEY) === "1") {
        setUnlocked(true);
      }
    } catch {
      // ignore
    }
    setChecking(false);
  }, []);

  useEffect(() => {
    if (unlocked) {
      window.location.replace("/demo-access-email.html");
    }
  }, [unlocked]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const hash = await sha256Hex(password.trim());
    if (hash !== PASSWORD_HASH) {
      setError("Incorrect access password. Please try again.");
      return;
    }
    try {
      sessionStorage.setItem(GATE_KEY, "1");
    } catch {
      // ignore
    }
    setUnlocked(true);
  }

  if (checking || unlocked) {
    return (
      <div className="portal-page relative flex min-h-[70vh] flex-1 items-center justify-center p-4">
        <p className="text-sm font-semibold text-slate-600">
          {unlocked ? "Opening demo guide…" : "Loading…"}
        </p>
      </div>
    );
  }

  return (
    <div className="portal-page relative flex flex-1 items-center justify-center p-4 py-8">
      <div className="relative z-10 w-full max-w-[440px]">
        <div className="portal-card rounded-[20px] border-[1.5px] border-slate-500 p-6 shadow-lg sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <img
              src="/Ace_logo_small_light.png"
              alt=""
              width={44}
              height={44}
              className="h-11 w-11 rounded-[10px] object-contain bg-slate-900"
            />
            <div>
              <div className="text-xl font-extrabold tracking-tight text-slate-900">
                Aceolution <span className="af-title-accent">Finance</span>
              </div>
              <div className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                Expense Approval &amp; Tracking
              </div>
            </div>
          </div>
          <div className="mb-2 inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-bold tracking-wide text-[var(--af-accent)] uppercase">
            Protected demo guide
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Demo <span className="af-title-accent">Access</span>
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Enter the access password to view test accounts and the full workflow
            guide. Share this page link freely — only people with the password can
            open the details.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
            <label className="block text-sm font-bold text-slate-800" htmlFor="demo-gate-password">
              Access password <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <input
                id="demo-gate-password"
                type={showPassword ? "text" : "password"}
                className="af-input login-input login-input--password w-full"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter access password"
                autoComplete="current-password"
                autoFocus
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-slate-400 bg-slate-100 p-0 text-slate-700 hover:bg-slate-200 cursor-pointer"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <path d="M1 1l22 22" />
                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-[10px] bg-[var(--af-navy)] py-3.5 text-[0.95rem] font-bold text-white shadow-lg shadow-[var(--af-navy)]/15 transition-all hover:bg-[var(--af-navy-soft)] cursor-pointer"
            >
              Unlock Demo Guide →
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            Need the access password? Ask the Aceolution Finance team.
          </p>
        </div>
      </div>
    </div>
  );
}
