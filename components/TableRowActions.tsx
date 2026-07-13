"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface TableExtraAction {
  label: string;
  icon?: string;
  onClick: () => void;
  tone?: "default" | "success" | "danger";
}

interface TableRowActionsProps {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  showDelete?: boolean;
  align?: "center" | "end";
  extraActions?: TableExtraAction[];
}

const toneClass: Record<NonNullable<TableExtraAction["tone"]>, string> = {
  default: "text-zinc-300 hover:bg-zinc-800",
  success: "text-emerald-400 hover:bg-emerald-500/10",
  danger: "text-rose-400 hover:bg-rose-500/10",
};

const MENU_MIN_WIDTH = 168;

export default function TableRowActions({
  onView,
  onEdit,
  onDelete,
  showDelete = true,
  align = "end",
  extraActions = [],
}: TableRowActionsProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const menuHeight = menuRef.current?.offsetHeight ?? 220;
    const menuWidth = menuRef.current?.offsetWidth ?? MENU_MIN_WIDTH;
    const gap = 6;

    let top = rect.bottom + gap;
    if (top + menuHeight > window.innerHeight - 8) {
      top = rect.top - menuHeight - gap;
    }

    let left =
      align === "end"
        ? rect.right - menuWidth
        : rect.left + rect.width / 2 - menuWidth / 2;

    left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - menuHeight - 8));

    setCoords({ top, left });
  }, [align]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition, extraActions.length, showDelete]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const handleReposition = () => updatePosition();

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, updatePosition]);

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  const alignClass = align === "end" ? "justify-end" : "justify-center";

  const menu =
    open &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={menuRef}
        role="menu"
        style={{ position: "fixed", top: coords.top, left: coords.left, zIndex: 9999 }}
        className="min-w-[10.5rem] rounded-xl border border-zinc-800 bg-zinc-950 p-1 shadow-xl shadow-black/50"
      >
        {extraActions.map((action) => (
          <button
            key={action.label}
            type="button"
            role="menuitem"
            onClick={() => run(action.onClick)}
            className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors cursor-pointer ${
              toneClass[action.tone || "default"]
            }`}
          >
            {action.icon && <span>{action.icon}</span>}
            {action.label}
          </button>
        ))}

        {extraActions.length > 0 && <div className="my-1 border-t border-zinc-800" />}

        <button
          type="button"
          role="menuitem"
          onClick={() => run(onView)}
          className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <span>👁️</span>
          View
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={() => run(onEdit)}
          className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-indigo-300 hover:bg-indigo-500/10 transition-colors cursor-pointer"
        >
          <span>✏️</span>
          Edit
        </button>
        {showDelete && (
          <button
            type="button"
            role="menuitem"
            onClick={() => run(onDelete)}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <span>🗑️</span>
            Delete
          </button>
        )}
      </div>,
      document.body
    );

  return (
    <>
      <div ref={rootRef} className={`relative flex ${alignClass}`}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Row actions"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 4a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
          </svg>
        </button>
      </div>
      {menu}
    </>
  );
}
