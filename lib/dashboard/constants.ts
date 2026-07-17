import { Expense } from "./types";

export const CATEGORY_COLORS: { [key: string]: string } = {
  Travel: "from-amber-500 to-orange-500",
  Meals: "from-pink-500 to-rose-500",
  Office: "from-teal-500 to-emerald-500",
  Software: "from-violet-500 to-indigo-500",
  Other: "from-blue-500 to-cyan-500",
};

export const CATEGORY_FILTER_OPTIONS = [
  { value: "ALL", label: "All Categories" },
  { value: "Travel", label: "Travel" },
  { value: "Meals", label: "Meals" },
  { value: "Office", label: "Office" },
  { value: "Software", label: "Software" },
  { value: "Other", label: "Other" },
];

export const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "PENDING_APPROVER", label: "Pending Approver" },
  { value: "CHANGES_REQUESTED", label: "Changes Requested" },
  { value: "APPROVED_APPROVER", label: "Pending processing" },
  { value: "PARTIALLY_PAID", label: "Partially paid" },
  { value: "PROCESSED", label: "Processed & Paid" },
  { value: "REJECTED_APPROVER", label: "Rejected by Approver" },
  { value: "REJECTED_PROCESSOR", label: "Rejected by Processor" },
];

export const ROLE_FILTER_OPTIONS = [
  { value: "ALL", label: "All Roles" },
  { value: "ADMIN", label: "Admin" },
  { value: "APPROVER", label: "Approver" },
  { value: "PROCESSOR", label: "Processor" },
  { value: "REQUESTER", label: "Requester" },
];

export const USER_STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

export function matchesExpenseSearch(e: Expense, search: string): boolean {
  if (!search.trim()) return true;
  const q = search.toLowerCase();
  return (
    e.id.toLowerCase().includes(q) ||
    e.requesterName.toLowerCase().includes(q) ||
    e.requesterEmail.toLowerCase().includes(q) ||
    e.description.toLowerCase().includes(q) ||
    (e.project || "").toLowerCase().includes(q) ||
    e.category.toLowerCase().includes(q) ||
    (e.changeRequestNotes || "").toLowerCase().includes(q) ||
    (e.approverNotes || "").toLowerCase().includes(q) ||
    (e.processorNotes || "").toLowerCase().includes(q) ||
    (e.history || []).some(
      (h) =>
        (h.notes || "").toLowerCase().includes(q) ||
        (h.action || "").toLowerCase().includes(q) ||
        (h.user || "").toLowerCase().includes(q)
    )
  );
}

export function filterExpenseTable(e: Expense, search: string, filters: Record<string, string>) {
  const matchesCategory = filters.category === "ALL" || e.category === filters.category;
  const matchesProject =
    !filters.project || filters.project === "ALL" || e.project === filters.project;
  return matchesExpenseSearch(e, search) && matchesCategory && matchesProject;
}

export function filterTrackerTable(e: Expense, search: string, filters: Record<string, string>) {
  const matchesStatus = filters.status === "ALL" || e.status === filters.status;
  const matchesCategory = filters.category === "ALL" || e.category === filters.category;
  const matchesProject =
    !filters.project || filters.project === "ALL" || e.project === filters.project;
  return matchesExpenseSearch(e, search) && matchesStatus && matchesCategory && matchesProject;
}

export function filterCatalogTable(
  item: {
    name: string;
    label?: string;
    code?: string;
    currency?: string;
    isActive: boolean;
  },
  search: string,
  filters: Record<string, string>
) {
  const q = search.toLowerCase();
  const matchesSearch =
    !search.trim() ||
    item.name.toLowerCase().includes(q) ||
    (item.label || "").toLowerCase().includes(q) ||
    (item.code || "").toLowerCase().includes(q) ||
    (item.currency || "").toLowerCase().includes(q);
  const matchesStatus =
    filters.status === "ALL" ||
    (filters.status === "ACTIVE" && item.isActive) ||
    (filters.status === "INACTIVE" && !item.isActive);
  return matchesSearch && matchesStatus;
}

export function buildCategoryFilterOptions(
  categories: { name: string; label?: string }[]
): { value: string; label: string }[] {
  if (!categories.length) return CATEGORY_FILTER_OPTIONS;
  return [
    { value: "ALL", label: "All Categories" },
    ...categories.map((c) => ({ value: c.name, label: c.label || c.name })),
  ];
}

export function buildProjectFilterOptions(
  projects: { name: string }[]
): { value: string; label: string }[] {
  return [
    { value: "ALL", label: "All Projects" },
    ...projects.map((p) => ({ value: p.name, label: p.name })),
  ];
}

export function filterUserTable(
  u: { _id: string; name: string; email: string; role: string; isActive: boolean },
  search: string,
  filters: Record<string, string>
) {
  const q = search.toLowerCase();
  const matchesSearch =
    !search.trim() ||
    u.name.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q);
  const matchesRole = filters.role === "ALL" || u.role === filters.role;
  const matchesStatus =
    filters.status === "ALL" ||
    (filters.status === "ACTIVE" && u.isActive) ||
    (filters.status === "INACTIVE" && !u.isActive);
  return matchesSearch && matchesRole && matchesStatus;
}
