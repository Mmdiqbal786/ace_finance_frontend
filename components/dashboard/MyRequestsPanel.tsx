"use client";

import React from "react";
import StatusBadge from "../StatusBadge";
import DueDateBadge from "../DueDateBadge";
import TableToolbar from "../TableToolbar";
import TablePagination from "../TablePagination";
import TableRowActions from "../TableRowActions";
import { usePaginatedList } from "../../hooks/usePaginatedList";
import { filterExpenseTable } from "../../lib/dashboard/constants";
import {
  canRequesterEditExpense,
  getPaidAmount,
  getRemainingAmount,
} from "../../lib/dashboard/payment";
import { Expense } from "../../lib/dashboard/types";

interface SelectOption {
  value: string;
  label: string;
}

interface MyRequestsPanelProps {
  expenses: Expense[];
  categoryFilterOptions: SelectOption[];
  projectFilterOptions: SelectOption[];
  onView: (expense: Expense) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export default function MyRequestsPanel({
  expenses,
  categoryFilterOptions,
  projectFilterOptions,
  onView,
  onEdit,
  onDelete,
}: MyRequestsPanelProps) {
  const table = usePaginatedList(expenses, {
    filterFn: filterExpenseTable,
    initialFilters: { category: "ALL", project: "ALL" },
  });

  return (
    <div className="portal-card rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 min-w-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5 pb-4 border-b border-slate-200">
        <span className="text-sm text-slate-700 font-medium">
          Showing {table.totalCount} of your expense request
          {table.totalCount === 1 ? "" : "s"}
        </span>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-16 text-slate-700">
          <span className="text-3xl block mb-2">📭</span>
          <p className="text-sm font-semibold">No requests yet</p>
          <p className="text-xs mt-1 text-slate-600">
            Submit an expense from the Submit Expense page to see it here.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <TableToolbar
              search={table.search}
              onSearchChange={table.setSearch}
              searchPlaceholder="Search ID, project, description..."
              filters={[
                {
                  id: "category",
                  value: table.filters.category,
                  onChange: (value: string) => table.setFilter("category", value),
                  options: categoryFilterOptions,
                },
                {
                  id: "project",
                  value: table.filters.project,
                  onChange: (value: string) => table.setFilter("project", value),
                  options: projectFilterOptions,
                },
              ]}
            />
          </div>

          {table.totalCount === 0 ? (
            <div className="text-center py-12 text-slate-700">
              <p className="text-sm font-semibold">No results match filters</p>
            </div>
          ) : (
            <>
              <div className="af-table-wrap">
                <table className="af-table min-w-full">
                  <thead>
                    <tr>
                      <th className="py-3 px-4">Request ID</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Change Request</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-right">Paid</th>
                      <th className="py-3 px-4 text-right">Remaining</th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.paginated.map((e) => {
                      // Edit only after staff Request Changes — requesters never delete
                      const canEdit = canRequesterEditExpense(e);
                      return (
                        <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-sm text-[var(--af-accent)] font-bold">
                            {e.id}
                          </td>
                          <td className="py-3.5 px-4 text-sm">{e.category}</td>
                          <td className="py-3.5 px-4 text-sm text-slate-700">{e.project || "—"}</td>
                          <td className="py-3.5 px-4">
                            <DueDateBadge
                              dueDate={e.dueDate}
                              status={e.status}
                              amount={e.amount}
                              paidAmount={e.paidAmount}
                            />
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={e.status} className="text-xs py-0.5" />
                          </td>
                          <td
                            className="py-3.5 px-4 max-w-[180px] truncate text-xs text-amber-800 italic"
                            title={e.changeRequestNotes || undefined}
                          >
                            {e.changeRequestNotes ? `"${e.changeRequestNotes}"` : "—"}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                            ${e.amount.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-emerald-700">
                            ${getPaidAmount(e).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-amber-700">
                            ${getRemainingAmount(e).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4">
                            <TableRowActions
                              onView={() => onView(e)}
                              onEdit={() => onEdit(e)}
                              onDelete={() => onDelete(e)}
                              showEdit={canEdit}
                              showDelete={false}
                              editSlotAction={null}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <TablePagination
                page={table.page}
                totalPages={table.totalPages}
                pageSize={table.pageSize}
                totalCount={table.totalCount}
                onPageChange={table.setPage}
                onPageSizeChange={table.setPageSize}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
