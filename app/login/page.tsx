'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import FullPageLoader from '../../components/FullPageLoader';
import { useBlockAuthenticatedGuestPages } from '../../hooks/useBlockAuthenticatedGuestPages';
import {
  setAuth,
  getPostAuthDestination,
  fetchSessionUser,
  AuthUser,
} from '../../lib/auth';
import {
  demoAccessHeaders,
  getDemoAccessCodeForApi,
  unlockDemoGuideAccess,
} from '../../lib/demo-guide';
import { resolveAccessibleDashboardPath } from '../../lib/dashboard/routes';
import { API_URL, apiFetch } from '../../lib/api';
import FormField from '../../components/FormField';
import AuthSplitLayout from '../../components/AuthSplitLayout';
import { useFormValidation } from '../../hooks/useFormValidation';
import { validateLoginEmail, validateLoginPassword } from '../../lib/validation';
import AppIcon from '../../components/icons/AppIcon';

type DemoAccessAccount = {
  id: string;
  name: string;
  email: string;
  role: string;
  assignedProjects: string[];
};

function MicrosoftLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 23 23" aria-hidden="true">
      <path fill="#f35325" d="M1 1h10v10H1z" />
      <path fill="#81bc06" d="M12 1h10v10H12z" />
      <path fill="#05a6f0" d="M1 12h10v10H1z" />
      <path fill="#ffba08" d="M12 12h10v10H12z" />
    </svg>
  );
}

function userFromAccessToken(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Reject challenge / workspace / OAuth purpose tokens (API would too).
    if (payload?.purpose) return null;
    if (!payload?.sub || !payload?.email || !payload?.role) return null;
    return {
      id: String(payload.sub),
      name: String(payload.name || payload.email),
      email: String(payload.email),
      role: payload.role,
      mustChangePassword: Boolean(payload.mustChangePassword),
      mustSetupTotp: Boolean(payload.mustSetupTotp),
      totpEnabled: Boolean(payload.totpEnabled),
      assignedProjects: Array.isArray(payload.assignedProjects)
        ? payload.assignedProjects
        : [],
      isDemo: Boolean(payload.isDemo),
      store: payload.store === 'demo' ? 'demo' : 'live',
      microsoftLinked: Boolean(payload.microsoftLinked),
    };
  } catch {
    return null;
  }
}

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
type LoginView = "home" | "demo" | "password";
type WorkspaceId = "live" | "demo";

type ChallengeState = {
  challengeToken: string;
  methods: TwoFactorMethod[];
  emailHint: string;
  message: string;
};

type WorkspaceOption = {
  id: WorkspaceId;
  label: string;
  title: string;
  role?: string;
  description: string;
};

type WorkspaceChoiceState = {
  workspaceToken: string;
  emailHint: string;
  name: string;
  message: string;
  workspaces: WorkspaceOption[];
};

