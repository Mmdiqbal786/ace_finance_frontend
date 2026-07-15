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
      setToasts((prev) => [...prev.slice(-4), item]);
    });
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-3 z-[200] flex flex-col items-end gap-2 px-3 sm:top-4 sm:right-4 sm:left-auto sm:w-auto sm:max-w-sm"
        aria-live="polite"
        aria-relevant="additions"
        suppressHydrationWarning
      >
        {toasts.map((item) => (
          <ToastCard key={item.id} toast={item} onDone={() => dismiss(item.id)} />
        ))}
      </div>
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
    const timer = window.setTimeout(onDone, TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [onDone]);

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
      <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">{toast.message}</p>
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

/** Prefer importing `toast` from `lib/toast` in feature code. */
export function useToast() {
  return toastApi;
}
