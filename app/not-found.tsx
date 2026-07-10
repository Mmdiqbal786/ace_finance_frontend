import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-zinc-950">
      <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-3xl mb-6 shadow-lg shadow-indigo-500/5">
        🔍
      </div>
      <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
        Page Not Found
      </h1>
      <p className="mt-3 max-w-md text-zinc-400 text-sm">
        We couldn't find the page you are looking for. It might have been moved or deleted.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 px-6 text-xs font-bold text-zinc-200 hover:bg-zinc-850 hover:text-white transition-colors"
        >
          Go to Request Form
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-6 text-xs font-bold text-white shadow hover:bg-indigo-500 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
