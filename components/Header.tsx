'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getUser, logout, AuthUser, isAuthenticated } from '../lib/auth';
import { usePathname } from 'next/navigation';
import Modal from './Modal';
import { DASHBOARD_ROUTES } from '../lib/dashboard/routes';

const roleBadgeClass: Record<string, string> = {
  ADMIN: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  APPROVER: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
  PROCESSOR: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
};

const roleIcon: Record<string, string> = {
  ADMIN: '👑',
  APPROVER: '✅',
  PROCESSOR: '💳',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function Header() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated()) {
      setUser(getUser());
    } else {
      setUser(null);
    }
  }, [isDashboard, pathname]);

  useEffect(() => {
    if (!userMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setUserMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [userMenuOpen]);

  const logoHref = user ? DASHBOARD_ROUTES.home : '/';

  return (
    <header className={`sticky top-0 z-50 shrink-0 w-full border-b border-zinc-800 bg-zinc-950 ${isDashboard ? "" : "bg-zinc-950/80 backdrop-blur-md"}`}>
      <div
        suppressHydrationWarning
        className="flex min-h-14 w-full items-center justify-between gap-2 px-4 py-2 sm:min-h-16 sm:gap-3 sm:px-6 lg:px-8"
      >
        <div suppressHydrationWarning className="flex min-w-0 items-center">
          <Link href={logoHref} className="flex min-w-0 items-center gap-2 group sm:gap-2.5">
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
            <div suppressHydrationWarning className="h-9 w-32 rounded-lg bg-zinc-800/50 animate-pulse" />
          ) : mounted && isDashboard && user ? (
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-2 sm:px-3 text-sm font-medium text-zinc-200 hover:bg-zinc-800 hover:border-zinc-600 transition-colors cursor-pointer"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 text-[10px] font-bold text-white">
                  {getInitials(user.name)}
                </span>
                <span className="hidden sm:block max-w-[120px] truncate">{user.name}</span>
                <svg
                  className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl shadow-black/40 overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-zinc-800">
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{user.email}</p>
                    <span
                      className={`inline-flex items-center gap-1.5 mt-2 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${roleBadgeClass[user.role]}`}
                    >
                      {roleIcon[user.role]}
                      {user.role}
                    </span>
                  </div>

                  <div className="p-2">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <span>🚪</span>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
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
