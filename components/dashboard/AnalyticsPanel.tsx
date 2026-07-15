"use client";

import React from "react";
import { toast } from "../../lib/toast";
import { CATEGORY_COLORS } from "../../lib/dashboard/constants";
import { DashboardStats, Expense } from "../../lib/dashboard/types";
import ExpenseQueuePanel from "./ExpenseQueuePanel";

interface SelectOption {
  value: string;
  label: string;
}

interface AnalyticsPanelProps {
  stats: DashboardStats | null;
  expenses: Expense[];
  categoryFilterOptions: SelectOption[];
  projectFilterOptions: SelectOption[];
  onView: (expense: Expense) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

function exportExpensesCsv(rows: Expense[]) {
  if (rows.length === 0) {
    toast.info("No data available to export.");
    return;
  }

  const headers = [
    "Request ID",
    "Requester Name",
    "Requester Email",
    "Amount (USD)",
    "Category",
    "Project",
    "Description",
    "Date Logged",
    "Status",
    "Date Submitted",
    "Manager Notes",
    "Finance Notes",
  ];

  const csvRows = rows.map((e) => [
    e.id,
    e.requesterName,
    e.requesterEmail,
    e.amount.toFixed(2),
    e.category,
    e.project || "",
    `"${e.description.replace(/"/g, '""')}"`,
    e.date,
    e.status,
    e.submittedAt,
    e.approverNotes ? `"${e.approverNotes.replace(/"/g, '""')}"` : "",
    e.processorNotes ? `"${e.processorNotes.replace(/"/g, '""')}"` : "",
  ]);

  const csvString = [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `AceolutionFinance_Report_${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AnalyticsPanel({
  stats,
  expenses,
  categoryFilterOptions,
  projectFilterOptions,
  onView,
  onEdit,
  onDelete,
}: AnalyticsPanelProps) {
  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 portal-card rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span>📊</span> Volume by Category
            </h3>
            <div className="space-y-4">
              {Object.entries(stats.byCategory).map(([category, amount]) => {
                const percent =
                  stats.totalRequestedAmount > 0
                    ? (amount / stats.totalRequestedAmount) * 100
                    : 0;
                const colorClass = CATEGORY_COLORS[category] || "from-slate-400 to-slate-500";
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-600">{category}</span>
                      <span className="text-slate-700 font-bold">
                        ${amount.toFixed(2)}{" "}
                        <span className="text-slate-700">({percent.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-50 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${colorClass}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {Object.keys(stats.byCategory).length === 0 && (
                <p className="text-xs text-slate-700 py-6 text-center">
                  No categories recorded yet.
                </p>
              )}
            </div>
          </div>

          <div className="portal-card rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span>⏱️</span> Audit Activity Log
            </h3>
            <div className="flow-root max-h-64 overflow-y-auto pr-1">
              <ul role="list" className="-mb-8">
                {stats.recentActivity.map((log, logIdx) => (
                  <li key={logIdx}>
                    <div className="relative pb-6">
                      {logIdx !== stats.recentActivity.length - 1 ? (
                        <span
                          className="absolute left-3 top-3 -ml-px h-full w-0.5 bg-slate-100"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="relative flex space-x-2 items-start">
                        <div className="h-6 w-6 rounded-full bg-slate-50 border border-slate-400 flex items-center justify-center text-xs">
                          {log.action.includes("Submitted")
                            ? "📥"
                            : log.action.includes("Approved")
                              ? "✅"
                              : log.action.includes("Rejected")
                                ? "❌"
                                : "💸"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-800">{log.action}</div>
                          <div className="text-xs text-slate-700 font-mono mt-0.5">
                            {log.expenseId.substring(0, 14)}... • {log.user}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
                {stats.recentActivity.length === 0 && (
                  <p className="text-xs text-slate-700 py-6 text-center">No logged logs.</p>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      <ExpenseQueuePanel
        variant="tracker"
        expenses={expenses}
        categoryFilterOptions={categoryFilterOptions}
        projectFilterOptions={projectFilterOptions}
        headerText="All Expense Database"
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        toolbarExtra={({ filtered }) => (
          <button
            type="button"
            onClick={() => exportExpensesCsv(filtered)}
            className="inline-flex items-center justify-center rounded-xl bg-[var(--af-navy)] hover:bg-[var(--af-navy-soft)] px-3.5 py-1.5 text-xs font-bold text-white shadow transition-colors cursor-pointer"
          >
            📥 Export CSV Report
          </button>
        )}
      />
    </div>
  );
}
