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
    <div className="mt-4 flex flex-col gap-3 border-t border-slate-400 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-slate-700">
        Showing <span className="font-bold text-slate-900">{start}</span>–
        <span className="font-bold text-slate-900">{end}</span> of{" "}
        <span className="font-bold text-slate-900">{totalCount}</span>
      </p>

      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <label className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-slate-700">
          <span className="whitespace-nowrap">Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="af-select af-select-sm af-w-auto !w-auto min-w-[4.5rem] shrink-0 cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-500 bg-white px-3.5 text-sm font-bold text-slate-800 hover:bg-slate-100 hover:text-[var(--af-navy)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <span className="min-w-[5rem] whitespace-nowrap text-center text-sm font-semibold text-slate-700">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-500 bg-white px-3.5 text-sm font-bold text-slate-800 hover:bg-slate-100 hover:text-[var(--af-navy)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
