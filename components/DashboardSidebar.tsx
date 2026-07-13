"use client";

import React, { useState } from "react";
import { AuthUser, logout } from "../lib/auth";
import Modal from "./Modal";

export type DashboardTab = "approver" | "processor" | "tracker" | "users";

interface DashboardSidebarProps {
  user: AuthUser | null;
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  pendingApproverCount: number;
  pendingProcessorCount: number;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavItemProps {
  icon: string;
  label: string;
  shortLabel?: string;
  active: boolean;
  badge?: number;
  pulse?: boolean;
  accent?: "indigo" | "amber";
  onClick: () => void;
}

function NavItem({
  icon,
  label,
  shortLabel,
  active,
  badge = 0,
  pulse = false,
  accent = "indigo",
  onClick,
}: NavItemProps) {
  const activeStyles =
    accent === "amber"
      ? "bg-amber-600/15 text-amber-300 border-amber-500/20"
      : "bg-indigo-600/15 text-indigo-300 border-indigo-500/20";

  return (
    <button
      type="button"
      onClick={onClick}
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
    </button>
  );
}

export default function DashboardSidebar({
  user,
  activeTab,
  onTabChange,
  pendingApproverCount,
  pendingProcessorCount,
  mobileOpen,
  onMobileClose,
}: DashboardSidebarProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSelect = (tab: DashboardTab) => {
    onTabChange(tab);
    onMobileClose();
  };

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
          {(user?.role === "APPROVER" || user?.role === "ADMIN") && (
            <NavItem
              icon="🛡️"
              label="Approver"
              active={activeTab === "approver"}
              badge={pendingApproverCount}
              pulse
              onClick={() => handleSelect("approver")}
            />
          )}

          {(user?.role === "PROCESSOR" || user?.role === "ADMIN") && (
            <NavItem
              icon="💸"
              label="Processor"
              active={activeTab === "processor"}
              badge={pendingProcessorCount}
              onClick={() => handleSelect("processor")}
            />
          )}

          {user?.role === "ADMIN" && (
            <NavItem
              icon="👥"
              label="User Management"
              shortLabel="Users"
              active={activeTab === "users"}
              accent="amber"
              onClick={() => handleSelect("users")}
            />
          )}

          <NavItem
            icon="📊"
            label="Analytics & Tracker"
            shortLabel="Analytics"
            active={activeTab === "tracker"}
            onClick={() => handleSelect("tracker")}
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
