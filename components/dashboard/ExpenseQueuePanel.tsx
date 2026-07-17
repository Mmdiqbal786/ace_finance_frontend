"use client";

import React from "react";
import StatusBadge from "../StatusBadge";
import DueDateBadge from "../DueDateBadge";
import TableToolbar from "../TableToolbar";
import TablePagination from "../TablePagination";
import TableRowActions, { TableExtraAction } from "../TableRowActions";
import { usePaginatedList } from "../../hooks/usePaginatedList";
import {
  STATUS_FILTER_OPTIONS,
  filterExpenseTable,
  filterTrackerTable,
} from "../../lib/dashboard/constants";
import { getPaidAmount, getRemainingAmount } from "../../lib/dashboard/payment";
import { Expense } from "../../lib/dashboard/types";

export type ExpenseQueueVariant = "approver" | "processor" | "tracker";

interface SelectOption {
  value: string;
  label: string;
}

interface ExpenseQueuePanelProps {
  variant: ExpenseQueueVariant;
  expenses: Expense[];
  categoryFilterOptions: SelectOption[];
  projectFilterOptions: SelectOption[];
  headerText: string | ((totalCount: number) => string);
  emptyInbox?: {
    emoji: string;
    title: string;
    subtitle: string;
  };
  toolbarExtra?: React.ReactNode | ((ctx: { filtered: Expense[] }) => React.ReactNode);
  getExtraActions?: (expense: Expense) => TableExtraAction[];
  getEditSlotAction?: (expense: Expense) => TableExtraAction | null;
  showEdit?: boolean;
  showDelete?: boolean;
  onView: (expense: Expense) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export default function ExpenseQueuePanel({
  variant,
  expenses,
  categoryFilterOptions,
  projectFilterOptions,
  headerText,
  emptyInbox,
  toolbarExtra,
  getExtraActions,
  getEditSlotAction,
  showEdit = true,
  showDelete = true,
  onView,
  onEdit,
  onDelete,
}: ExpenseQueuePanelProps) {
  const isTracker = variant === "tracker";
  const table = usePaginatedList(expenses, {
    filterFn: isTracker ? filterTrackerTable : filterExpenseTable,
    initialFilters: isTracker
      ? { status: "ALL", category: "ALL", project: "ALL" }
      : { category: "ALL", project: "ALL" },
  });

  const filters = [
    ...(isTracker
      ? [
          {
            id: "status",
            value: table.filters.status,
            onChange: (value: string) => table.setFilter("status", value),
            options: STATUS_FILTER_OPTIONS,
          },
        ]
      : []),
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
  ];

  const showEmptyInbox = !isTracker && expenses.length === 0 && emptyInbox;
  const filterEmptyHint = isTracker
    ? "Try resetting search string or selecting another status filter."
    : "Try resetting search or selecting another category.";
  const resolvedHeader =
    typeof headerText === "function" ? headerText(table.totalCount) : headerText;

  return (
    <div className="portal-card rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 min-w-0">
      <div
        className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5 sm:mb-6 ${
          isTracker ? "" : "pb-4 border-b border-slate-400"
        }`}
      >
        {isTracker ? (
          <h3 className="text-lg font-bold text-slate-900">{resolvedHeader}</h3>
        ) : (
          <span className="text-sm text-slate-700 font-medium">{resolvedHeader}</span>
        )}
      </div>

      {showEmptyInbox ? (
        <div className="text-center py-16 text-slate-700">
          <span className="text-3xl block mb-2">{emptyInbox.emoji}</span>
          <p className="text-sm font-semibold">{emptyInbox.title}</p>
          <p className="text-xs mt-1 text-slate-700">{emptyInbox.subtitle}</p>
        </div>
      ) : (
        <>
          <div className={isTracker ? "mb-6" : "mb-4"}>
            <TableToolbar
              search={table.search}
              onSearchChange={table.setSearch}
              searchPlaceholder="Search requester, ID, desc..."
              filters={filters}
            >
              {typeof toolbarExtra === "function"
                ? toolbarExtra({ filtered: table.filtered })
                : toolbarExtra}
            </TableToolbar>
          </div>

          {table.totalCount === 0 ? (
            <div className="text-center py-12 text-slate-700">
              <p className="text-sm font-semibold">No results match filters</p>
              <p className="text-xs mt-1">{filterEmptyHint}</p>
            </div>
          ) : (
            <>
              <div className="af-table-wrap">
                <table className="af-table min-w-full">
                  <thead>
                    <tr>
                      {variant === "approver" && (
                        <>
                          <th className="py-3 px-4">Request ID</th>
                          <th className="py-3 px-4">Requester</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Project</th>
                          <th className="py-3 px-4">Due Date</th>
                          <th className="py-3 px-4">Date Submitted</th>
                          <th className="py-3 px-4">Description</th>
                          <th className="py-3 px-4 text-right">Amount</th>
                          <th className="py-3 px-4">Actions</th>
                        </>
                      )}
                      {variant === "processor" && (
                        <>
                          <th className="py-3 px-4">Request ID</th>
                          <th className="py-3 px-4">Requester</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Project</th>
                          <th className="py-3 px-4">Due Date</th>
                          <th className="py-3 px-4">Approver&apos;s Notes</th>
                          <th className="py-3 px-4 text-right">Amount</th>
                          <th className="py-3 px-4 text-right">Total Paid</th>
                          <th className="py-3 px-4 text-right">Remaining</th>
                          <th className="py-3 px-4">Actions</th>
                        </>
                      )}
                      {variant === "tracker" && (
                        <>
                          <th className="py-2.5 px-3">ID</th>
                          <th className="py-2.5 px-3">Requester</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Project</th>
                          <th className="py-2.5 px-3">Due Date</th>
                          <th className="py-2.5 px-3">Submission Date</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Change Request</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                          <th className="py-2.5 px-3 text-right">Paid</th>
                          <th className="py-2.5 px-3 text-right">Remaining</th>
                          <th className="py-2.5 px-3">Action</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {table.paginated.map((e) => (
                      <ExpenseQueueRow
                        key={e.id}
                        expense={e}
                        variant={variant}
                        extraActions={getExtraActions?.(e) ?? []}
                        editSlotAction={getEditSlotAction?.(e) ?? null}
                        showEdit={showEdit}
                        showDelete={showDelete}
                        onView={() => onView(e)}
                        onEdit={() => onEdit(e)}
                        onDelete={() => onDelete(e)}
                      />
                    ))}
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

function ExpenseQueueRow({
  expense: e,
  variant,
  extraActions,
  editSlotAction,
  showEdit,
  showDelete,
  onView,
  onEdit,
  onDelete,
}: {
  expense: Expense;
  variant: ExpenseQueueVariant;
  extraActions: TableExtraAction[];
  editSlotAction: TableExtraAction | null;
  showEdit: boolean;
  showDelete: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cellPad = variant === "tracker" ? "py-3 px-3" : "py-3.5 px-4";
  const actions = (
    <TableRowActions
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
      showEdit={showEdit}
      showDelete={showDelete}
      editSlotAction={editSlotAction}
      extraActions={extraActions}
    />
  );

  if (variant === "approver") {
    return (
      <tr className="hover:bg-slate-50 transition-colors">
        <td className={`${cellPad} font-mono text-sm text-[var(--af-accent)] font-bold`}>{e.id}</td>
        <td className={cellPad}>
          <div className="font-semibold text-slate-900">{e.requesterName}</div>
          <div className="text-xs text-slate-700">{e.requesterEmail}</div>
        </td>
        <td className={cellPad}>
          <span className="font-medium">{e.category}</span>
        </td>
        <td className={`${cellPad} text-sm text-slate-700`}>{e.project || "—"}</td>
        <td className={cellPad}>
          <DueDateBadge dueDate={e.dueDate} status={e.status} amount={e.amount} paidAmount={e.paidAmount} />
        </td>
        <td className={`${cellPad} text-slate-600 text-xs`}>
          {new Date(e.submittedAt).toLocaleDateString()}
        </td>
        <td className={`${cellPad} max-w-xs truncate text-xs text-slate-700`} title={e.description}>
          {e.description}
        </td>
        <td className={`${cellPad} text-right font-bold text-slate-900`}>
          ${e.amount.toFixed(2)}
        </td>
        <td className={cellPad}>{actions}</td>
      </tr>
    );
  }

  if (variant === "processor") {
    return (
      <tr className="hover:bg-slate-50 transition-colors">
        <td className={`${cellPad} font-mono text-sm text-[var(--af-accent)] font-bold`}>{e.id}</td>
        <td className={cellPad}>
          <div className="font-semibold text-slate-900">{e.requesterName}</div>
          <div className="text-xs text-slate-700">{e.requesterEmail}</div>
        </td>
        <td className={cellPad}>
          <span className="font-medium">{e.category}</span>
        </td>
        <td className={`${cellPad} text-sm text-slate-700`}>{e.project || "—"}</td>
        <td className={cellPad}>
          <DueDateBadge dueDate={e.dueDate} status={e.status} amount={e.amount} paidAmount={e.paidAmount} />
        </td>
        <td
          className={`${cellPad} max-w-xs truncate text-xs text-[var(--af-accent)] italic`}
          title={e.approverNotes}
        >
          &quot;{e.approverNotes || "No notes written."}&quot;
        </td>
        <td className={`${cellPad} text-right font-bold text-slate-900`}>
          ${e.amount.toFixed(2)}
        </td>
        <td className={`${cellPad} text-right font-semibold text-emerald-700`}>
          ${getPaidAmount(e).toFixed(2)}
        </td>
        <td className={`${cellPad} text-right font-semibold text-amber-700`}>
          ${getRemainingAmount(e).toFixed(2)}
        </td>
        <td className={cellPad}>{actions}</td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className={`${cellPad} font-mono text-sm text-[var(--af-accent)] font-bold`}>{e.id}</td>
      <td className={cellPad}>
        <div className="font-semibold text-slate-900 text-xs">{e.requesterName}</div>
        <div className="text-xs text-slate-700">{e.requesterEmail}</div>
      </td>
      <td className={`${cellPad} text-xs`}>
        <span>{e.category}</span>
      </td>
      <td className={`${cellPad} text-xs text-slate-700`}>{e.project || "—"}</td>
      <td className={cellPad}>
        <DueDateBadge dueDate={e.dueDate} status={e.status} amount={e.amount} paidAmount={e.paidAmount} />
      </td>
      <td className={`${cellPad} text-xs text-slate-700`}>
        {new Date(e.submittedAt).toLocaleDateString()}
      </td>
      <td className={cellPad}>
        <StatusBadge status={e.status} className="text-xs py-0.5" />
      </td>
      <td
        className={`${cellPad} max-w-[180px] truncate text-xs text-amber-800 italic`}
        title={
          e.changeRequestNotes
            ? `${e.changeRequestNotes}${e.changeRequestedBy ? ` — ${e.changeRequestedBy}` : ""}`
            : undefined
        }
      >
        {e.changeRequestNotes ? `"${e.changeRequestNotes}"` : "—"}
      </td>
      <td className={`${cellPad} text-right font-semibold text-slate-900`}>
        ${e.amount.toFixed(2)}
      </td>
      <td className={`${cellPad} text-right font-semibold text-emerald-700`}>
        ${getPaidAmount(e).toFixed(2)}
      </td>
      <td className={`${cellPad} text-right font-semibold text-amber-700`}>
        ${getRemainingAmount(e).toFixed(2)}
      </td>
      <td className={cellPad}>{actions}</td>
    </tr>
  );
}
