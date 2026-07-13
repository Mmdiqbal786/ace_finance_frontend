'use client';
import { useState, useEffect } from 'react';
import { setAuth, isAuthenticated, getUser } from '../../lib/auth';
import { getDefaultDashboardRoute } from '../../lib/dashboard/routes';
import { API_URL } from '../../lib/api';

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // const [seeding, setSeeding] = useState(false);
  // const [seedMsg, setSeedMsg] = useState('');

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated()) {
      const user = getUser();
      window.location.href = user ? getDefaultDashboardRoute(user.role) : '/dashboard/';
    }
  }, []);

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
    } catch (err: any) {
      setError(err.message);
    } finally {
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
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-1 items-center justify-center p-4 sm:min-h-[calc(100dvh-4rem)]" style={{
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

          {mounted ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} suppressHydrationWarning>
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@acefinance.com"
                required
                style={{
                  width: '100%', padding: '0.75rem 1rem', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '10px', color: '#fff', fontSize: '0.95rem', outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%', padding: '0.75rem 1rem', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '10px', color: '#fff', fontSize: '0.95rem', outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
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
                background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff', fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.02em',
                transition: 'all 0.2s', transform: 'translateY(0)',
                boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
              }}
              onMouseEnter={e => { if (!loading) (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => (e.target as HTMLButtonElement).style.transform = 'translateY(0)'}
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                minHeight: '220px',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.875rem',
              }}
            >
              Loading sign in...
            </div>
          )}

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
  );
}
