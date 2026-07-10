import React from "react";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-900 bg-zinc-950 py-6">
      <div suppressHydrationWarning className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center sm:flex sm:items-center sm:justify-between">
        <p className="text-xs text-zinc-500">
          &copy; {new Date().getFullYear()} AceFinance Corp. All rights reserved.
        </p>
        <div suppressHydrationWarning className="mt-2 sm:mt-0 flex justify-center gap-4 text-xs text-zinc-400">
          <span>Security Audited</span>
          <span>•</span>
          <span>ISO 27001 Certified</span>
        </div>
      </div>
    </footer>
  );
}