function LoginForm() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const guestAllowed = useBlockAuthenticatedGuestPages(nextPath);
  const [view, setView] = useState<LoginView>("home");
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoBusyEmail, setDemoBusyEmail] = useState<string | null>(null);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccessAccount[]>([]);
  const [demoAccountsLoading, setDemoAccountsLoading] = useState(false);
  const [demoAccountsError, setDemoAccountsError] = useState('');
  const [demoSelected, setDemoSelected] = useState<DemoAccessAccount | null>(null);
  const [demoPersonaPassword, setDemoPersonaPassword] = useState('');
  const [demoGateCode, setDemoGateCode] = useState('');
  const [demoGateBusy, setDemoGateBusy] = useState(false);
  const [error, setError] = useState('');
  const [challenge, setChallenge] = useState<ChallengeState | null>(null);
  const [workspaceChoice, setWorkspaceChoice] = useState<WorkspaceChoiceState | null>(null);
  const [workspaceBusy, setWorkspaceBusy] = useState<WorkspaceId | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpMethod, setOtpMethod] = useState<TwoFactorMethod>('email');
  const [resendCooldown, setResendCooldown] = useState(0);
  // Same idea as ACE Outsource: NEXT_PUBLIC_LOGIN controls the button (default on).
  // Do not disable after logout while waiting on /auth/microsoft/status — that race
  // left the button gray. Backend redirects with ms_error if Azure is not configured.
  const microsoftLoginFlag =
    process.env.NEXT_PUBLIC_LOGIN !== 'false' &&
    process.env.NEXT_PUBLIC_LOGIN !== '0';
  const microsoftReady = Boolean(microsoftLoginFlag && API_URL);
  const [microsoftBusy, setMicrosoftBusy] = useState(false);
  const form = useFormValidation<LoginField>();

  function goAfterLogin(user: Parameters<typeof getPostAuthDestination>[0]) {
    window.location.href = getPostAuthDestination(
      user,
      resolveAccessibleDashboardPath(user.role, nextPath),
    );
  }

  useEffect(() => {
    const msError = searchParams.get('ms_error');
    if (msError) {
      setError(msError);
      setMicrosoftBusy(false);
      setView('home');
      return;
    }

    // Session tokens only from hash fragment (never query — avoids proxy/access-log leakage)
    let hashParams = new URLSearchParams();
    try {
      const raw = window.location.hash.replace(/^#/, '');
      if (raw) hashParams = new URLSearchParams(raw);
    } catch {
      // ignore
    }
    const qp = (key: string) => hashParams.get(key);

    // Admin Microsoft sign-in → same Live / Demo picker as password admin
    const msWorkspace = qp('ms_workspace');
    if (msWorkspace) {
      setMicrosoftBusy(false);
      setChallenge(null);
      setWorkspaceChoice({
        workspaceToken: msWorkspace,
        emailHint: qp('ms_email') || '',
        name: qp('ms_name') || 'User',
        message:
          'This account exists in more than one workspace. Choose Live or Demo (your role is shown on each).',
        workspaces: [
          {
            id: 'live',
            label: 'Live',
            title: 'Live company data',
            role: qp('ms_live_role') || undefined,
            description: qp('ms_live_role')
              ? `Your role here: ${qp('ms_live_role')}. Production expenses, users, and files.`
              : 'Production expenses, users, and files.',
          },
          {
            id: 'demo',
            label: 'Demo',
            title: 'Demo / training data',
            role: qp('ms_demo_role') || undefined,
            description: qp('ms_demo_role')
              ? `Your role here: ${qp('ms_demo_role')}. Isolated sandbox database and files.`
              : 'Isolated sandbox database and files.',
          },
        ],
      });
      try {
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      } catch {
        // ignore
      }
      return;
    }
    // Preferred: httpOnly cookie set by API callback (`?ms_ok=1`)
    const msOk = searchParams.get('ms_ok');
    if (msOk === '1') {
      setMicrosoftBusy(true);
      void (async () => {
        try {
          window.history.replaceState(
            null,
            '',
            `${window.location.pathname}`,
          );
        } catch {
          // ignore
        }
        const user = await fetchSessionUser();
        if (!user) {
          setError('Microsoft sign-in session expired. Try again.');
          setMicrosoftBusy(false);
          return;
        }
        goAfterLogin(user);
      })();
      return;
    }

    // Legacy hash token (older API builds) — still accepted once, then cookie path preferred
    const msToken = qp('ms_token');
    if (!msToken) return;
    try {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    } catch {
      // ignore
    }
    const user = userFromAccessToken(msToken);
    if (!user) {
      setError('Microsoft sign-in returned an invalid session. Try again.');
      setMicrosoftBusy(false);
      return;
    }
    setMicrosoftBusy(true);
    setAuth(msToken, user);
    goAfterLogin(user);
  }, [searchParams]);

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
      return await apiFetch(input, { ...init, signal: controller.signal });
    } finally {
      window.clearTimeout(timer);
    }
  }

  function loginFetchError(err: any): string {
    if (err?.name === 'AbortError') {
      return 'The server took too long to respond. Check that the API is running, then try again.';
    }
    const msg = String(err?.message || '');
    if (/failed to fetch|networkerror|load failed/i.test(msg)) {
      return 'Cannot reach the API. Check NEXT_PUBLIC_API_URL and that the backend is online, then try again.';
    }
    return msg || 'Login failed';
  }

  function applyAuthResponse(data: any, fallbackEmail: string) {
    if (data.access_token && data.user) {
      setAuth(data.access_token, data.user);
      goAfterLogin(data.user);
      return;
    }
    if (data.requiresWorkspaceChoice && data.workspaceToken) {
      setChallenge(null);
      const workspaces = Array.isArray(data.workspaces)
        ? (data.workspaces as WorkspaceOption[])
        : [
            {
              id: 'live' as const,
              label: 'Live',
              title: 'Live company data',
              description: 'Production workspace.',
            },
            {
              id: 'demo' as const,
              label: 'Demo',
              title: 'Demo / training data',
              description: 'Sandbox workspace.',
            },
          ];
      setWorkspaceChoice({
        workspaceToken: data.workspaceToken,
        emailHint: data.emailHint || fallbackEmail.trim().toLowerCase(),
        name: data.name || 'User',
        message:
          data.message ||
          'This account exists in more than one workspace. Choose Live or Demo.',
        workspaces,
      });
      return;
    }
    if (data.requires2fa && data.challengeToken) {
      const methods = (data.methods || ['email']) as TwoFactorMethod[];
      setWorkspaceChoice(null);
      setChallenge({
        challengeToken: data.challengeToken,
        methods,
        emailHint: data.emailHint || fallbackEmail.trim().toLowerCase(),
        message: data.message || 'Enter your verification code.',
      });
      setOtpMethod(methods.includes('email') ? 'email' : methods[0]);
      setOtpCode('');
      startResendCooldown(30);
      return;
    }
    throw new Error('Unexpected login response. Please try again.');
  }

  async function loginWithPassword(loginEmail: string, loginPassword: string) {
    const res = await fetchWithTimeout(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        Array.isArray(data.message) ? data.message.join(' ') : data.message || 'Login failed',
      );
    }
    applyAuthResponse(data, loginEmail);
  }

  async function handleSelectWorkspace(store: WorkspaceId) {
    if (!workspaceChoice) return;
    setWorkspaceBusy(store);
    setError('');
    try {
      const res = await fetchWithTimeout(`${API_URL}/auth/select-workspace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceToken: workspaceChoice.workspaceToken,
          store,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(' ')
            : data.message || 'Could not open workspace',
        );
      }
      if (!data.access_token || !data.user) {
        throw new Error('Unexpected workspace response. Please try again.');
      }
      setAuth(data.access_token, data.user);
      goAfterLogin(data.user);
    } catch (err: any) {
      setError(loginFetchError(err));
      setWorkspaceBusy(null);
    }
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
      await loginWithPassword(email, password);
    } catch (err: any) {
      setError(loginFetchError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (view !== 'demo') return;
    setDemoSelected(null);
    setDemoPersonaPassword('');
    let cancelled = false;
    async function loadDemoAccounts() {
      // Need access code in session (from demo-guide unlock) before listing personas
      if (!getDemoAccessCodeForApi()) {
        setDemoAccounts([]);
        setDemoAccountsLoading(false);
        setDemoAccountsError('');
        return;
      }
      setDemoAccountsLoading(true);
      setDemoAccountsError('');
      try {
        const res = await fetchWithTimeout(`${API_URL}/auth/demo-accounts`, {
          method: 'GET',
          headers: { ...demoAccessHeaders() },
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(
            Array.isArray(data?.message)
              ? data.message.join(' ')
              : data?.message || 'Could not load demo accounts',
          );
        }
        if (!cancelled) {
          setDemoAccounts(Array.isArray(data) ? data : []);
        }
      } catch (err: any) {
        if (!cancelled) {
          setDemoAccounts([]);
          setDemoAccountsError(loginFetchError(err));
        }
      } finally {
        if (!cancelled) setDemoAccountsLoading(false);
      }
    }
    void loadDemoAccounts();
    return () => {
      cancelled = true;
    };
  }, [view]);

  async function handleUnlockDemoGate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setDemoAccountsError('');
    const code = demoGateCode.trim();
    if (!code) {
      setError('Enter the demo access password (same as the demo guide).');
      return;
    }
    setDemoGateBusy(true);
    try {
      const res = await fetchWithTimeout(`${API_URL}/auth/verify-demo-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(' ')
            : data?.message || 'Incorrect access password.',
        );
      }
      unlockDemoGuideAccess(code);
      setDemoGateCode('');
      // Reload personas
      setDemoAccountsLoading(true);
      const listRes = await fetchWithTimeout(`${API_URL}/auth/demo-accounts`, {
        method: 'GET',
        headers: { ...demoAccessHeaders() },
      });
      const listData = await listRes.json().catch(() => null);
      if (!listRes.ok) {
        throw new Error(
          Array.isArray(listData?.message)
            ? listData.message.join(' ')
            : listData?.message || 'Could not load demo accounts',
        );
      }
      setDemoAccounts(Array.isArray(listData) ? listData : []);
    } catch (err: any) {
      setError(loginFetchError(err));
      setDemoAccounts([]);
    } finally {
      setDemoGateBusy(false);
      setDemoAccountsLoading(false);
    }
  }

  async function handleDemoLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!demoSelected) return;
    const demoEmail = demoSelected.email;
    if (!demoPersonaPassword.trim()) {
      setError('Enter the password for this demo account (see the demo guide).');
      return;
    }
    setDemoBusyEmail(demoEmail);
    setError('');
    try {
      const res = await fetchWithTimeout(`${API_URL}/auth/demo-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...demoAccessHeaders(),
        },
        body: JSON.stringify({
          email: demoEmail.trim().toLowerCase(),
          password: demoPersonaPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message) ? data.message.join(' ') : data.message || 'Demo login failed',
        );
      }
      if (!data.access_token || !data.user) {
        throw new Error('Unexpected demo login response. Please try again.');
      }
      setAuth(data.access_token, data.user);
      goAfterLogin(data.user);
    } catch (err: any) {
      setError(loginFetchError(err));
      setDemoBusyEmail(null);
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
      applyAuthResponse(data, challenge.emailHint);
      setLoading(false);
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

  function goHome() {
    setView('home');
    setError('');
    setChallenge(null);
    setWorkspaceChoice(null);
    setWorkspaceBusy(null);
    setOtpCode('');
    setDemoBusyEmail(null);
  }

  const pageTitle = workspaceChoice ? (
    <>Choose <span className="af-title-accent">Workspace</span></>
  ) : challenge ? (
    <>Verify <span className="af-title-accent">Sign In</span></>
  ) : view === 'demo' ? (
    <>Demo <span className="af-title-accent">Access</span></>
  ) : view === 'password' ? (
    <>Sign <span className="af-title-accent">In</span></>
  ) : (
    <>Aceolution <span className="af-title-accent">Finance</span></>
  );

  return (
    <>
      {showFullPageLoader && <FullPageLoader message={loaderMessage} />}

      {guestAllowed && (
    <AuthSplitLayout>
          <h1 className="text-2xl font-extrabold text-slate-900">{pageTitle}</h1>

          {workspaceChoice ? (
          <div className="mt-7 flex flex-col gap-4">
            <p className="text-sm text-slate-600">{workspaceChoice.message}</p>
            <p className="text-xs font-semibold text-slate-500">
              Signed in as {workspaceChoice.name}
              {workspaceChoice.emailHint ? ` (${workspaceChoice.emailHint})` : ''}
            </p>

            {error && (
              <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 inline-flex items-start gap-2">
                <AppIcon name="warning" size="sm" className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {workspaceChoice.workspaces.map((ws) => {
              const isLive = ws.id === 'live';
              const busy = workspaceBusy === ws.id;
              return (
                <button
                  key={ws.id}
                  type="button"
                  disabled={Boolean(workspaceBusy)}
                  onClick={() => handleSelectWorkspace(ws.id)}
                  className={
                    isLive
                      ? 'flex w-full flex-col items-start gap-1 rounded-[12px] border-2 border-[var(--af-navy)] bg-[var(--af-navy)] px-4 py-4 text-left text-white shadow-lg shadow-[var(--af-navy)]/20 transition-all hover:bg-[var(--af-navy-soft)] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer'
                      : 'flex w-full flex-col items-start gap-1 rounded-[12px] border-2 border-amber-400 bg-amber-50 px-4 py-4 text-left shadow-sm transition-all hover:bg-amber-100/80 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer'
                  }
                >
                  <span
                    className={
                      isLive
                        ? 'text-[0.7rem] font-bold uppercase tracking-wider text-sky-200'
                        : 'text-[0.7rem] font-bold uppercase tracking-wider text-amber-700'
                    }
                  >
                    {isLive ? 'Production' : 'Sandbox'}
                    {ws.role ? ` · ${ws.role}` : ''}
                  </span>
                  <span
                    className={
                      isLive
                        ? 'text-base font-extrabold'
                        : 'text-base font-extrabold text-slate-900'
                    }
                  >
                    {busy ? (
                      <span className="inline-flex items-center gap-2">
                        <LoginSpinner
                          className={
                            isLive ? 'h-5 w-5 text-white' : 'h-5 w-5 text-amber-700'
                          }
                        />
                        Opening {ws.label}…
                      </span>
                    ) : (
                      ws.title
                    )}
                  </span>
                  {ws.role && (
                    <span
                      className={
                        isLive
                          ? 'inline-flex rounded-md bg-white/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-sky-100'
                          : 'inline-flex rounded-md border border-amber-300 bg-white px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-800'
                      }
                    >
                      Role: {ws.role}
                    </span>
                  )}
                  <span
                    className={
                      isLive
                        ? 'text-xs font-medium text-sky-100/90'
                        : 'text-xs font-medium text-slate-600'
                    }
                  >
                    {ws.description}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setWorkspaceChoice(null);
                setWorkspaceBusy(null);
                setError('');
                setView('home');
              }}
              disabled={Boolean(workspaceBusy)}
              className="text-left text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-50 cursor-pointer"
            >
              ← Back
            </button>
          </div>
          ) : challenge ? (
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
              <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 inline-flex items-start gap-2">
                <AppIcon name="warning" size="sm" className="mt-0.5 shrink-0" />
                <span>{error}</span>
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
          ) : view === 'home' ? (
          <div className="mt-7 flex flex-col gap-4">
            <p className="text-sm text-slate-600">
              Sign in with your company Microsoft account.
            </p>

            {error && (
              <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 inline-flex items-start gap-2">
                <AppIcon name="warning" size="sm" className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {microsoftReady ? (
              <a
                href={`${API_URL}/auth/microsoft/login`}
                onClick={() => setMicrosoftBusy(true)}
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-[10px] bg-[var(--af-navy)] py-3.5 text-[0.95rem] font-bold text-white shadow-lg shadow-[var(--af-navy)]/15 transition-all hover:bg-[var(--af-navy-soft)]"
              >
                <MicrosoftLogo />
                {microsoftBusy ? 'Redirecting to Microsoft…' : 'Sign in with Microsoft'}
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-[10px] border border-slate-200 bg-slate-50 py-3.5 text-[0.95rem] font-bold text-slate-400 cursor-not-allowed"
                title={
                  !microsoftLoginFlag
                    ? 'Microsoft login is turned off (NEXT_PUBLIC_LOGIN=false)'
                    : 'NEXT_PUBLIC_API_URL is missing'
                }
              >
                <MicrosoftLogo />
                Sign in with Microsoft
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setError('');
                setView('demo');
              }}
              className="w-full rounded-[10px] border border-slate-300 bg-white py-3.5 text-[0.95rem] font-bold text-slate-800 shadow-sm transition-all hover:bg-slate-50 cursor-pointer"
            >
              Demo Access
            </button>

            <p className="text-center text-sm text-slate-500">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setView('password');
                }}
                className="font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline cursor-pointer"
              >
                Use password instead
              </button>
            </p>

            <p className="text-center text-[11px] text-slate-500">
              {microsoftReady
                ? 'Company staff use Microsoft. Admin (Microsoft or password) then picks Live or Demo. Demo Access is for training personas.'
                : 'Microsoft login is turned off. Use Demo Access or password sign-in.'}
            </p>
          </div>
          ) : view === 'demo' ? (
          <div className="mt-7 flex flex-col gap-4">
            <p className="text-sm text-slate-600">
              Unlock with the demo-guide access password, pick a persona, then enter
              that account password (listed in the demo guide).
            </p>

            {(error || demoAccountsError) && (
              <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 inline-flex items-start gap-2">
                <AppIcon name="warning" size="sm" className="mt-0.5 shrink-0" />
                <span>{error || demoAccountsError}</span>
              </div>
            )}

            {!getDemoAccessCodeForApi() ? (
              <form onSubmit={handleUnlockDemoGate} className="flex flex-col gap-3" noValidate>
                <FormField label="Demo access password" htmlFor="demo-gate-code" required>
                  <input
                    id="demo-gate-code"
                    type="password"
                    className="login-input af-input"
                    value={demoGateCode}
                    onChange={(e) => {
                      setDemoGateCode(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Same as demo guide unlock"
                    disabled={demoGateBusy}
                    autoComplete="off"
                  />
                </FormField>
                <button
                  type="submit"
                  disabled={demoGateBusy}
                  className="w-full rounded-[10px] bg-[var(--af-navy)] py-3 text-sm font-bold text-white disabled:opacity-60 cursor-pointer"
                >
                  {demoGateBusy ? 'Checking…' : 'Unlock Demo Access'}
                </button>
              </form>
            ) : demoSelected ? (
              <form onSubmit={handleDemoLogin} className="flex flex-col gap-3" noValidate>
                <p className="text-sm font-semibold text-slate-800">
                  Sign in as {demoSelected.name}{' '}
                  <span className="text-[var(--af-accent)]">({demoSelected.role})</span>
                </p>
                <FormField label="Account password" htmlFor="demo-persona-password" required>
                  <input
                    id="demo-persona-password"
                    type="password"
                    className="login-input af-input"
                    value={demoPersonaPassword}
                    onChange={(e) => {
                      setDemoPersonaPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="From demo guide"
                    disabled={Boolean(demoBusyEmail)}
                    autoComplete="current-password"
                    autoFocus
                  />
                </FormField>
                <button
                  type="submit"
                  disabled={Boolean(demoBusyEmail)}
                  className="w-full rounded-[10px] bg-[var(--af-navy)] py-3 text-sm font-bold text-white disabled:opacity-60 cursor-pointer"
                >
                  {demoBusyEmail ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <LoginSpinner /> Signing in…
                    </span>
                  ) : (
                    'Sign in →'
                  )}
                </button>
                <button
                  type="button"
                  disabled={Boolean(demoBusyEmail)}
                  onClick={() => {
                    setDemoSelected(null);
                    setDemoPersonaPassword('');
                    setError('');
                  }}
                  className="text-left text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-50 cursor-pointer"
                >
                  ← Choose another account
                </button>
              </form>
            ) : (
            <div className="flex max-h-[min(52vh,420px)] flex-col gap-2 overflow-y-auto pr-1">
              {demoAccountsLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm font-semibold text-slate-600">
                  <LoginSpinner className="h-5 w-5 text-[var(--af-navy)]" />
                  Loading demo accounts…
                </div>
              ) : demoAccounts.length === 0 ? (
                <p className="rounded-[10px] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
                  No Demo Access accounts yet. In Admin → Demo workspace → Users,
                  create a user with Demo Access enabled (or keep the seeded personas).
                </p>
              ) : (
                demoAccounts.map((staff) => {
                  const projects =
                    staff.assignedProjects?.length > 0
                      ? staff.assignedProjects.join('; ')
                      : staff.role === 'PROCESSOR' || staff.role === 'ADMIN'
                        ? 'All projects'
                        : 'No projects assigned';
                  return (
                    <button
                      key={staff.id || staff.email}
                      type="button"
                      onClick={() => {
                        setDemoSelected(staff);
                        setDemoPersonaPassword('');
                        setError('');
                      }}
                      className="flex w-full flex-col items-start gap-0.5 rounded-[10px] border border-slate-300 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-[var(--af-navy)] hover:bg-slate-50 cursor-pointer"
                    >
                      <span className="text-sm font-bold text-slate-900">{staff.name}</span>
                      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--af-accent)]">
                        {staff.role}
                      </span>
                      <span className="text-xs text-slate-500 line-clamp-2">{projects}</span>
                    </button>
                  );
                })
              )}
            </div>
            )}

            <button
              type="button"
              onClick={goHome}
              disabled={Boolean(demoBusyEmail) || demoGateBusy}
              className="text-left text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-50 cursor-pointer"
            >
              ← Back
            </button>
          </div>
          ) : (
          <form onSubmit={handleLogin} noValidate className="mt-7 flex flex-col gap-4" suppressHydrationWarning>
            <p className="text-sm text-slate-600">
              For admin and users without Microsoft. If your account is linked
              to Microsoft, use Sign in with Microsoft — password will not work.
            </p>

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

            <div className="flex items-center justify-between gap-2 -mt-1">
              <button
                type="button"
                onClick={goHome}
                className="text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                ← Back
              </button>
              <Link
                href="/forgot-password/"
                className="text-sm font-semibold text-[var(--af-accent)] hover:text-[var(--af-accent-soft)] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 inline-flex items-start gap-2">
                <AppIcon name="warning" size="sm" className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading || microsoftBusy}
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
