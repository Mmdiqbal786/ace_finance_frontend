"use client";

import dynamic from "next/dynamic";

function DashboardBootScreen() {
  return (
    <div className="portal-page relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden">
      <div className="relative z-10 flex flex-col items-center gap-4 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center">
          <img src="/Ace_logo_small_light.png" alt="Aceolution" width={44} height={44} className="object-contain" />
        </span>
        <svg className="h-8 w-8 animate-spin text-[var(--af-accent)]" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="text-sm font-medium text-slate-500">Loading dashboard...</p>
      </div>
    </div>
  );
}

const DashboardWorkspace = dynamic(() => import("./DashboardWorkspace"), {
  ssr: false,
  loading: () => <DashboardBootScreen />,
});

export default DashboardWorkspace;
