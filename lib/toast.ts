export type ToastKind = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  kind: ToastKind;
  message: string;
}

type Listener = (toast: ToastItem) => void;

const listeners = new Set<Listener>();

function emit(kind: ToastKind, message: string) {
  const cleaned = message.replace(/^[✅❌⚠️]\s*/, "").trim();
  const toast: ToastItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    message: cleaned || message,
  };
  listeners.forEach((listener) => listener(toast));
}

export const toast = Object.assign(
  (message: string, kind: ToastKind = "info") => emit(kind, message),
  {
    success: (message: string) => emit("success", message),
    error: (message: string) => emit("error", message),
    info: (message: string) => emit("info", message),
  }
);

export function subscribeToasts(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
