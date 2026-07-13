"use client";

import React from "react";

interface TableRowActionsProps {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  showDelete?: boolean;
  compact?: boolean;
  align?: "center" | "end";
}

export default function TableRowActions({
  onView,
  onEdit,
  onDelete,
  showDelete = true,
  compact = false,
  align = "center",
}: TableRowActionsProps) {
  const buttonClass = compact
    ? "inline-flex h-7 items-center justify-center rounded-lg px-2 text-[11px] font-semibold transition-colors cursor-pointer"
    : "inline-flex h-8 items-center justify-center rounded-lg px-2.5 text-xs font-semibold transition-colors cursor-pointer";

  const alignClass = align === "end" ? "justify-end" : "justify-center";

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${alignClass}`}>
      <button
        type="button"
        onClick={onView}
        className={`${buttonClass} bg-zinc-800 hover:bg-zinc-700 text-zinc-300`}
        title="View details"
      >
        View
      </button>
      <button
        type="button"
        onClick={onEdit}
        className={`${buttonClass} bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/20`}
        title="Edit"
      >
        Edit
      </button>
      {showDelete && (
        <button
          type="button"
          onClick={onDelete}
          className={`${buttonClass} bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-900/30`}
          title="Delete"
        >
          Delete
        </button>
      )}
    </div>
  );
}
