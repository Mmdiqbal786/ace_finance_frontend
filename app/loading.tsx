import React from "react";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-zinc-950">
      <svg className="animate-spin h-10 w-10 text-indigo-500 mb-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <span className="text-zinc-400 text-sm font-medium">Loading AceFinance...</span>
    </div>
  );
}
