'use client';
import { useState, useEffect } from 'react';
import { setAuth, isAuthenticated, getUser } from '../../lib/auth';
import { getDefaultDashboardRoute } from '../../lib/dashboard/routes';
import { API_URL } from '../../lib/api';

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

function FullPageLoader({ message }: { message: string }) {
  return (
    <div
      className="portal-page fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden px-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="portal-bg" aria-hidden="true">
        <div className="portal-orb portal-orb--violet" />
        <div className="portal-orb portal-orb--indigo" />
        <div className="portal-orb portal-orb--cyan" />
        <div className="portal-grid" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-5 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-lg font-extrabold text-white shadow-lg shadow-indigo-500/30">
          AF
        </div>
        <LoginSpinner className="h-10 w-10 text-indigo-400" />
        <div>
          <p className="text-base font-semibold text-white">{message}</p>
          <p className="mt-1 text-sm text-zinc-400">Please wait a moment...</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // const [seeding, setSeeding] = useState(false);
  // const [seedMsg, setSeedMsg] = useState('');

  useEffect(() => {
    if (isAuthenticated()) {
      setRedirecting(true);
      const user = getUser();
      window.location.href = user ? getDefaultDashboardRoute(user.role) : '/dashboard/';
      return;
    }
    setMounted(true);
  }, []);

  const showFullPageLoader = !mounted || loading || redirecting;
  const loaderMessage = redirecting
    ? 'Redirecting to dashboard...'
    : loading
      ? 'Signing you in...'
      : 'Loading AceFinance...';

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Login failed');
      }
      const data = await res.json();
      setAuth(data.access_token, data.user);
      window.location.href = getDefaultDashboardRoute(data.user.role);
      return;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  // async function handleSeed() {
  //   setSeeding(true);
  //   setSeedMsg('');
  //   try {
  //     const res = await fetch(`${API_URL}/auth/seed`, { method: 'POST' });
  //     const data = await res.json();
  //     setSeedMsg(data.message);
  //   } catch {
  //     setSeedMsg('Seed failed. Is the backend running?');
  //   } finally {
  //     setSeeding(false);
  //   }
  // }

  return (
    <>
      {showFullPageLoader && <FullPageLoader message={loaderMessage} />}

      {mounted && !redirecting && (
    <div className="portal-page login-page relative flex min-h-[calc(100dvh-3.5rem)] flex-1 items-center justify-center overflow-hidden p-4 sm:min-h-[calc(100dvh-4rem)]">
      <div className="portal-bg" aria-hidden="true">
        <div className="portal-orb portal-orb--violet" />
        <div className="portal-orb portal-orb--indigo" />
        <div className="portal-orb portal-orb--cyan" />
        <div className="portal-grid" />
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-md">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 text-sm font-extrabold text-white shadow-lg shadow-indigo-500/25">
              AF
            </div>
            <span className="text-xl font-bold text-white">
              Ace<span className="text-indigo-400">Finance</span>
            </span>
          </div>
          <p className="mt-4 text-sm text-zinc-400">Dashboard Login — Staff Only</p>
        </div>

        <div className="portal-card rounded-[20px] p-8">
          <h1 className="text-2xl font-bold text-white">
            Sign <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400">In</span>
          </h1>
          <p className="mt-2 mb-7 text-sm text-zinc-400">
            Enter your credentials to access the dashboard
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4" suppressHydrationWarning>
            <div>
              <label htmlFor="login-email" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                className="login-input w-full box-border rounded-[10px] border border-white/12 bg-white/[0.06] px-4 py-3 text-[0.95rem] text-white outline-none transition-colors focus:border-indigo-500"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@acefinance.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="login-password" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input w-full box-border rounded-[10px] border border-white/12 bg-white/[0.06] py-3 pl-4 pr-11 text-[0.95rem] text-white outline-none transition-colors focus:border-indigo-500"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border-0 bg-white/10 p-0 text-white/75 hover:bg-white/15 hover:text-white cursor-pointer"
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
            </div>

            {error && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                ⚠️ {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full rounded-[10px] bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 text-[0.95rem] font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              Sign In →
            </button>
          </form>

          {/* Seed admin section — hidden for production
          <div style={{
            marginTop: '1.75rem', paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', textAlign: 'center', marginBottom: '0.75rem' }}>
              First time setup? Create the admin account:
            </p>
            <button
              id="seed-admin-btn"
              onClick={handleSeed}
              disabled={seeding}
              style={{
                width: '100%', padding: '0.65rem', borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)', cursor: seeding ? 'not-allowed' : 'pointer',
                background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)',
                fontSize: '0.8rem', fontWeight: 500, transition: 'all 0.2s',
              }}
              onMouseEnter={e => (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={e => (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'}
            >
              {seeding ? 'Creating...' : '🔑 Seed Admin Account'}
            </button>
            {seedMsg && (
              <p style={{
                marginTop: '0.5rem', textAlign: 'center', fontSize: '0.8rem',
                color: seedMsg.includes('created') ? '#86efac' : '#fca5a5',
              }}>
                {seedMsg}
              </p>
            )}
          </div>
          */}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Public expense form available at{' '}
          <a href="/" className="text-indigo-400 no-underline hover:text-indigo-300">the homepage</a>
        </p>
      </div>
    </div>
      )}
    </>
  );
}
