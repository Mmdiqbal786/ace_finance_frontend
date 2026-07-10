'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUser, logout, AuthUser } from '../lib/auth';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  // Use mounted state to avoid SSR/client hydration mismatch.
  // localStorage is only available on the client, so we read it
  // after mount to prevent server-rendered HTML differing from client.
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setMounted(true);
    if (isDashboard) {
      setUser(getUser());
    }
  }, [isDashboard]);

  const roleBadgeStyle: Record<string, React.CSSProperties> = {
    ADMIN: { background: 'rgba(234,179,8,0.15)', color: '#fbbf24', border: '1px solid rgba(234,179,8,0.25)' },
    APPROVER: { background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' },
    PROCESSOR: { background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' },
  };

  const roleIcon: Record<string, string> = {
    ADMIN: '👑',
    APPROVER: '✅',
    PROCESSOR: '💳',
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div suppressHydrationWarning className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo + Nav */}
        <div suppressHydrationWarning className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div suppressHydrationWarning className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-indigo-500/20 transition-transform group-hover:scale-105">
              <span className="text-sm font-bold text-white tracking-wider">AF</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-white transition-colors group-hover:text-indigo-400">
              Ace<span className="text-indigo-500">Finance</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Public Request Form
            </Link>
            <Link href="/dashboard" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Approval Dashboard
            </Link>
          </nav>
        </div>

        {/* Right side — only render auth-aware content after client mount */}
        <div suppressHydrationWarning className="flex items-center gap-3">
          {!mounted ? (
            // Placeholder skeleton to avoid layout shift during mount
            <div suppressHydrationWarning className="h-8 w-28 rounded-lg bg-zinc-800/50 animate-pulse" />
          ) : mounted && isDashboard && user ? (
            <>
              {/* Role Badge */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  borderRadius: '9999px',
                  padding: '0.2rem 0.65rem',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  ...roleBadgeStyle[user.role],
                }}
              >
                {roleIcon[user.role]} {user.role}
              </span>
              {/* User Name */}
              <span className="hidden sm:block text-sm text-zinc-300 font-medium">
                {user.name}
              </span>
              {/* Logout */}
              <button
                onClick={logout}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-zinc-700 px-3 text-xs font-medium text-zinc-400 hover:border-red-500/50 hover:text-red-400 transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <span className="hidden sm:inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                v1.2.0 Stable
              </span>
              <Link
                href="/login"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white shadow hover:bg-indigo-500 transition-colors"
              >
                Dashboard Login
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
