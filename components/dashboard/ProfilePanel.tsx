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
    </div>
  );
}
