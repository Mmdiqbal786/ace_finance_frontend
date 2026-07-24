"use client";

import {
  useEffect,
  useId,
  useState,
  type RefObject,
} from "react";

export type GuideActionItem = {
  id: string;
  label: string;
  /** Shown while busy (optional). */
  busyLabel?: string;
  busy?: boolean;
  disabled?: boolean;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  /** Visual tone for the control. */
  tone?: "sky" | "indigo" | "emerald" | "amber" | "outline" | "danger";
};

const toneClass: Record<NonNullable<GuideActionItem["tone"]>, string> = {
  sky: "bg-sky-300 text-slate-900 hover:bg-sky-200",
  indigo: "bg-indigo-300 text-slate-900 hover:bg-indigo-200",
  emerald: "bg-emerald-300 text-slate-900 hover:bg-emerald-200",
  amber: "bg-amber-300 text-slate-900 hover:bg-amber-200",
  outline:
    "border-[1.5px] border-slate-400 bg-transparent text-slate-200 hover:bg-slate-400/20",
  danger:
    "border-[1.5px] border-rose-400/80 bg-rose-500/20 text-rose-100 hover:bg-rose-500/35",
};

function ActionControl({
  item,
  className,
  onActivate,
}: {
  item: GuideActionItem;
  className: string;
  onActivate?: () => void;
}) {
  const label = item.busy && item.busyLabel ? item.busyLabel : item.label;
  const classes = `${className} ${toneClass[item.tone || "outline"]} disabled:opacity-60`;

  if (item.href) {
    return (
      <a
        href={item.href}
        target={item.external ? "_blank" : undefined}
        rel={item.external ? "noreferrer" : undefined}
        className={classes}
        onClick={onActivate}
      >
        {label}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={item.disabled || item.busy}
      className={classes}
      onClick={() => {
        item.onClick?.();
        onActivate?.();
      }}
    >
      {label}
    </button>
  );
}

type Props = {
  title: string;
  actions: GuideActionItem[];
  /** Called when topbar height may change (menu open/close). */
  onLayoutChange?: () => void;
  barRef?: RefObject<HTMLDivElement | null>;
};

/**
 * Desktop: wrapping action chips.
 * Mobile: compact bar + hamburger drawer (native app–style header).
 */
export default function GuideActionBar({
  title,
  actions,
  onLayoutChange,
  barRef,
}: Props) {
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    onLayoutChange?.();
  }, [menuOpen, onLayoutChange]);

  useEffect(() => {
    function onResize() {
      if (window.matchMedia("(min-width: 768px)").matches) setMenuOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const btnBase =
    "inline-flex min-h-10 items-center justify-center rounded-[10px] px-3 py-2 text-center text-xs font-extrabold sm:px-4 sm:text-[13px]";

  return (
    <div
      ref={barRef}
      className="guide-topbar fixed inset-x-0 z-40 border-b border-slate-600 bg-slate-900/95 shadow-sm backdrop-blur-md"
      style={{ top: "var(--af-site-header-h, 0px)" }}
    >
      {/* Mobile compact header */}
      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-2 px-3 py-2.5 md:hidden">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-extrabold tracking-tight text-white">
            {title}
          </p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Guide actions
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-slate-500 text-slate-100 hover:bg-slate-700/60"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown panel */}
      {menuOpen ? (
        <div
          id={menuId}
          className="border-t border-slate-700 px-3 pb-3 pt-2 md:hidden"
        >
          <div className="flex flex-col gap-2">
            {actions.map((item) => (
              <ActionControl
                key={item.id}
                item={item}
                className={`${btnBase} w-full`}
                onActivate={() => setMenuOpen(false)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* Desktop / tablet wrap row */}
      <div className="mx-auto hidden w-full max-w-[1600px] flex-wrap justify-center gap-2 px-3 py-3 sm:px-6 md:flex lg:px-8">
        {actions.map((item) => (
          <ActionControl key={item.id} item={item} className={btnBase} />
        ))}
      </div>
    </div>
  );
}
