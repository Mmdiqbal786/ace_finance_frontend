"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");
  const path = pathname?.replace(/\/$/, "") || "";
  const isHome = path === "" || path === "/";

  if (isDashboard) return null;

  if (isHome) {
    return (
      <footer className="shrink-0 w-full border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-5 px-4 py-7 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-7">
            <Link href="/demo-guide" className="inline-flex items-center gap-2 font-medium hover:text-[#0a1628]">
              <span className="text-slate-400" aria-hidden>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </span>
              Demo guide
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 font-medium hover:text-[#0a1628]">
              Sign in
            </Link>
          </div>

        </div>
        <p className="border-t border-slate-100 py-3 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Aceolution Finance. All rights reserved.
        </p>
      </footer>
    );
  }

  return (
    <footer className="shrink-0 w-full border-t border-slate-200 bg-white py-6">
      <div suppressHydrationWarning className="flex w-full px-4 text-center sm:px-6 lg:px-8">
        <p className="w-full text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Aceolution Finance. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
