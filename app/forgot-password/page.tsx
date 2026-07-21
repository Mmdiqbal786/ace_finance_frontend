"use client";

import Link from "next/link";
import { useState } from "react";
import FullPageLoader from "../../components/FullPageLoader";
import { useBlockAuthenticatedGuestPages } from "../../hooks/useBlockAuthenticatedGuestPages";
import { useFormValidation } from "../../hooks/useFormValidation";
import { validateLoginEmail } from "../../lib/validation";
import FormField from "../../components/FormField";
import AuthSplitLayout from "../../components/AuthSplitLayout";
import { API_URL } from "../../lib/api";
import { readApiError } from "../../lib/apiError";

type ForgotField = "email";

export default function ForgotPasswordPage() {
  const guestAllowed = useBlockAuthenticatedGuestPages();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const form = useFormValidation<ForgotField>();

  if (!guestAllowed) {
    return <FullPageLoader message="Redirecting to dashboard..." />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = form.validateAll({
      email: () => validateLoginEmail(email),
    });
    if (!ok) {
      form.focusFirstInvalid();
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, "Failed to send reset email."));
      }
      const data = await res.json();
      setSuccess(data.message);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Forgot <span className="af-title-accent">Password</span>
          </h1>
          <p className="mt-2 mb-7 text-sm font-medium text-slate-700">
            Enter your email and we&apos;ll send you a link to set a new password.
          </p>

          {success ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
                {success}
              </div>
              <Link
                href="/login/"
                className="inline-flex w-full items-center justify-center rounded-[10px] bg-[var(--af-navy)] py-3.5 text-sm font-bold text-white hover:bg-[var(--af-navy-soft)]"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <FormField label="Email Address" htmlFor="forgot-email" required error={form.errors.email}>
                <input
                  id="forgot-email"
                  type="email"
                  className={form.fieldClass("login-input af-input", "email")}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    form.clearError("email");
                    if (error) setError("");
                  }}
                  onBlur={() => form.onBlur("email", validateLoginEmail(email))}
                  autoComplete="email"
                  placeholder="you@aceolution.com"
                  disabled={loading}
                />
              </FormField>

              {error && (
                <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-[10px] bg-[var(--af-navy)] py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-[var(--af-navy-soft)] disabled:opacity-60 cursor-pointer"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}

          {!success && (
            <p className="mt-5 text-center text-sm text-slate-600">
              <Link href="/login/" className="font-semibold text-[var(--af-accent)] hover:underline">
                Back to Sign In
              </Link>
            </p>
          )}
    </AuthSplitLayout>
  );
}
