export type ToastKind = "success" | "error" | "info";

export interface ToastOptions {
  /** Stay until the user dismisses (no auto-close). */
  sticky?: boolean;
  /** Show centered on screen (with dimmed backdrop). */
  center?: boolean;
  /** Extra line under the message (e.g. expense ID). */
  detail?: string;
}

export interface ToastItem {
  id: string;
  kind: ToastKind;
  message: string;
  sticky?: boolean;
  center?: boolean;
  detail?: string;
}

type Listener = (toast: ToastItem) => void;

const listeners = new Set<Listener>();

function emit(kind: ToastKind, message: string, options?: ToastOptions) {
  const cleaned = message.replace(/^[✅❌⚠️]\s*/, "").trim();
  const toast: ToastItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    message: cleaned || message,
    sticky: Boolean(options?.sticky),
    center: Boolean(options?.center),
    detail: options?.detail?.trim() || undefined,
  };
  listeners.forEach((listener) => listener(toast));
}

export const toast = Object.assign(
  (message: string, kind: ToastKind = "info", options?: ToastOptions) =>
    emit(kind, message, options),
  {
    success: (message: string, options?: ToastOptions) => emit("success", message, options),
    error: (message: string, options?: ToastOptions) => emit("error", message, options),
    info: (message: string, options?: ToastOptions) => emit("info", message, options),
  }
);

export function subscribeToasts(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
