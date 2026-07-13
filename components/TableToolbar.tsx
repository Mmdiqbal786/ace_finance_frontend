"use client";

import React from "react";

export interface TableSelectFilter {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

interface TableToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: TableSelectFilter[];
  children?: React.ReactNode;
}

export default function TableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  children,
}: TableToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center sm:flex-wrap">
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        className="min-w-0 flex-1 sm:min-w-[200px] rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-indigo-500 focus:outline-none transition-colors"
      />

      {filters.map((filter) => (
        <select
          key={filter.id}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none transition-colors cursor-pointer"
        >
          {filter.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}

      {children}
    </div>
  );
}
