'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUser, logout, AuthUser } from '../lib/auth';
import { usePathname } from 'next/navigation';
import Modal from './Modal';

export default function Header() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
      <div suppressHydrationWarning className="mx-auto flex max-w-7xl min-h-14 sm:min-h-16 items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-6 lg:px-8">
        <div suppressHydrationWarning className="flex min-w-0 items-center">
          <Link href="/" className="flex min-w-0 items-center gap-2 group sm:gap-2.5">
            <div suppressHydrationWarning className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-indigo-500/20 transition-transform group-hover:scale-105">
              <span className="text-xs sm:text-sm font-bold text-white tracking-wider">AF</span>
            </div>
            <span className="truncate text-base sm:text-lg font-bold tracking-tight text-white transition-colors group-hover:text-indigo-400">
              Ace<span className="text-indigo-500">Finance</span>
            </span>
          </Link>
        </div>

        <div suppressHydrationWarning className="flex shrink-0 items-center gap-1.5 sm:gap-3">
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
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                  ...roleBadgeStyle[user.role],
                }}
              >
                {roleIcon[user.role]}
                <span className="hidden sm:inline">{user.role}</span>
              </span>
              <span className="hidden md:block max-w-[120px] truncate text-sm text-zinc-300 font-medium">
                {user.name}
              </span>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-zinc-700 px-2 sm:px-3 text-xs font-medium text-zinc-400 hover:border-red-500/50 hover:text-red-400 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span className="sm:hidden">Out</span>
                <span className="hidden sm:inline">Sign Out</span>
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

      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Sign Out?"
        maxWidthClass="max-w-md"
      >
        <p className="text-sm text-zinc-400">
          Are you sure you want to sign out of your dashboard session?
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(false)}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-700 px-4 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={logout}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-500 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </Modal>
    </header>
  );
}
