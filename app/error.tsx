"use client";

import React, { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-zinc-950">
      <div className="h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-3xl mb-6 shadow-lg shadow-rose-500/5">
        📡
      </div>
      <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
        System Connection Issue
      </h1>
      <p className="mt-3 max-w-md text-zinc-400 text-sm">
        The application is unable to connect to the backend server. Please verify that the NestJS server is running on port 3001.
      </p>
      <div className="mt-8 flex gap-3">
        <button
          onClick={() => window.location.reload()}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 px-6 text-xs font-bold text-zinc-200 hover:bg-zinc-850 hover:text-white transition-colors cursor-pointer"
        >
          Reload Page
        </button>
        <button
          onClick={() => reset()}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--af-navy)] px-6 text-xs font-bold text-white shadow hover:bg-[var(--af-navy-soft)] transition-colors cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    </div>
  );
}
