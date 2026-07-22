"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  authHeaders,
  getUser,
  isAuthenticated,
  logout,
  mustChangePassword,
  mustSetupTotp,
  setAuth,
  updateStoredUser,
} from "../../lib/auth";
import { API_URL } from "../../lib/api";
import { readApiError } from "../../lib/apiError";
import FormField from "../../components/FormField";
import AuthSplitLayout from "../../components/AuthSplitLayout";
import { getDefaultDashboardRoute } from "../../lib/dashboard/routes";

export default function SetupAuthenticatorPage() {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [setup, setSetup] = useState<{
    secret: string;
    qrCodeDataUrl: string;
  } | null>(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.replace("/login/");
      return;
    }
    if (mustChangePassword()) {
      window.location.replace("/set-password/");
      return;
    }
    if (!mustSetupTotp()) {
      const user = getUser();
      window.location.replace(
        user ? getDefaultDashboardRoute(user.role) : "/dashboard/",
      );
      return;
    }
    setReady(true);
  }, []);

  async function startSetup() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/totp/setup`, {
        method: "POST",
        headers: authHeaders() as HeadersInit,
      });
      if (!res.ok) throw new Error(await readApiError(res, "Failed to start authenticator setup."));
      const data = await res.json();
      setSetup({ secret: data.secret, qrCodeDataUrl: data.qrCodeDataUrl });
      setCode("");
    } catch (err: any) {
      setError(err.message || "Failed to start authenticator setup.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (ready && !setup) {
      void startSetup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  async function handleEnable(e: FormEvent) {
    e.preventDefault();
    const cleaned = code.replace(/\s/g, "");
    if (!/^\d{6}$/.test(cleaned)) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/totp/enable`, {
        method: "POST",
        headers: authHeaders() as HeadersInit,
        body: JSON.stringify({ code: cleaned }),
      });
      if (!res.ok) throw new Error(await readApiError(res, "Failed to enable authenticator."));
      const data = await res.json();
      if (data.access_token && data.user) {
        setAuth(data.access_token, {
          ...data.user,
          totpEnabled: true,
          mustSetupTotp: false,
        });
      } else {
        // Backend may be an older build without a refreshed token — still clear the local gate.
        updateStoredUser({ totpEnabled: true, mustSetupTotp: false });
      }
      const user = getUser();
      window.location.href = user
        ? getDefaultDashboardRoute(user.role)
        : "/dashboard/";
    } catch (err: any) {
      setError(err.message || "Failed to enable authenticator.");
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className="portal-page flex flex-1 items-center justify-center py-20">
        <p className="text-sm font-medium text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <AuthSplitLayout>
      <h1 className="text-2xl font-extrabold text-slate-900">
        Set up <span className="af-title-accent">Authenticator</span>
      </h1>
      <p className="mt-2 mb-6 text-sm font-medium leading-relaxed text-slate-700">
        Authenticator app setup is required for your role. Scan the QR code with Google
        Authenticator, Microsoft Authenticator, or a similar app, then enter a 6-digit code to
        continue.
      </p>

      {!setup ? (
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={startSetup}
            disabled={busy}
            className="w-full rounded-[10px] bg-[var(--af-navy)] py-3.5 text-[0.95rem] font-bold text-white shadow-lg transition-all hover:bg-[var(--af-navy-soft)] disabled:opacity-60 cursor-pointer"
          >
            {busy ? "Preparing..." : "Generate QR Code"}
          </button>
        </div>
      ) : (
        <form onSubmit={handleEnable} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={setup.qrCodeDataUrl}
              alt="Authenticator QR code"
              className="h-[220px] w-[220px] rounded-lg bg-white p-2"
            />
            <p className="text-center text-xs text-slate-600">
              Or enter this key manually:
              <br />
              <code className="mt-1 inline-block break-all rounded bg-white px-2 py-1 text-[11px] font-bold text-slate-800">
                {setup.secret}
              </code>
            </p>
          </div>

          <FormField label="Authenticator code" htmlFor="setup-totp-code" required>
            <input
              id="setup-totp-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className="af-input login-input w-full"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                if (error) setError("");
              }}
              placeholder="6-digit code"
              disabled={busy}
              autoFocus
            />
          </FormField>

          {error && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || code.length !== 6}
            className="w-full rounded-[10px] bg-[var(--af-navy)] py-3.5 text-[0.95rem] font-bold text-white shadow-lg transition-all hover:bg-[var(--af-navy-soft)] disabled:opacity-60 cursor-pointer"
          >
            {busy ? "Enabling..." : "Confirm & Continue"}
          </button>

          <button
            type="button"
            onClick={startSetup}
            disabled={busy}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Generate a new QR code
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={logout}
        className="mt-5 w-full text-center text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
      >
        Sign out instead
      </button>
    </AuthSplitLayout>
  );
}
