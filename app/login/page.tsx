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
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-4"
      style={{
        background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        fontFamily: "'Inter', sans-serif",
      }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-5 text-center">
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
    <div
      className="login-page flex min-h-[calc(100dvh-3.5rem)] flex-1 items-center justify-center p-4 sm:min-h-[calc(100dvh-4rem)]"
      style={{
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
            background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
            padding: '0.75rem 1.25rem',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', fontWeight: 800, color: '#fff',
            }}>AF</div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.25rem' }}>
              Ace<span style={{ color: '#818cf8' }}>Finance</span>
            </span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', marginTop: '1rem' }}>
            Dashboard Login — Staff Only
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px',
          padding: '2rem',
        }}>
          <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Sign In
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
            Enter your credentials to access the dashboard
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} suppressHydrationWarning>
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
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
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
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
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px', padding: '0.75rem 1rem', color: '#fca5a5', fontSize: '0.875rem',
              }}>
                ⚠️ {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              style={{
                padding: '0.875rem', borderRadius: '10px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff', fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.02em',
                transition: 'all 0.2s', transform: 'translateY(0)',
                boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
              }}
              onMouseEnter={e => { if (!loading) (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => (e.target as HTMLButtonElement).style.transform = 'translateY(0)'}
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

        {/* Footer hint */}
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          Public expense form available at{' '}
          <a href="/" style={{ color: '#818cf8', textDecoration: 'none' }}>the homepage</a>
        </p>
      </div>
    </div>
      )}
    </>
  );
}
