"use client";

import React from "react";
import { getDueDateInfo } from "../lib/dashboard/dueDate";
import { isFullyPaid } from "../lib/dashboard/payment";

const URGENCY_STYLES = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  yellow: "bg-amber-50 text-amber-800 border-amber-200",
  red: "bg-rose-50 text-rose-700 border-rose-200",
  none: "bg-slate-50 text-slate-500 border-slate-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  changes: "bg-orange-50 text-orange-800 border-orange-200",
} as const;

const DOT_STYLES = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-rose-500",
  none: "bg-slate-400",
  paid: "bg-emerald-500",
  rejected: "bg-rose-500",
  changes: "bg-orange-500",
} as const;

function isRejectedStatus(status?: string): boolean {
  return status === "REJECTED_APPROVER" || status === "REJECTED_PROCESSOR";
}

function isChangesRequestedStatus(status?: string): boolean {
  return status === "CHANGES_REQUESTED";
}

interface DueDateBadgeProps {
  dueDate?: string;
  status?: string;
  amount?: number;
  paidAmount?: number;
  className?: string;
}

export default function DueDateBadge({
  dueDate,
  status,
  amount,
  paidAmount,
  className = "",
}: DueDateBadgeProps) {
  const info = getDueDateInfo(dueDate);
  const rejected = isRejectedStatus(status);
  const changesRequested = isChangesRequestedStatus(status);
  const paid =
    !rejected && !changesRequested && status != null && amount != null
      ? isFullyPaid({ status, amount, paidAmount })
      : false;

  const badgeUrgency = rejected
    ? "rejected"
    : changesRequested
      ? "changes"
      : paid
        ? "paid"
        : info.urgency;
  const badgeLabel = rejected
    ? "Rejected"
    : changesRequested
      ? "Changes needed"
      : paid
        ? "Paid"
        : info.label;

  return (
    <div className={`inline-flex flex-col gap-0.5 ${className}`}>
      <span className="text-xs font-medium text-slate-800">{info.dateLabel}</span>
      <span
        className={`inline-flex items-center gap-1.5 w-fit rounded-full border px-2 py-0.5 text-[11px] font-semibold ${URGENCY_STYLES[badgeUrgency]}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${DOT_STYLES[badgeUrgency]}`} />
        {badgeLabel}
      </span>
    </div>
  );
}
