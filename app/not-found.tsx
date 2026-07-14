"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { isAuthenticated } from "../lib/auth";
import { DASHBOARD_ROUTES } from "../lib/dashboard/routes";

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLoggedIn(isAuthenticated());
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-slate-50">
      <div className="h-16 w-16 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-3xl mb-6 shadow-sm">
        🔍
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
        Page Not Found
      </h1>
      <p className="mt-3 max-w-md text-slate-500 text-sm">
        We couldn&apos;t find the page you are looking for. It might have been moved or deleted.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        {mounted && !loggedIn && (
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-white border border-slate-200 px-6 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            Go to Request Form
          </Link>
        )}
        {mounted && loggedIn && (
          <Link
            href={DASHBOARD_ROUTES.home}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--af-navy)] px-6 text-xs font-bold text-white shadow hover:bg-[var(--af-navy-soft)] transition-colors"
          >
            Go to Dashboard
          </Link>
        )}
      </div>
    </div>
  );
}
