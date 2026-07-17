"use client";

import { useEffect, useState } from "react";
import {
  authHeaders,
  getUser,
  isAuthenticated,
  logout,
  mustChangePassword,
  setAuth,
} from "../../lib/auth";
import { getDefaultDashboardRoute } from "../../lib/dashboard/routes";
import { API_URL } from "../../lib/api";
import BrandLogo from "../../components/BrandLogo";
import { useFormValidation } from "../../hooks/useFormValidation";
import { validatePassword } from "../../lib/validation";
import FormField, { RequiredFieldsNote } from "../../components/FormField";
import { readApiError } from "../../lib/apiError";

type SetPasswordField = "currentPassword" | "newPassword" | "confirmPassword";

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <path d="M1 1l22 22" />
        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      </svg>
    );
  }
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
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
        className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-slate-400 bg-slate-100 p-0 text-slate-700 hover:bg-slate-200 hover:text-slate-900 cursor-pointer"
        onClick={onToggleVisible}
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        <EyeIcon open={visible} />
      </button>
    </div>
  );
}

export default function SetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const form = useFormValidation<SetPasswordField>();

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.replace("/login/");
      return;
    }
    if (!mustChangePassword()) {
      const user = getUser();
      window.location.replace(user ? getDefaultDashboardRoute(user.role) : "/dashboard/");
      return;
    }
    setReady(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = form.validateAll({
      currentPassword: () =>
        currentPassword ? "" : "Enter the temporary password from your welcome email.",
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
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        headers: authHeaders() as HeadersInit,
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, "Failed to update password."));
      }
      const data = await res.json();
      setAuth(data.access_token, data.user);
      window.location.href = getDefaultDashboardRoute(data.user.role);
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="portal-page flex flex-1 items-center justify-center py-20">
        <p className="text-sm font-medium text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="portal-page relative flex flex-1 items-center justify-center p-4 py-6 sm:py-8">
      <div className="relative z-10 w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <BrandLogo full showWordmark />
          <p className="mt-4 text-sm font-semibold text-slate-700">Set a new password</p>
        </div>

        <div className="portal-card rounded-[20px] border-[1.5px] border-slate-500 p-8 shadow-lg">
          <h1 className="text-2xl font-extrabold text-slate-900">
            Create <span className="af-title-accent">Password</span>
          </h1>
          <p className="mt-2 mb-7 text-sm font-medium text-slate-700">
            For security, replace your temporary password before accessing the dashboard.
          </p>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <RequiredFieldsNote className="-mt-1 mb-1" />

            <FormField
              label="Temporary Password"
              htmlFor="currentPassword"
              required
              error={form.errors.currentPassword}
            >
              <PasswordInput
                id="currentPassword"
                value={currentPassword}
                onChange={(value) => {
                  setCurrentPassword(value);
                  form.clearError("currentPassword");
                  if (error) setError("");
                }}
                className={form.fieldClass("af-input", "currentPassword")}
                autoComplete="current-password"
                disabled={loading}
                visible={showCurrent}
                onToggleVisible={() => setShowCurrent((v) => !v)}
              />
            </FormField>

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
                className={form.fieldClass("af-input", "newPassword")}
                autoComplete="new-password"
                disabled={loading}
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
                className={form.fieldClass("af-input", "confirmPassword")}
                autoComplete="new-password"
                disabled={loading}
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
              disabled={loading}
              className="w-full rounded-[10px] bg-[var(--af-navy)] py-3.5 text-[0.95rem] font-bold text-white shadow-lg transition-all hover:bg-[var(--af-navy-soft)] disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Saving..." : "Save Password & Continue"}
            </button>
          </form>

          <button
            type="button"
            onClick={logout}
            className="mt-4 w-full text-center text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Sign out instead
          </button>
        </div>
      </div>
    </div>
  );
}
