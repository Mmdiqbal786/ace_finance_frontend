"use client";

import React, { useEffect, useState } from "react";
import { subscribeToasts, toast as toastApi, type ToastItem, type ToastKind } from "../lib/toast";

const TOAST_MS = 3200;

function toneStyles(kind: ToastKind) {
  if (kind === "success") {
    return {
      wrap: "border-emerald-200 bg-emerald-50 text-emerald-800",
      mark: "bg-emerald-500 text-white",
      icon: "✓",
    };
  }
  if (kind === "error") {
    return {
      wrap: "border-rose-200 bg-rose-50 text-rose-800",
      mark: "bg-rose-500 text-white",
      icon: "!",
    };
  }
  return {
    wrap: "border-sky-200 bg-sky-50 text-slate-800",
    mark: "bg-[var(--af-navy)] text-white",
    icon: "i",
  };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return subscribeToasts((item) => {
      setToasts((prev) => {
        // Only one sticky/center toast at a time; keep recent corner toasts.
        if (item.sticky || item.center) {
          return [...prev.filter((t) => !t.sticky && !t.center), item];
        }
        return [...prev.filter((t) => t.sticky || t.center), ...prev.filter((t) => !t.sticky && !t.center).slice(-4), item];
      });
    });
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const cornerToasts = toasts.filter((t) => !t.center);
  const centerToasts = toasts.filter((t) => t.center);

  return (
    <>
      {children}

      <div
        className="pointer-events-none fixed inset-x-0 top-3 z-[200] flex flex-col items-end gap-2 px-3 sm:top-4 sm:right-4 sm:left-auto sm:w-auto sm:max-w-sm"
        aria-live="polite"
        aria-relevant="additions"
        suppressHydrationWarning
      >
        {cornerToasts.map((item) => (
          <ToastCard key={item.id} toast={item} onDone={() => dismiss(item.id)} />
        ))}
      </div>

      {centerToasts.map((item) => (
        <CenterToast key={item.id} toast={item} onDone={() => dismiss(item.id)} />
      ))}
    </>
  );
}

function ToastCard({
  toast,
  onDone,
}: {
  toast: ToastItem;
  onDone: () => void;
}) {
  const styles = toneStyles(toast.kind);

  useEffect(() => {
    if (toast.sticky) return;
    const timer = window.setTimeout(onDone, TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [onDone, toast.sticky]);

  return (
    <div
      role="status"
      className={`pointer-events-auto flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 shadow-lg shadow-slate-900/10 animate-[af-toast-in_0.28s_ease-out] sm:w-[22rem] ${styles.wrap}`}
    >
      <span
        className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${styles.mark}`}
      >
        {styles.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug">{toast.message}</p>
        {toast.detail && (
          <p className="mt-1 break-all font-mono text-xs font-bold opacity-90">{toast.detail}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onDone}
        className="shrink-0 rounded-md px-1.5 py-0.5 text-sm font-bold opacity-60 hover:opacity-100 cursor-pointer"
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}

function CenterToast({
  toast,
  onDone,
}: {
  toast: ToastItem;
  onDone: () => void;
}) {
  const styles = toneStyles(toast.kind);

  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-900/40 p-4 animate-[af-toast-in_0.28s_ease-out]"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={`toast-title-${toast.id}`}
      suppressHydrationWarning
    >
      <div
        className={`relative z-10 w-full max-w-md rounded-2xl border px-5 py-5 shadow-2xl shadow-slate-900/20 ${styles.wrap}`}
      >
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${styles.mark}`}
          >
            {styles.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p id={`toast-title-${toast.id}`} className="text-base font-bold leading-snug">
              {toast.message}
            </p>
            {toast.detail && (
              <p className="mt-2 rounded-lg border border-current/15 bg-white/60 px-3 py-2 font-mono text-sm font-bold tracking-wide text-slate-900">
                {toast.detail}
              </p>
            )}
            <p className="mt-2 text-xs font-medium opacity-70">
              Click Dismiss to continue — this notice stays until you close it.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDone}
          className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl bg-[var(--af-navy)] px-4 text-sm font-bold text-white hover:bg-[var(--af-navy-soft)] cursor-pointer"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

/** Prefer importing `toast` from `lib/toast` in feature code. */
export function useToast() {
  return toastApi;
}
