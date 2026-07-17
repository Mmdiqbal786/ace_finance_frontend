"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  if (isDashboard) return null;

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
