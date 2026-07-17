import React from "react";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  let label = "Unknown";
  let badgeStyle = "bg-slate-100 text-slate-600 ring-slate-200";

  switch (status) {
    case "PENDING_APPROVER":
      label = "Awaiting Manager Approval";
      badgeStyle = "bg-amber-50 text-amber-700 ring-amber-200";
      break;
    case "CHANGES_REQUESTED":
      label = "Changes Requested";
      badgeStyle = "bg-orange-50 text-orange-700 ring-orange-200";
      break;
    case "APPROVED_APPROVER":
      label = "Approved - Awaiting Processing";
      badgeStyle = "bg-sky-50 text-[var(--af-accent)] ring-sky-200";
      break;
    case "PARTIALLY_PAID":
      label = "Partially Paid";
      badgeStyle = "bg-amber-50 text-amber-700 ring-amber-200";
      break;
    case "PROCESSED":
      label = "Disbursed & Paid";
      badgeStyle = "bg-emerald-50 text-emerald-700 ring-emerald-200";
      break;
    case "REJECTED_APPROVER":
      label = "Rejected by Manager";
      badgeStyle = "bg-rose-50 text-rose-700 ring-rose-200";
      break;
    case "REJECTED_PROCESSOR":
      label = "Rejected by Finance";
      badgeStyle = "bg-rose-50 text-rose-700 ring-rose-200";
      break;
    default:
      label = status;
      break;
  }

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${badgeStyle} ${className}`}
    >
      {label}
    </span>
  );
}
