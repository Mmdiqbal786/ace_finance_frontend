"use client";

import React, { useEffect, useState } from "react";
import FormField, { RequiredFieldsNote } from "../FormField";
import { useFormValidation } from "../../hooks/useFormValidation";
import { API_URL } from "../../lib/api";
import { readApiError } from "../../lib/apiError";
import {
  AuthUser,
  authHeaders,
  setAuth,
  updateStoredUser,
} from "../../lib/auth";
import { validatePassword, validatePersonName } from "../../lib/validation";
import { toast } from "../../lib/toast";

interface ProfilePanelProps {
  currentUser: AuthUser;
  onProfileUpdated?: (user: AuthUser) => void;
}

type ProfileField = "name";
type PasswordField = "currentPassword" | "newPassword" | "confirmPassword";

const ROLE_LABELS: Record<AuthUser["role"], string> = {
  ADMIN: "Administrator",
  APPROVER: "Approver",
  PROCESSOR: "Processor",
  REQUESTER: "Requester",
};

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

export default function ProfilePanel({ currentUser, onProfileUpdated }: ProfilePanelProps) {
  const [profile, setProfile] = useState({
    name: currentUser.name,
    email: currentUser.email,
    role: currentUser.role,
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [totpLoading, setTotpLoading] = useState(true);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpBusy, setTotpBusy] = useState(false);
  const [totpError, setTotpError] = useState("");
  const [totpSetup, setTotpSetup] = useState<{
    secret: string;
    qrCodeDataUrl: string;
  } | null>(null);
  const [totpEnableCode, setTotpEnableCode] = useState("");
  const [totpDisablePassword, setTotpDisablePassword] = useState("");
  const [totpDisableCode, setTotpDisableCode] = useState("");
  const [totpDisableCodeSent, setTotpDisableCodeSent] = useState(false);
  const [totpDisableEmailHint, setTotpDisableEmailHint] = useState("");
  const [totpDisableResendCooldown, setTotpDisableResendCooldown] = useState(0);
  const [showTotpDisablePassword, setShowTotpDisablePassword] = useState(false);

  const profileForm = useFormValidation<ProfileField>();
  const passwordForm = useFormValidation<PasswordField>();

  // Show cached user immediately; refresh from API in the background (no second loader).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/users/me`, { headers: authHeaders() });
        if (!res.ok) throw new Error(await readApiError(res, "Failed to load profile."));
        const data = await res.json();
        if (cancelled) return;
        setProfile({
          name: data.name,
          email: data.email,
          role: data.role,
        });
        setEditName(data.name);
        updateStoredUser({ name: data.name, email: data.email, role: data.role });
        onProfileUpdated?.({
          ...currentUser,
          name: data.name,
          email: data.email,
          role: data.role,
        });
      } catch (err: any) {
        if (!cancelled) toast.error(err.message || "Failed to load profile.");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setTotpLoading(true);
      try {
        const res = await fetch(`${API_URL}/auth/totp/status`, { headers: authHeaders() });
        if (!res.ok) throw new Error(await readApiError(res, "Failed to load authenticator status."));
        const data = await res.json();
        if (!cancelled) setTotpEnabled(Boolean(data.enabled));
      } catch (err: any) {
        if (!cancelled) toast.error(err.message || "Failed to load authenticator status.");
      } finally {
        if (!cancelled) setTotpLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSetupTotp = async () => {
    setTotpBusy(true);
    setTotpError("");
    try {
      const res = await fetch(`${API_URL}/auth/totp/setup`, {
        method: "POST",
        headers: authHeaders() as HeadersInit,
      });
      if (!res.ok) throw new Error(await readApiError(res, "Failed to start authenticator setup."));
      const data = await res.json();
      setTotpSetup({ secret: data.secret, qrCodeDataUrl: data.qrCodeDataUrl });
      setTotpEnableCode("");
    } catch (err: any) {
      setTotpError(err.message || "Failed to start authenticator setup.");
    } finally {
      setTotpBusy(false);
    }
  };

  const handleEnableTotp = async () => {
    if (!/^\d{6}$/.test(totpEnableCode)) {
      setTotpError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setTotpBusy(true);
    setTotpError("");
    try {
      const res = await fetch(`${API_URL}/auth/totp/enable`, {
        method: "POST",
        headers: authHeaders() as HeadersInit,
        body: JSON.stringify({ code: totpEnableCode }),
      });
      if (!res.ok) throw new Error(await readApiError(res, "Failed to enable authenticator."));
      setTotpEnabled(true);
      setTotpSetup(null);
      setTotpEnableCode("");
      toast.success("Authenticator app enabled.");
    } catch (err: any) {
      setTotpError(err.message || "Failed to enable authenticator.");
    } finally {
      setTotpBusy(false);
    }
  };

  const startTotpDisableResendCooldown = (seconds = 30) => {
    setTotpDisableResendCooldown(seconds);
    const timer = window.setInterval(() => {
      setTotpDisableResendCooldown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendDisableEmailCode = async () => {
    if (!totpDisablePassword) {
      setTotpError("Enter your current password.");
      return;
    }
    setTotpBusy(true);
    setTotpError("");
    try {
      const res = await fetch(`${API_URL}/auth/totp/disable/send-code`, {
        method: "POST",
        headers: authHeaders() as HeadersInit,
        body: JSON.stringify({ password: totpDisablePassword }),
      });
      if (!res.ok) throw new Error(await readApiError(res, "Failed to send email code."));
      const data = await res.json();
      setTotpDisableCodeSent(true);
      setTotpDisableEmailHint(data.emailHint || "");
      setTotpDisableCode("");
      startTotpDisableResendCooldown(30);
      toast.success(data.message || "Email code sent.");
    } catch (err: any) {
      setTotpError(err.message || "Failed to send email code.");
    } finally {
      setTotpBusy(false);
    }
  };

  const handleDisableTotp = async () => {
    if (!totpDisablePassword) {
      setTotpError("Enter your current password.");
      return;
    }
    if (!totpDisableCodeSent) {
      setTotpError("Send an email code first.");
      return;
    }
    if (!/^\d{6}$/.test(totpDisableCode)) {
      setTotpError("Enter the 6-digit code from your email.");
      return;
    }
    setTotpBusy(true);
    setTotpError("");
    try {
      const res = await fetch(`${API_URL}/auth/totp/disable`, {
        method: "POST",
        headers: authHeaders() as HeadersInit,
        body: JSON.stringify({
          password: totpDisablePassword,
          code: totpDisableCode,
        }),
      });
      if (!res.ok) throw new Error(await readApiError(res, "Failed to disable authenticator."));
      setTotpEnabled(false);
      setTotpDisablePassword("");
      setTotpDisableCode("");
      setTotpDisableCodeSent(false);
      setTotpDisableEmailHint("");
      toast.success("Authenticator app disabled.");
    } catch (err: any) {
      setTotpError(err.message || "Failed to disable authenticator.");
    } finally {
      setTotpBusy(false);
    }
  };

  const handleCancelEdit = () => {
    setEditName(profile.name);
    setEditingProfile(false);
    setProfileError("");
    profileForm.clearAll();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = profileForm.validateAll({
      name: () => validatePersonName(editName, "Name"),
    });
    if (!ok) {
      profileForm.focusFirstInvalid();
      setProfileError("Please fix the highlighted fields.");
      return;
    }

    setProfileSaving(true);
    setProfileError("");
    try {
      const res = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: authHeaders() as HeadersInit,
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (!res.ok) throw new Error(await readApiError(res, "Failed to update profile."));
      const data = await res.json();
      setProfile({ name: data.name, email: data.email, role: data.role });
      setEditName(data.name);
      setEditingProfile(false);
      updateStoredUser({ name: data.name });
      onProfileUpdated?.({ ...currentUser, name: data.name });
      toast.success("Profile updated successfully.");
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = passwordForm.validateAll({
      currentPassword: () =>
        currentPassword ? "" : "Enter your current password.",
      newPassword: () => validatePassword(newPassword, { label: "New password" }),
      confirmPassword: () => {
        if (!confirmPassword) return "Confirm your new password.";
        if (confirmPassword !== newPassword) return "Passwords do not match.";
        return "";
      },
    });
    if (!ok) {
      passwordForm.focusFirstInvalid();
      setPasswordError("Please fix the highlighted fields.");
      return;
    }

    setPasswordSaving(true);
    setPasswordError("");
    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        headers: authHeaders() as HeadersInit,
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      if (!res.ok) throw new Error(await readApiError(res, "Failed to change password."));
      const data = await res.json();
      setAuth(data.access_token, data.user);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      passwordForm.clearAll();
      onProfileUpdated?.(data.user);
      toast.success("Password changed successfully.");
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
      <div className="portal-card rounded-2xl p-6 sm:p-8">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Profile Details</h2>
            <p className="mt-1 text-sm text-slate-600">Your account information</p>
          </div>
          {!editingProfile && (
            <button
              type="button"
              onClick={() => setEditingProfile(true)}
              className="inline-flex h-9 items-center rounded-lg border border-slate-400 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
            >
              Edit Profile
            </button>
          )}
        </div>

        {!editingProfile ? (
          <dl className="mt-5 space-y-4">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Name</dt>
              <dd className="mt-1 text-base font-semibold text-slate-900">{profile.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Email</dt>
              <dd className="mt-1 text-base font-medium text-slate-800">{profile.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Role</dt>
              <dd className="mt-1">
                <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-[var(--af-accent)]">
                  {ROLE_LABELS[profile.role]}
                </span>
              </dd>
            </div>
          </dl>
        ) : (
          <form onSubmit={handleSaveProfile} noValidate className="mt-5 flex flex-col gap-4">
            <RequiredFieldsNote />
            <FormField label="Name" htmlFor="profile-name" required error={profileForm.errors.name}>
              <input
                id="profile-name"
                type="text"
                className={profileForm.fieldClass("af-input", "name")}
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value);
                  profileForm.clearError("name");
                  if (profileError) setProfileError("");
                }}
                onBlur={() => profileForm.onBlur("name", validatePersonName(editName, "Name"))}
                disabled={profileSaving}
              />
            </FormField>
            <FormField label="Email Address" hint="Email cannot be changed">
              <div
                aria-readonly="true"
                className="flex min-h-[42px] items-center rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 cursor-not-allowed select-none"
              >
                {profile.email}
              </div>
            </FormField>
            <FormField label="Role" hint="Role is managed by your administrator">
              <div
                aria-readonly="true"
                className="flex min-h-[42px] items-center rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 cursor-not-allowed select-none"
              >
                <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-[var(--af-accent)]">
                  {ROLE_LABELS[profile.role]}
                </span>
              </div>
            </FormField>

            {profileError && (
              <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
                {profileError}
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={profileSaving}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-400 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={profileSaving}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--af-navy)] px-5 text-sm font-bold text-white hover:bg-[var(--af-navy-soft)] disabled:opacity-60 cursor-pointer"
              >
                {profileSaving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="portal-card rounded-2xl p-6 sm:p-8">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-lg font-bold text-slate-900">Change Password</h2>
          <p className="mt-1 text-sm text-slate-600">
            Update your password using your current one
          </p>
        </div>

        <form onSubmit={handleChangePassword} noValidate className="mt-5 flex flex-col gap-4">
          <RequiredFieldsNote />

          <FormField
            label="Current Password"
            htmlFor="currentPassword"
            required
            error={passwordForm.errors.currentPassword}
          >
            <PasswordInput
              id="currentPassword"
              value={currentPassword}
              onChange={(value) => {
                setCurrentPassword(value);
                passwordForm.clearError("currentPassword");
                if (passwordError) setPasswordError("");
              }}
              className={passwordForm.fieldClass("af-input", "currentPassword")}
              autoComplete="current-password"
              disabled={passwordSaving}
              visible={showCurrent}
              onToggleVisible={() => setShowCurrent((v) => !v)}
            />
          </FormField>

          <FormField
            label="New Password"
            htmlFor="newPassword"
            required
            error={passwordForm.errors.newPassword}
            hint="At least 8 characters, with a letter and a number"
          >
            <PasswordInput
              id="newPassword"
              value={newPassword}
              onChange={(value) => {
                setNewPassword(value);
                passwordForm.clearError("newPassword");
                if (passwordError) setPasswordError("");
              }}
              onBlur={() =>
                passwordForm.onBlur("newPassword", validatePassword(newPassword, { label: "New password" }))
              }
              className={passwordForm.fieldClass("af-input", "newPassword")}
              autoComplete="new-password"
              disabled={passwordSaving}
              visible={showNew}
              onToggleVisible={() => setShowNew((v) => !v)}
            />
          </FormField>

          <FormField
            label="Confirm New Password"
            htmlFor="confirmPassword"
            required
            error={passwordForm.errors.confirmPassword}
          >
            <PasswordInput
              id="confirmPassword"
              value={confirmPassword}
              onChange={(value) => {
                setConfirmPassword(value);
                passwordForm.clearError("confirmPassword");
                if (passwordError) setPasswordError("");
              }}
              className={passwordForm.fieldClass("af-input", "confirmPassword")}
              autoComplete="new-password"
              disabled={passwordSaving}
              visible={showConfirm}
              onToggleVisible={() => setShowConfirm((v) => !v)}
            />
          </FormField>

          {passwordError && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
              {passwordError}
            </div>
          )}

          <button
            type="submit"
            disabled={passwordSaving}
            className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[var(--af-navy)] px-5 text-sm font-bold text-white hover:bg-[var(--af-navy-soft)] disabled:opacity-60 cursor-pointer sm:w-auto"
          >
            {passwordSaving ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      <div className="portal-card rounded-2xl p-6 sm:p-8 lg:col-span-2">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Authenticator App (optional)</h2>
            <p className="mt-1 text-sm text-slate-600">
              {currentUser.role === "ADMIN"
                ? "Admins are not required to use email verification. Optionally enable an authenticator app for sign-in."
                : "Email verification is always required at sign-in. Optionally also enable an authenticator app so you can use either method."}
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {totpLoading ? (
              <p className="text-sm text-slate-600">Loading security settings...</p>
            ) : totpEnabled ? (
              <>
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                  Authenticator is enabled for your account.
                </p>
                <p className="text-sm text-slate-600">
                  To disable it (for example after reinstalling the app), enter your password and
                  confirm with an email code — not the authenticator app code.
                </p>
                <FormField label="Current password" htmlFor="totp-disable-password" required>
                  <PasswordInput
                    id="totp-disable-password"
                    value={totpDisablePassword}
                    onChange={(value) => {
                      setTotpDisablePassword(value);
                      if (totpError) setTotpError("");
                    }}
                    className="af-input"
                    autoComplete="current-password"
                    disabled={totpBusy}
                    visible={showTotpDisablePassword}
                    onToggleVisible={() => setShowTotpDisablePassword((v) => !v)}
                  />
                </FormField>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSendDisableEmailCode}
                    disabled={totpBusy || totpDisableResendCooldown > 0}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-400 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
                  >
                    {totpBusy
                      ? "Sending..."
                      : totpDisableResendCooldown > 0
                        ? `Resend in ${totpDisableResendCooldown}s`
                        : totpDisableCodeSent
                          ? "Resend email code"
                          : "Send email code"}
                  </button>
                  {totpDisableCodeSent && totpDisableEmailHint && (
                    <span className="text-xs text-slate-500">Sent to {totpDisableEmailHint}</span>
                  )}
                </div>
                {totpDisableCodeSent && (
                  <FormField
                    label="Email verification code"
                    htmlFor="totp-disable-code"
                    required
                    hint="Check your inbox for the 6-digit code"
                  >
                    <input
                      id="totp-disable-code"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      className="af-input tracking-[0.3em] text-center font-bold"
                      value={totpDisableCode}
                      onChange={(e) => {
                        setTotpDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                        if (totpError) setTotpError("");
                      }}
                      placeholder="••••••"
                    />
                  </FormField>
                )}
                {totpError && (
                  <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
                    {totpError}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleDisableTotp}
                  disabled={totpBusy || !totpDisableCodeSent || totpDisableCode.length !== 6}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-300 bg-white px-5 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-60 cursor-pointer"
                >
                  {totpBusy ? "Disabling..." : "Disable Authenticator"}
                </button>
              </>
            ) : totpSetup ? (
              <>
                <p className="text-sm text-slate-600">
                  Scan this QR code in your authenticator app, or enter the secret manually.
                </p>
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={totpSetup.qrCodeDataUrl}
                    alt="Authenticator QR code"
                    className="h-[180px] w-[180px] rounded-xl border border-slate-300 bg-white p-2"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Manual secret
                    </p>
                    <p className="mt-1 break-all rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-800">
                      {totpSetup.secret}
                    </p>
                  </div>
                </div>
                <FormField label="Enter code from app to confirm" htmlFor="totp-enable-code" required>
                  <input
                    id="totp-enable-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="af-input tracking-[0.3em] text-center font-bold"
                    value={totpEnableCode}
                    onChange={(e) => setTotpEnableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="••••••"
                  />
                </FormField>
                {totpError && (
                  <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
                    {totpError}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleEnableTotp}
                    disabled={totpBusy || totpEnableCode.length !== 6}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--af-navy)] px-5 text-sm font-bold text-white hover:bg-[var(--af-navy-soft)] disabled:opacity-60 cursor-pointer"
                  >
                    {totpBusy ? "Enabling..." : "Confirm & Enable"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTotpSetup(null);
                      setTotpEnableCode("");
                      setTotpError("");
                    }}
                    disabled={totpBusy}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-400 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600">
                  {currentUser.role === "ADMIN"
                    ? "Not enabled yet. Until you enable it, Admin sign-in is password only (no email code)."
                    : "Not enabled yet. You can still sign in with the email verification code."}
                </p>
                {totpError && (
                  <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
                    {totpError}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleSetupTotp}
                  disabled={totpBusy}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--af-navy)] px-5 text-sm font-bold text-white hover:bg-[var(--af-navy-soft)] disabled:opacity-60 cursor-pointer"
                >
                  {totpBusy ? "Preparing..." : "Set up Authenticator App"}
                </button>
              </>
            )}
          </div>
        </div>
    </div>
  );
}
