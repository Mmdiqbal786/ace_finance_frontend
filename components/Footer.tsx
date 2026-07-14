"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  if (isDashboard) return null;

  return (
    <footer className="shrink-0 w-full border-t border-slate-200 bg-white py-6">
      <div suppressHydrationWarning className="flex w-full flex-col px-4 text-center sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Aceolution Finance. All rights reserved.
        </p>
        <div suppressHydrationWarning className="mt-2 sm:mt-0 flex justify-center gap-4 text-xs text-slate-500">
          <span>Security Audited</span>
          <span>•</span>
          <span>ISO 27001 Certified</span>
        </div>
      </div>
    </footer>
  );
}
