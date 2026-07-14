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
    <div className="af-toolbar flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
      <div className="af-toolbar-search-wrap min-w-0 w-full sm:flex-1">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="af-input af-input-sm af-toolbar-search"
        />
      </div>

      {filters.map((filter) => (
        <select
          key={filter.id}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          className="af-select af-select-sm af-toolbar-filter cursor-pointer"
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
