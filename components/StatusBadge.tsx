import React from "react";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  let label = "Unknown";
  let badgeStyle = "bg-zinc-400/10 text-zinc-400 ring-zinc-400/20";

  switch (status) {
    case "PENDING_APPROVER":
      label = "Awaiting Manager Approval";
      badgeStyle = "bg-amber-400/10 text-amber-400 ring-amber-400/20";
      break;
    case "APPROVED_APPROVER":
      label = "Approved - Awaiting Processing";
      badgeStyle = "bg-sky-400/10 text-sky-400 ring-sky-400/20";
      break;
    case "PROCESSED":
      label = "Disbursed & Paid";
      badgeStyle = "bg-emerald-400/10 text-emerald-400 ring-emerald-400/20";
      break;
    case "REJECTED_APPROVER":
      label = "Rejected by Manager";
      badgeStyle = "bg-rose-400/10 text-rose-400 ring-rose-400/20";
      break;
    case "REJECTED_PROCESSOR":
      label = "Rejected by Finance";
      badgeStyle = "bg-rose-400/10 text-rose-400 ring-rose-400/20";
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
