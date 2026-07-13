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
      ? "bg-amber-600/15 text-amber-300 border-amber-500/20"
      : "bg-indigo-600/15 text-indigo-300 border-indigo-500/20";

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer border ${
        active ? activeStyles : "text-zinc-400 hover:bg-zinc-900 hover:text-white border-transparent"
      }`}
    >
      <span className="text-base shrink-0">{icon}</span>
      <span className="flex-1 text-left truncate">
        <span className="sm:hidden">{shortLabel || label}</span>
        <span className="hidden sm:inline">{label}</span>
      </span>
      {badge > 0 && (
        <span
          className={`shrink-0 min-w-[1.25rem] px-1.5 py-0.5 rounded-full bg-rose-500 text-[10px] text-white font-bold leading-none text-center ${
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
          className="fixed inset-0 z-40 bg-zinc-950/70 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        suppressHydrationWarning
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 transition-transform duration-200 lg:relative lg:z-auto lg:h-full lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="relative border-b border-zinc-800 px-4 py-4 pr-12">
          <button
            type="button"
            onClick={onMobileClose}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer lg:hidden"
            aria-label="Close menu"
          >
            ✕
          </button>
          <p className="text-sm font-semibold text-white truncate">{user?.name || "Dashboard"}</p>
          {user?.email && (
            <p className="text-xs text-zinc-500 truncate mt-0.5">{user.email}</p>
          )}
          <p className="text-xs text-zinc-500 truncate mt-0.5">{user?.role}</p>
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

        <div className="border-t border-zinc-800 p-3">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
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
    </>
  );
}
