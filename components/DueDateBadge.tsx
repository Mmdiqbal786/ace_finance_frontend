"use client";

import React from "react";
import { getDueDateInfo } from "../lib/dashboard/dueDate";

const URGENCY_STYLES = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  yellow: "bg-amber-50 text-amber-800 border-amber-200",
  red: "bg-rose-50 text-rose-700 border-rose-200",
  none: "bg-slate-50 text-slate-500 border-slate-200",
} as const;

const DOT_STYLES = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-rose-500",
  none: "bg-slate-400",
} as const;

interface DueDateBadgeProps {
  dueDate?: string;
  className?: string;
}

export default function DueDateBadge({ dueDate, className = "" }: DueDateBadgeProps) {
  const info = getDueDateInfo(dueDate);

  return (
    <div className={`inline-flex flex-col gap-0.5 ${className}`}>
      <span className="text-xs font-medium text-slate-800">{info.dateLabel}</span>
      <span
        className={`inline-flex items-center gap-1.5 w-fit rounded-full border px-2 py-0.5 text-[11px] font-semibold ${URGENCY_STYLES[info.urgency]}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${DOT_STYLES[info.urgency]}`} />
        {info.label}
      </span>
    </div>
  );
}
