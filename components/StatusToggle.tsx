"use client";

import React from "react";

interface StatusToggleProps {
  isActive: boolean;
  onToggle: () => void;
}

export default function StatusToggle({ isActive, onToggle }: StatusToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-semibold transition-colors cursor-pointer ${
        isActive
          ? "bg-emerald-50 text-emerald-700 hover:bg-rose-50 hover:text-rose-700"
          : "bg-rose-50 text-rose-700 hover:bg-emerald-50 hover:text-emerald-700"
      }`}
    >
      {isActive ? "● Active" : "○ Inactive"}
    </button>
  );
}
