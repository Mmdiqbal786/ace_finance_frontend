"use client";

import React from "react";

interface TablePaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

export default function TablePagination({
  page,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  if (totalCount === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500">
        Showing <span className="font-semibold text-slate-700">{start}</span>–
        <span className="font-semibold text-slate-700">{end}</span> of{" "}
        <span className="font-semibold text-slate-700">{totalCount}</span>
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <label className="flex items-center gap-2 text-xs text-slate-500">
          Rows per page
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg bg-white border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:border-sky-600 focus:outline-none transition-colors cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <span className="min-w-[4.5rem] text-center text-xs text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
