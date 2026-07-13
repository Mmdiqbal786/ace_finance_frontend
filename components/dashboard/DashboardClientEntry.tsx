"use client";

import dynamic from "next/dynamic";

function DashboardBootScreen() {
  return (
    <div className="portal-page relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden">
      <div className="portal-bg" aria-hidden="true">
        <div className="portal-orb portal-orb--violet" />
        <div className="portal-orb portal-orb--indigo" />
        <div className="portal-orb portal-orb--cyan" />
        <div className="portal-grid" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-4 text-center">
        <svg className="h-10 w-10 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="text-sm font-medium text-zinc-400">Loading dashboard...</p>
      </div>
    </div>
  );
}

const DashboardWorkspace = dynamic(() => import("./DashboardWorkspace"), {
  ssr: false,
  loading: () => <DashboardBootScreen />,
});

export default DashboardWorkspace;
