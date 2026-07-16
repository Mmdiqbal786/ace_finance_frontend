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
  "submit-expense": {
    title: "Submit",
    titleAccent: "Expense",
    subtitle: "Create a new reimbursement request",
    breadcrumb: "Submit Expense",
  },
  "my-requests": {
    title: "My",
    titleAccent: "Requests",
    subtitle: "Track the status of your expense submissions",
    breadcrumb: "My Requests",
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
  countries: {
    title: "Country",
    titleAccent: "Management",
    subtitle: "Manage countries and their currency codes",
    breadcrumb: "Countries",
  },
  analytics: {
    title: "Analytics",
    titleAccent: "& Tracker",
    subtitle: "Reports, category breakdown, and full expense database",
    breadcrumb: "Analytics & Tracker",
  },
};
