"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AppNotification,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  notificationHref,
} from "../lib/notifications";
import { AuthUser } from "../lib/auth";

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "";
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell({ user }: { user: AuthUser }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const refreshCount = useCallback(async () => {
    try {
      const count = await fetchUnreadNotificationCount();
      setUnread(count);
    } catch {
      // Keep last known count if API is briefly unavailable.
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchNotifications(25);
      setItems(list);
      setUnread(list.filter((n) => !n.isRead).length);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCount();
    const timer = window.setInterval(() => void refreshCount(), 45000);
    return () => window.clearInterval(timer);
  }, [refreshCount]);

  useEffect(() => {
    if (!open) return;
    void loadList();
  }, [open, loadList]);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onItemClick = async (n: AppNotification) => {
    if (!n.isRead) {
      try {
        await markNotificationRead(n.id);
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
        setUnread((c) => Math.max(0, c - 1));
      } catch {
        // Navigation still allowed even if mark-read fails.
      }
    }
    setOpen(false);
  };

  const onMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
      setUnread(0);
    } catch {
      // Ignore transient errors.
    }
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Notifications"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-400 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-500 transition-colors cursor-pointer"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9"
          />
        </svg>
        {unread > 0 && (
          <span className="af-notif-pulse absolute -top-1.5 -right-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="z-50 overflow-hidden rounded-xl border border-slate-400 bg-white shadow-xl shadow-[var(--af-navy)]/10 absolute right-0 mt-2 w-[22rem] max-w-[min(22rem,calc(100vw-1.5rem))] max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:top-[calc(var(--af-site-header-h,3.5rem)+0.35rem)] max-sm:mt-0 max-sm:w-auto max-sm:max-w-none"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3.5 py-2.5">
            <p className="text-sm font-bold text-slate-900">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={onMarkAll}
                className="text-xs font-semibold text-[var(--af-accent)] hover:underline cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">Loading...</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet.</p>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  href={notificationHref(n, user.role)}
                  onClick={() => void onItemClick(n)}
                  className={`block border-b border-slate-100 px-3.5 py-3 hover:bg-slate-50 transition-colors ${
                    n.isRead ? "bg-white" : "bg-sky-50/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 leading-snug">{n.title}</p>
                    {!n.isRead && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--af-accent)]" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
