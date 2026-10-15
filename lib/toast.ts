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
  const cleaned = message.trim();
  const isDuplicate = kind === "error" && /duplicate/i.test(cleaned);
  let finalMessage = cleaned || message;
  let finalDetail = options?.detail?.trim() || undefined;

  // For duplicate error notifications without custom detail, split before and after first colon
  if (isDuplicate && !finalDetail) {
    const colonIndex = finalMessage.indexOf(":");
    if (colonIndex > 0 && colonIndex < 60) {
      finalDetail = finalMessage.slice(colonIndex + 1).trim();
      finalMessage = finalMessage.slice(0, colonIndex).trim();
    }
  }

  const toast: ToastItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    message: finalMessage,
    sticky: options?.sticky !== undefined ? Boolean(options.sticky) : isDuplicate,
    center: options?.center !== undefined ? Boolean(options.center) : isDuplicate,
    detail: finalDetail,
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
