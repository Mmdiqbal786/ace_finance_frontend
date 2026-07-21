"use client";

import React from "react";
import StatCard from "../StatCard";
import { getRemainingAmount, isProcessorQueueStatus } from "../../lib/dashboard/payment";
import { DashboardSection, DashboardStats, Expense } from "../../lib/dashboard/types";

interface DashboardSectionStatsProps {
  section: DashboardSection;
  stats: DashboardStats;
  expenses: Expense[];
  users?: { isActive: boolean; role: string }[];
  categories?: { isActive: boolean }[];
  projects?: { isActive: boolean }[];
  pendingApproverCount: number;
  pendingProcessorCount: number;
}

export default function DashboardSectionStats({
  section,
  stats,
  expenses,
  users = [],
  categories = [],
  projects = [],
  pendingApproverCount,
  pendingProcessorCount,
}: DashboardSectionStatsProps) {
  const pendingApproverAmount = expenses
    .filter((e) => e.status === "PENDING_APPROVER")
    .reduce((sum, e) => sum + e.amount, 0);

  const pendingProcessorAmount = expenses
    .filter((e) => isProcessorQueueStatus(e.status))
    .reduce((sum, e) => sum + getRemainingAmount(e), 0);

  if (section === "approver") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard
          title="Awaiting Your Approval"
          value={String(pendingApproverCount)}
          subtext="Pending in your queue"
          emoji="🛡️"
          valueColor="text-amber-500"
        />
        <StatCard
          title="Pending Amount"
          value={`$${pendingApproverAmount.toFixed(2)}`}
          subtext="Total awaiting sign-off"
          emoji="💵"
          valueColor="text-orange-500"
        />
        <StatCard
          title="Rejected (All Time)"
          value={String(stats.rejected)}
          subtext="Declined requests"
          emoji="🚫"
          valueColor="text-rose-500"
        />
      </div>
    );
  }

  if (section === "processor") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard
          title="Ready to Pay"
          value={String(pendingProcessorCount)}
          subtext="Approved, awaiting disbursement"
          emoji="💸"
          valueColor="text-[var(--af-accent)]"
        />
        <StatCard
          title="Payout Amount"
          value={`$${pendingProcessorAmount.toFixed(2)}`}
          subtext="Total ready for release"
          emoji="💵"
          valueColor="text-orange-500"
        />
        <StatCard
          title="Paid (All Time)"
          value={`$${stats.totalProcessedAmount.toFixed(2)}`}
          subtext={`${stats.processed} expenses processed`}
          emoji="💳"
          valueColor="text-emerald-600"
        />
      </div>
    );
  }

  if (section === "user-management") {
    const activeUsers = users.filter((u) => u.isActive).length;
    const adminCount = users.filter((u) => u.role === "ADMIN").length;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard
          title="Total Users"
          value={String(users.length)}
          subtext="Registered accounts"
          emoji="👥"
        />
        <StatCard
          title="Active Users"
          value={String(activeUsers)}
          subtext={`${users.length - activeUsers} inactive`}
          emoji="✅"
          valueColor="text-emerald-600"
        />
        <StatCard
          title="Administrators"
          value={String(adminCount)}
          subtext="Full-access accounts"
          emoji="👑"
          valueColor="text-amber-600"
        />
      </div>
    );
  }

  if (section === "categories") {
    const activeCount = categories.filter((c) => c.isActive).length;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard title="Total Categories" value={String(categories.length)} subtext="Configured categories" emoji="🏷️" />
        <StatCard
          title="Active"
          value={String(activeCount)}
          subtext="Shown on expense form"
          emoji="✅"
          valueColor="text-emerald-600"
        />
        <StatCard
          title="Inactive"
          value={String(categories.length - activeCount)}
          subtext="Hidden from form"
          emoji="○"
          valueColor="text-rose-500"
        />
      </div>
    );
  }

  if (section === "projects") {
    const activeCount = projects.filter((p) => p.isActive).length;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard title="Total Projects" value={String(projects.length)} subtext="Configured projects" emoji="📁" />
        <StatCard
          title="Active"
          value={String(activeCount)}
          subtext="Selectable on form"
          emoji="✅"
          valueColor="text-emerald-600"
        />
        <StatCard
          title="Inactive"
          value={String(projects.length - activeCount)}
          subtext="Hidden from form"
          emoji="○"
          valueColor="text-rose-500"
        />
      </div>
    );
  }

  if (section === "analytics") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard
          title="Total Submissions"
          value={String(stats.totalRequests)}
          subtext="All expense requests"
          emoji="📋"
        />
        <StatCard
          title="Total Volume"
          value={`$${stats.totalRequestedAmount.toFixed(2)}`}
          subtext="Requested amount"
          emoji="💵"
          valueColor="text-orange-500"
        />
        <StatCard
          title="Total Disbursed"
          value={`$${stats.totalProcessedAmount.toFixed(2)}`}
          subtext={`${stats.processed} paid out`}
          emoji="💳"
          valueColor="text-emerald-600"
        />
        <StatCard
          title="Rejection Rate"
          value={
            stats.totalRequests > 0
              ? `${((stats.rejected / stats.totalRequests) * 100).toFixed(0)}%`
              : "0%"
          }
          subtext={`${stats.rejected} rejected`}
          emoji="🚫"
          valueColor="text-rose-500"
        />
      </div>
    );
  }

  return null;
}
