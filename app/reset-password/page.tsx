"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useFormValidation } from "../../hooks/useFormValidation";
import { validatePassword } from "../../lib/validation";
import FormField, { RequiredFieldsNote } from "../../components/FormField";
import { API_URL } from "../../lib/api";
import { readApiError } from "../../lib/apiError";

type ResetField = "newPassword" | "confirmPassword";

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <path d="M1 1l22 22" />
        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  onBlur,
  className,
  autoComplete,
  disabled,
  visible,
  onToggleVisible,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  className: string;
  autoComplete: string;
  disabled?: boolean;
  visible: boolean;
  onToggleVisible: () => void;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`${className} pr-12`}
        autoComplete={autoComplete}
        disabled={disabled}
      />
      <button
        type="button"
        className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-slate-400 bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
        onClick={onToggleVisible}
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        <EyeIcon open={visible} />
      </button>
    </div>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [checkingToken, setCheckingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const form = useFormValidation<ResetField>();

  useEffect(() => {
    let cancelled = false;

    async function checkToken() {
      if (!token) {
        setTokenValid(false);
        setCheckingToken(false);
        return;
      }
      try {
        const res = await fetch(
          `${API_URL}/auth/validate-reset-token?token=${encodeURIComponent(token)}`,
        );
        if (!res.ok) {
          if (!cancelled) setTokenValid(false);
          return;
        }
        const data = (await res.json()) as { valid?: boolean };
        if (!cancelled) setTokenValid(Boolean(data.valid));
      } catch {
        if (!cancelled) setTokenValid(false);
      } finally {
        if (!cancelled) setCheckingToken(false);
      }
    }

    checkToken();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !tokenValid) {
      setError("Invalid or missing reset link. Please request a new one.");
      return;
    }

    const ok = form.validateAll({
      newPassword: () => validatePassword(newPassword),
      confirmPassword: () => {
        if (!confirmPassword) return "Confirm your new password.";
        if (confirmPassword !== newPassword) return "Passwords do not match.";
        return "";
      },
    });
    if (!ok) {
      form.focusFirstInvalid();
      setError("Please fix the highlighted fields below.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, "Failed to reset password."));
      }
      const data = await res.json();
      setSuccess(data.message);
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="portal-page login-page relative flex flex-1 items-center justify-center p-4 py-6 sm:py-8">
      <div className="relative z-10 w-full max-w-[420px]">
        <div className="portal-card rounded-[20px] border-[1.5px] border-slate-500 p-8 shadow-lg">
          <h1 className="text-2xl font-extrabold text-slate-900">
            New <span className="af-title-accent">Password</span>
          </h1>
          <p className="mt-2 mb-7 text-sm font-medium text-slate-700">
            Choose a new password for your account.
          </p>

          {!checkingToken && (!token || !tokenValid) && (
            <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              This reset link is invalid or has expired.{" "}
              <Link href="/forgot-password/" className="font-semibold underline">
                Request a new one
              </Link>
              .
            </div>
          )}

          {checkingToken ? (
            <p className="text-sm font-medium text-slate-600">Checking reset link...</p>
          ) : success ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
                {success}
              </div>
              <Link
                href="/login/"
                className="inline-flex w-full items-center justify-center rounded-[10px] bg-[var(--af-navy)] py-3.5 text-sm font-bold text-white hover:bg-[var(--af-navy-soft)]"
              >
                Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <RequiredFieldsNote className="-mt-1 mb-1" />

              <FormField
                label="New Password"
                htmlFor="newPassword"
                required
                error={form.errors.newPassword}
                hint="At least 8 characters, with a letter and a number"
              >
                <PasswordInput
                  id="newPassword"
                  value={newPassword}
                  onChange={(value) => {
                    setNewPassword(value);
                    form.clearError("newPassword");
                    if (error) setError("");
                  }}
                  onBlur={() => form.onBlur("newPassword", validatePassword(newPassword))}
                  className={form.fieldClass("login-input af-input", "newPassword")}
                  autoComplete="new-password"
                  disabled={loading || !tokenValid}
                  visible={showNew}
                  onToggleVisible={() => setShowNew((v) => !v)}
                />
              </FormField>

              <FormField
                label="Confirm New Password"
                htmlFor="confirmPassword"
                required
                error={form.errors.confirmPassword}
              >
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(value) => {
                    setConfirmPassword(value);
                    form.clearError("confirmPassword");
                    if (error) setError("");
                  }}
                  className={form.fieldClass("login-input af-input", "confirmPassword")}
                  autoComplete="new-password"
                  disabled={loading || !tokenValid}
                  visible={showConfirm}
                  onToggleVisible={() => setShowConfirm((v) => !v)}
                />
              </FormField>

              {error && (
                <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !tokenValid}
                className="w-full rounded-[10px] bg-[var(--af-navy)] py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-[var(--af-navy-soft)] disabled:opacity-60 cursor-pointer"
              >
                {loading ? "Saving..." : "Save New Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="portal-page flex flex-1 items-center justify-center py-20">
          <p className="text-sm font-medium text-slate-600">Loading...</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
