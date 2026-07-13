"use client";

import React, { useMemo } from "react";
import StatCard from "../StatCard";
import { Expense, DashboardStats } from "../../lib/dashboard/types";
import {
  buildMonthlyStats,
  getCurrentMonthByCategory,
  getCurrentMonthStats,
  getMonthOverMonthChange,
} from "../../lib/dashboard/monthlyStats";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "../../lib/dashboard/constants";

interface DashboardHomeOverviewProps {
  expenses: Expense[];
  stats: DashboardStats | null;
}

function formatChange(value: number | null): string {
  if (value === null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(0)}% vs last month`;
}

export default function DashboardHomeOverview({ expenses, stats }: DashboardHomeOverviewProps) {
  const currentMonth = useMemo(() => getCurrentMonthStats(expenses), [expenses]);
  const monthlyTrend = useMemo(() => buildMonthlyStats(expenses, 6), [expenses]);
  const monthCategories = useMemo(() => getCurrentMonthByCategory(expenses), [expenses]);
  const momChange = useMemo(() => getMonthOverMonthChange(expenses), [expenses]);

  const maxMonthlyValue = Math.max(
    ...monthlyTrend.map((month) => Math.max(month.requested, month.paid)),
    1
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Requested This Month"
          value={`$${currentMonth.requested.toFixed(2)}`}
          subtext={`${currentMonth.submissions} submissions · ${formatChange(momChange.requestedChange)}`}
          emoji="💵"
        />
        <StatCard
          title="Paid This Month"
          value={`$${currentMonth.paid.toFixed(2)}`}
          subtext={`${currentMonth.processed} processed · ${formatChange(momChange.paidChange)}`}
          emoji="💳"
          valueColor="text-emerald-400"
        />
        <StatCard
          title="Still Pending"
          value={String(currentMonth.pending)}
          subtext="Awaiting approval or payout"
          emoji="⏳"
          valueColor="text-amber-500"
        />
        <StatCard
          title="Rejected This Month"
          value={String(currentMonth.rejected)}
          subtext="Declined requests"
          emoji="🚫"
          valueColor="text-rose-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <span>📈</span> 6-Month Trend
          </h3>
          <p className="text-xs text-zinc-500 mb-5">Requested vs paid amounts by month</p>

          <div className="space-y-4">
            {monthlyTrend.map((month) => (
              <div key={month.monthKey} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-300">{month.label}</span>
                  <span className="text-zinc-500">
                    {month.submissionCount} req · ${month.requested.toFixed(0)} / ${month.paid.toFixed(0)} paid
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 w-full rounded-full bg-zinc-950 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                      style={{ width: `${(month.requested / maxMonthlyValue) * 100}%` }}
                    />
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-950 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                      style={{ width: `${(month.paid / maxMonthlyValue) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mt-5 text-[10px] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500" /> Requested
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Paid
            </span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <span>📊</span> Spending by Category
          </h3>
          <div className="space-y-3">
            {Object.entries(monthCategories).map(([category, amount]) => {
              const total = currentMonth.requested || 1;
              const percent = (amount / total) * 100;
              return (
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-zinc-300">
                      <span>{CATEGORY_ICONS[category] || "📦"}</span>
                      {category}
                    </span>
                    <span className="text-zinc-400 font-semibold">${amount.toFixed(2)}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-zinc-950 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${CATEGORY_COLORS[category] || "from-zinc-500 to-zinc-600"}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {Object.keys(monthCategories).length === 0 && (
              <p className="text-xs text-zinc-500 py-6 text-center">No expenses submitted this month yet.</p>
            )}
          </div>
        </div>
      </div>

      {stats && stats.recentActivity.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <span>⏱️</span> Recent Activity
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stats.recentActivity.slice(0, 6).map((log, index) => (
              <div
                key={`${log.expenseId}-${index}`}
                className="flex items-start gap-3 rounded-xl bg-zinc-950 border border-zinc-800 p-3"
              >
                <div className="h-8 w-8 shrink-0 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sm">
                  {log.action.includes("Submitted")
                    ? "📥"
                    : log.action.includes("Approved")
                      ? "✅"
                      : log.action.includes("Rejected")
                        ? "❌"
                        : "💸"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-200 truncate">{log.action}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 truncate">
                    {log.requesterName} · {new Date(log.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
