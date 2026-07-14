"use client";

import React from "react";
import Link from "next/link";
import { DASHBOARD_ROUTES } from "../../lib/dashboard/routes";
import { DashboardSection } from "../../lib/dashboard/types";
import { SECTION_META } from "../../lib/dashboard/sectionMeta";

interface DashboardBreadcrumbProps {
  section: DashboardSection;
}

export default function DashboardBreadcrumb({ section }: DashboardBreadcrumbProps) {
  const currentLabel = SECTION_META[section].breadcrumb;
  const isHome = section === "home";

  return (
    <nav aria-label="Breadcrumb" className="mb-3 sm:mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-slate-600">
        <li>
          {isHome ? (
            <span className="text-slate-900 font-semibold">Dashboard</span>
          ) : (
            <Link href={DASHBOARD_ROUTES.home} className="font-medium text-slate-700 hover:text-[var(--af-navy)] transition-colors">
              Dashboard
            </Link>
          )}
        </li>
        {!isHome && (
          <>
            <li aria-hidden="true" className="text-slate-500">
              /
            </li>
            <li>
              <span className="text-slate-900 font-semibold">{currentLabel}</span>
            </li>
          </>
        )}
      </ol>
    </nav>
  );
}
