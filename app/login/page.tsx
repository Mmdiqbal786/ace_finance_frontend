'use client';
import Link from 'next/link';
import { useState } from 'react';
import FullPageLoader from '../../components/FullPageLoader';
import { useBlockAuthenticatedGuestPages } from '../../hooks/useBlockAuthenticatedGuestPages';
import { setAuth } from '../../lib/auth';
import { getDefaultDashboardRoute } from '../../lib/dashboard/routes';
import { API_URL } from '../../lib/api';
import FormField from '../../components/FormField';
import { useFormValidation } from '../../hooks/useFormValidation';
import { validateLoginEmail, validateLoginPassword } from '../../lib/validation';

function LoginSpinner({ className = "h-5 w-5 text-white" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

type LoginField = "email" | "password";

export default function LoginPage() {
  const guestAllowed = useBlockAuthenticatedGuestPages();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const form = useFormValidation<LoginField>();

  const showFullPageLoader = !guestAllowed || loading;
  const loaderMessage = !guestAllowed
    ? 'Redirecting to dashboard...'
    : loading
      ? 'Signing you in...'
      : 'Loading Aceolution Finance...';

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const ok = form.validateAll({
      email: () => validateLoginEmail(email),
      password: () => validateLoginPassword(password),
    });

    if (!ok) {
      form.focusFirstInvalid();
      setError("Please fix the highlighted fields below.");
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Login failed');
      }
      const data = await res.json();
      setAuth(data.access_token, data.user);
      if (data.user.mustChangePassword) {
        window.location.href = "/set-password/";
      } else {
        window.location.href = getDefaultDashboardRoute(data.user.role);
      }
      return;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <>
      {showFullPageLoader && <FullPageLoader message={loaderMessage} />}

      {guestAllowed && (
    <div className="portal-page login-page relative flex flex-1 items-center justify-center p-4 py-6 sm:py-8">
      <div className="relative z-10 w-full max-w-[420px]">
        <div className="portal-card rounded-[20px] border-[1.5px] border-slate-500 p-6 shadow-lg sm:p-8">
          <h1 className="text-2xl font-extrabold text-slate-900">
            Sign <span className="af-title-accent">In</span>
          </h1>

          <form onSubmit={handleLogin} noValidate className="mt-7 flex flex-col gap-4" suppressHydrationWarning>
            <FormField label="Email Address" htmlFor="login-email" required error={form.errors.email}>
              <input
                id="login-email"
                type="email"
                className={form.fieldClass("login-input af-input", "email")}
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  form.clearError("email");
                  if (error) setError("");
                }}
                onBlur={() => form.onBlur("email", validateLoginEmail(email))}
                autoComplete="email"
                placeholder="you@aceolution.com"
                disabled={loading}
                aria-invalid={Boolean(form.errors.email)}
              />
            </FormField>

            <FormField label="Password" htmlFor="login-password" required error={form.errors.password}>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className={form.fieldClass("login-input af-input login-input--password", "password")}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    form.clearError("password");
                    if (error) setError("");
                  }}
                  onBlur={() => form.onBlur("password", validateLoginPassword(password))}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  disabled={loading}
                  aria-invalid={Boolean(form.errors.password)}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-slate-400 bg-slate-100 p-0 text-slate-700 hover:bg-slate-200 hover:text-slate-900 cursor-pointer"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <path d="M1 1l22 22" />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </FormField>

            <div className="text-right -mt-1">
              <Link
                href="/forgot-password/"
                className="text-sm font-semibold text-[var(--af-accent)] hover:text-[var(--af-accent-soft)] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
                ⚠️ {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full rounded-[10px] bg-[var(--af-navy)] py-3.5 text-[0.95rem] font-bold text-white shadow-lg shadow-[var(--af-navy)]/15 transition-all hover:bg-[var(--af-navy-soft)] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              Sign In →
            </button>
          </form>
        </div>
      </div>
    </div>
      )}
    </>
  );
}
