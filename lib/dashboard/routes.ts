import { AuthUser } from "../auth";
import { DashboardSection } from "./types";

export const DASHBOARD_ROUTES = {
  home: "/dashboard/",
  approver: "/dashboard/approver/",
  processor: "/dashboard/processor/",
  userManagement: "/dashboard/user-management/",
  categories: "/dashboard/categories/",
  projects: "/dashboard/projects/",
  countries: "/dashboard/countries/",
  analytics: "/dashboard/analytics/",
} as const;

export const DASHBOARD_SECTION_PATHS: Record<Exclude<DashboardSection, "home">, string> = {
  approver: DASHBOARD_ROUTES.approver,
  processor: DASHBOARD_ROUTES.processor,
  "user-management": DASHBOARD_ROUTES.userManagement,
  categories: DASHBOARD_ROUTES.categories,
  projects: DASHBOARD_ROUTES.projects,
  countries: DASHBOARD_ROUTES.countries,
  analytics: DASHBOARD_ROUTES.analytics,
};

export function getDefaultDashboardRoute(_role: AuthUser["role"]): string {
  return DASHBOARD_ROUTES.home;
}

export function pathnameToSection(pathname: string | null): DashboardSection {
  if (!pathname) return "home";
  const normalized = pathname.replace(/\/+$/, "") || "/";

  if (normalized === "/dashboard") return "home";
  if (normalized === "/dashboard/approver") return "approver";
  if (normalized === "/dashboard/processor") return "processor";
  if (normalized === "/dashboard/user-management") return "user-management";
  if (normalized === "/dashboard/categories") return "categories";
  if (normalized === "/dashboard/projects") return "projects";
  if (normalized === "/dashboard/countries") return "countries";
  if (normalized === "/dashboard/analytics") return "analytics";
  return "home";
}

export function canAccessSection(role: AuthUser["role"] | undefined, section: DashboardSection): boolean {
  if (!role) return false;
  if (section === "home" || section === "analytics") return true;
  if (
    section === "user-management" ||
    section === "categories" ||
    section === "projects" ||
    section === "countries"
  ) {
    return role === "ADMIN";
  }
  if (section === "approver") return role === "APPROVER" || role === "ADMIN";
  if (section === "processor") return role === "PROCESSOR" || role === "ADMIN";
  return false;
}
