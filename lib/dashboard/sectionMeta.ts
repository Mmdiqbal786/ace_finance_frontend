import { DashboardSection } from "./types";

export interface SectionMeta {
  title: string;
  titleAccent?: string;
  subtitle: string;
  breadcrumb: string;
}

export const SECTION_META: Record<DashboardSection, SectionMeta> = {
  home: {
    title: "Dashboard",
    subtitle: "Monthly performance and workspace overview",
    breadcrumb: "Dashboard",
  },
  approver: {
    title: "Approver",
    titleAccent: "Panel",
    subtitle: "Review and approve pending expense requests",
    breadcrumb: "Approver Panel",
  },
  processor: {
    title: "Processor",
    titleAccent: "Panel",
    subtitle: "Release payments for manager-approved expenses",
    breadcrumb: "Processor Panel",
  },
  "user-management": {
    title: "User",
    titleAccent: "Management",
    subtitle: "Create and manage staff accounts and roles",
    breadcrumb: "User Management",
  },
  categories: {
    title: "Category",
    titleAccent: "Management",
    subtitle: "Manage expense categories shown on the public form",
    breadcrumb: "Categories",
  },
  projects: {
    title: "Project",
    titleAccent: "Management",
    subtitle: "Manage projects assignees pick when submitting expenses",
    breadcrumb: "Projects",
  },
  analytics: {
    title: "Analytics",
    titleAccent: "& Tracker",
    subtitle: "Reports, category breakdown, and full expense database",
    breadcrumb: "Analytics & Tracker",
  },
};
