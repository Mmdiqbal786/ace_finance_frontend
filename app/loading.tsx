import React from "react";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-slate-50">
      <span className="inline-flex h-14 w-14 items-center justify-center mb-4">
        <img src="/Ace_logo_small_light.png" alt="Aceolution" width={44} height={44} className="object-contain" />
      </span>
      <svg className="animate-spin h-8 w-8 text-sky-600 mb-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <span className="text-slate-500 text-sm font-medium">Loading Aceolution Finance...</span>
    </div>
  );
}
