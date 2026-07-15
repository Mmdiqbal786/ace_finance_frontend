'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getUser, logout, AuthUser, isAuthenticated } from '../lib/auth';
import { usePathname } from 'next/navigation';
import Modal from './Modal';
import BrandLogo from './BrandLogo';
import { DASHBOARD_ROUTES } from '../lib/dashboard/routes';

const roleBadgeClass: Record<string, string> = {
  ADMIN: 'bg-amber-100 text-amber-800 border-amber-300',
  APPROVER: 'bg-sky-100 text-[var(--af-accent)] border-sky-300',
  PROCESSOR: 'bg-emerald-100 text-emerald-800 border-emerald-300',
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

  // Logo stays on the same area: home header → /, dashboard header → /dashboard/
  const logoHref = isDashboard ? DASHBOARD_ROUTES.home : "/";

  return (
    <header className={`sticky top-0 z-50 shrink-0 w-full border-b border-slate-200 bg-white ${isDashboard ? "" : "bg-white/90 backdrop-blur-md"}`}>
      <div
        suppressHydrationWarning
        className="flex min-h-14 w-full items-center justify-between gap-2 px-4 py-2 sm:min-h-16 sm:gap-3 sm:px-6 lg:px-8"
      >
        <div suppressHydrationWarning className="flex min-w-0 items-center">
          <BrandLogo href={logoHref} full showWordmark />
        </div>

        <div suppressHydrationWarning className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          {!mounted ? (
            <div suppressHydrationWarning className="h-9 w-32 rounded-lg bg-slate-100 animate-pulse" />
          ) : mounted && isDashboard && user ? (
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-400 bg-white px-2 sm:px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 hover:border-slate-500 transition-colors cursor-pointer"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--af-navy)] text-xs font-bold text-white">
                  {getInitials(user.name)}
                </span>
                <span className="hidden sm:block max-w-[120px] truncate">{user.name}</span>
                <svg
                  className={`h-4 w-4 shrink-0 text-slate-600 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
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
                  className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-400 bg-white shadow-xl shadow-[var(--af-navy)]/10 overflow-hidden z-50"
                >
                  <div className="px-4 py-3.5 border-b border-slate-300">
                    <p className="text-base font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-sm text-slate-700 truncate mt-1">{user.email}</p>
                    <span
                      className={`inline-flex items-center gap-1.5 mt-2.5 rounded-full border px-2.5 py-1 text-xs font-bold tracking-wide ${roleBadgeClass[user.role]}`}
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
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-red-50 hover:text-rose-700 transition-colors cursor-pointer"
                    >
                      <span>🚪</span>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : mounted && user ? (
            <>
              <span className="hidden sm:inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-[var(--af-accent)] ring-1 ring-inset ring-sky-400">
                v1.2.0 Stable
              </span>
              <Link
                href={DASHBOARD_ROUTES.home}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--af-navy)] px-4 text-sm font-bold text-white shadow hover:bg-[var(--af-navy-soft)] transition-colors"
              >
                Go to Dashboard
              </Link>
            </>
          ) : (
            <>
              <span className="hidden sm:inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-[var(--af-accent)] ring-1 ring-inset ring-sky-400">
                v1.2.0 Stable
              </span>
              <Link
                href="/login"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--af-navy)] px-4 text-sm font-bold text-white shadow hover:bg-[var(--af-navy-soft)] transition-colors"
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
        <p className="text-sm text-slate-700">
          Are you sure you want to sign out of your dashboard session?
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(false)}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-400 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
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
