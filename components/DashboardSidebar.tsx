"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthUser, logout } from "../lib/auth";
import Modal from "./Modal";
import {
  DASHBOARD_ROUTES,
  pathnameToSection,
} from "../lib/dashboard/routes";
import { DashboardSection } from "../lib/dashboard/types";

interface DashboardSidebarProps {
  user: AuthUser | null;
  pendingApproverCount: number;
  pendingProcessorCount: number;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavItemProps {
  icon: string;
  label: string;
  shortLabel?: string;
  href: string;
  active: boolean;
  badge?: number;
  pulse?: boolean;
  accent?: "indigo" | "amber";
  onNavigate?: () => void;
}

function NavItem({
  icon,
  label,
  shortLabel,
  href,
  active,
  badge = 0,
  pulse = false,
  accent = "indigo",
  onNavigate,
}: NavItemProps) {
  const activeStyles =
    accent === "amber"
      ? "bg-amber-500/20 text-amber-200 border-amber-400/25"
      : "af-sidebar-nav-active";

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[0.9375rem] font-semibold transition-all cursor-pointer border ${
        active ? activeStyles : "af-sidebar-nav-idle"
      }`}
    >
      <span className="text-base shrink-0">{icon}</span>
      <span className="flex-1 text-left truncate">
        <span className="sm:hidden">{shortLabel || label}</span>
        <span className="hidden sm:inline">{label}</span>
      </span>
      {badge > 0 && (
        <span
          className={`shrink-0 min-w-[1.25rem] px-1.5 py-0.5 rounded-full bg-rose-500 text-xs text-white font-bold leading-none text-center ${
            pulse ? "animate-pulse" : ""
          }`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

function isSectionActive(pathname: string | null, section: DashboardSection): boolean {
  return pathnameToSection(pathname) === section;
}

export default function DashboardSidebar({
  user,
  pendingApproverCount,
  pendingProcessorCount,
  mobileOpen,
  onMobileClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        suppressHydrationWarning
        className={`af-sidebar fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r transition-transform duration-200 lg:relative lg:z-auto lg:h-full lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="relative border-b border-white/20 px-4 py-4 pr-12">
          <button
            type="button"
            onClick={onMobileClose}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-200 hover:bg-white/10 hover:text-white transition-colors cursor-pointer lg:hidden"
            aria-label="Close menu"
          >
            ✕
          </button>
          <p className="text-base font-bold text-white truncate">{user?.name || "Dashboard"}</p>
          {user?.email && (
            <p className="text-sm text-slate-200 truncate mt-1">{user.email}</p>
          )}
          <p className="mt-1.5 inline-flex rounded-md bg-white/15 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-sky-200">
            {user?.role}
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <NavItem
            icon="🏠"
            label="Dashboard"
            shortLabel="Home"
            href={DASHBOARD_ROUTES.home}
            active={isSectionActive(pathname, "home")}
            onNavigate={onMobileClose}
          />

          {(user?.role === "APPROVER" || user?.role === "ADMIN") && (
            <NavItem
              icon="🛡️"
              label="Approver"
              href={DASHBOARD_ROUTES.approver}
              active={isSectionActive(pathname, "approver")}
              badge={pendingApproverCount}
              pulse
              onNavigate={onMobileClose}
            />
          )}

          {(user?.role === "PROCESSOR" || user?.role === "ADMIN") && (
            <NavItem
              icon="💸"
              label="Processor"
              href={DASHBOARD_ROUTES.processor}
              active={isSectionActive(pathname, "processor")}
              badge={pendingProcessorCount}
              onNavigate={onMobileClose}
            />
          )}

          {user?.role === "ADMIN" && (
            <NavItem
              icon="👥"
              label="User Management"
              shortLabel="Users"
              href={DASHBOARD_ROUTES.userManagement}
              active={isSectionActive(pathname, "user-management")}
              accent="amber"
              onNavigate={onMobileClose}
            />
          )}

          <NavItem
            icon="📊"
            label="Analytics & Tracker"
            shortLabel="Analytics"
            href={DASHBOARD_ROUTES.analytics}
            active={isSectionActive(pathname, "analytics")}
            onNavigate={onMobileClose}
          />
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/25 px-3 py-2.5 text-sm font-semibold text-slate-100 hover:border-red-400/50 hover:bg-red-500/10 hover:text-red-200 transition-colors cursor-pointer"
          >
            <span>🚪</span>
            Sign Out
          </button>
        </div>
      </aside>

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
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
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
    </>
  );
}
