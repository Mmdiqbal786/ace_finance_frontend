'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import FullPageLoader from '../../components/FullPageLoader';
import { useBlockAuthenticatedGuestPages } from '../../hooks/useBlockAuthenticatedGuestPages';
import { setAuth, getPostAuthDestination } from '../../lib/auth';
import { resolveAccessibleDashboardPath } from '../../lib/dashboard/routes';
import { API_URL } from '../../lib/api';
import FormField from '../../components/FormField';
import AuthSplitLayout from '../../components/AuthSplitLayout';
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
type TwoFactorMethod = "email" | "totp";

type ChallengeState = {
  challengeToken: string;
  methods: TwoFactorMethod[];
  emailHint: string;
  message: string;
};

function LoginForm() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const guestAllowed = useBlockAuthenticatedGuestPages(nextPath);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [challenge, setChallenge] = useState<ChallengeState | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpMethod, setOtpMethod] = useState<TwoFactorMethod>('email');
  const [resendCooldown, setResendCooldown] = useState(0);
  const form = useFormValidation<LoginField>();

  function goAfterLogin(user: Parameters<typeof getPostAuthDestination>[0]) {
    window.location.href = getPostAuthDestination(
      user,
      resolveAccessibleDashboardPath(user.role, nextPath),
    );
  }

  const showFullPageLoader = !guestAllowed;
  const loaderMessage = !guestAllowed
    ? 'Redirecting to dashboard...'
    : 'Loading Aceolution Finance...';

  function startResendCooldown(seconds = 30) {
    setResendCooldown(seconds);
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function fetchWithTimeout(
    input: string,
    init: RequestInit,
    timeoutMs = 70_000,
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } finally {
      window.clearTimeout(timer);
    }
  }

  function loginFetchError(err: any): string {
    if (err?.name === 'AbortError') {
      return 'The server took too long to respond. The API may be waking up on Render — wait ~1 minute and try again.';
    }
    const msg = String(err?.message || '');
    if (/failed to fetch|networkerror|load failed/i.test(msg)) {
      return 'Cannot reach the API. Check that the backend is awake, or open the API URL once to wake it, then try again.';
    }
    return msg || 'Login failed';
  }

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
      const res = await fetchWithTimeout(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message) ? data.message.join(' ') : data.message || 'Login failed',
        );
      }
      // Admin without authenticator: signed in immediately
      if (data.access_token && data.user) {
        setAuth(data.access_token, data.user);
        goAfterLogin(data.user);
        return;
      }
      if (!data.requires2fa || !data.challengeToken) {
        throw new Error('Unexpected login response. Please try again.');
      }
      const methods = (data.methods || ['email']) as TwoFactorMethod[];
      setChallenge({
        challengeToken: data.challengeToken,
        methods,
        emailHint: data.emailHint || email.trim().toLowerCase(),
        message: data.message || 'Enter your verification code.',
      });
      setOtpMethod(methods.includes('email') ? 'email' : methods[0]);
      setOtpCode('');
      startResendCooldown(30);
    } catch (err: any) {
      setError(loginFetchError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify2fa(e: React.FormEvent) {
    e.preventDefault();
    if (!challenge) return;
    const cleaned = otpCode.replace(/\s/g, '');
    if (!/^\d{6}$/.test(cleaned)) {
      setError('Enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetchWithTimeout(`${API_URL}/auth/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken: challenge.challengeToken,
          code: cleaned,
          method: otpMethod,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message) ? data.message.join(' ') : data.message || 'Verification failed',
        );
      }
      setAuth(data.access_token, data.user);
      goAfterLogin(data.user);
      return;
    } catch (err: any) {
      setError(loginFetchError(err));
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (!challenge || resendCooldown > 0) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithTimeout(`${API_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeToken: challenge.challengeToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message) ? data.message.join(' ') : data.message || 'Could not resend code',
        );
      }
      setChallenge({
        challengeToken: data.challengeToken,
        methods: data.methods || challenge.methods,
        emailHint: data.emailHint || challenge.emailHint,
        message: data.message || challenge.message,
      });
      setOtpMethod('email');
      startResendCooldown(30);
    } catch (err: any) {
      setError(loginFetchError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {showFullPageLoader && <FullPageLoader message={loaderMessage} />}

      {guestAllowed && (
    <AuthSplitLayout>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {challenge ? (
              <>Verify <span className="af-title-accent">Sign In</span></>
            ) : (
              <>Sign <span className="af-title-accent">In</span></>
            )}
          </h1>

          {!challenge ? (
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

            {loading && !challenge && (
              <p className="text-center text-xs font-medium text-slate-500">
                Connecting to API… On Render free tier the first request can take up to ~50 seconds.
              </p>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full rounded-[10px] bg-[var(--af-navy)] py-3.5 text-[0.95rem] font-bold text-white shadow-lg shadow-[var(--af-navy)]/15 transition-all hover:bg-[var(--af-navy-soft)] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <LoginSpinner /> Signing you in...
                </span>
              ) : (
                'Continue →'
              )}
            </button>
          </form>
          ) : (
          <form onSubmit={handleVerify2fa} noValidate className="mt-7 flex flex-col gap-4">
            <p className="text-sm text-slate-600">{challenge.message}</p>

            {challenge.methods.length > 1 && (
              <div className="flex gap-2 rounded-xl border border-slate-300 bg-slate-50 p-1">
                {challenge.methods.includes('email') && (
                  <button
                    type="button"
                    onClick={() => setOtpMethod('email')}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold cursor-pointer ${
                      otpMethod === 'email'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Email code
                  </button>
                )}
                {challenge.methods.includes('totp') && (
                  <button
                    type="button"
                    onClick={() => setOtpMethod('totp')}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold cursor-pointer ${
                      otpMethod === 'totp'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Authenticator
                  </button>
                )}
              </div>
            )}

            <FormField
              label={otpMethod === 'totp' ? 'Authenticator code' : 'Email verification code'}
              htmlFor="login-otp"
              required
              hint={
                otpMethod === 'email'
                  ? `Sent to ${challenge.emailHint}`
                  : 'Open Google Authenticator or Microsoft Authenticator'
              }
            >
              <input
                id="login-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="login-input af-input tracking-[0.35em] text-center text-lg font-bold"
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  if (error) setError('');
                }}
                placeholder="••••••"
                disabled={loading}
                autoFocus
              />
            </FormField>

            {otpMethod === 'email' && (
              <div className="flex items-center justify-between gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setChallenge(null);
                    setOtpCode('');
                    setError('');
                  }}
                  className="font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading || resendCooldown > 0}
                  className="font-semibold text-[var(--af-accent)] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            )}

            {otpMethod === 'totp' && (
              <button
                type="button"
                onClick={() => {
                  setChallenge(null);
                  setOtpCode('');
                  setError('');
                }}
                className="text-left text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                ← Back
              </button>
            )}

            {error && (
              <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full rounded-[10px] bg-[var(--af-navy)] py-3.5 text-[0.95rem] font-bold text-white shadow-lg shadow-[var(--af-navy)]/15 transition-all hover:bg-[var(--af-navy-soft)] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <LoginSpinner /> Verifying...
                </span>
              ) : (
                'Verify & Sign In →'
              )}
            </button>
          </form>
          )}
    </AuthSplitLayout>
      )}
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<FullPageLoader message="Loading Aceolution Finance..." />}>
      <LoginForm />
    </Suspense>
  );
}
