"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  getUser,
  isAuthenticated,
  authHeaders,
  AuthUser,
  mustChangePassword,
  mustSetupTotp,
  updateStoredUser,
} from "../../lib/auth";
import { API_URL } from "../../lib/api";
import DashboardSidebar from "../DashboardSidebar";
import {
  buildCategoryFilterOptions,
  buildProjectFilterOptions,
  filterExpensesByDateRange,
} from "../../lib/dashboard/constants";
import {
  Expense,
  DashboardStats,
  ExpenseActionType,
  CategoryItem,
  ProjectItem,
  CountryItem,
} from "../../lib/dashboard/types";
import { isFullyPaid } from "../../lib/dashboard/payment";
import { buildStatsFromExpenses } from "../../lib/dashboard/buildStats";
import {
  canAccessSection,
  pathnameToSection,
  resolveAccessibleDashboardPath,
} from "../../lib/dashboard/routes";
import DashboardHomeOverview from "./DashboardHomeOverview";
import DashboardSectionStats from "./DashboardSectionStats";
import CategoriesPanel from "./CategoriesPanel";
import ProjectsPanel from "./ProjectsPanel";
import CountriesPanel from "./CountriesPanel";
import UsersPanel from "./UsersPanel";
import ExpenseActionModal from "./ExpenseActionModal";
import ExpenseQueuePanel from "./ExpenseQueuePanel";
import AnalyticsPanel from "./AnalyticsPanel";
import SubmitExpensePanel from "./SubmitExpensePanel";
import MyRequestsPanel from "./MyRequestsPanel";
import ProfilePanel from "./ProfilePanel";
import DashboardBreadcrumb from "./DashboardBreadcrumb";
import { SECTION_META } from "../../lib/dashboard/sectionMeta";
import AppIcon from "../icons/AppIcon";

const OPEN_FROM_QUERY_ACTIONS = new Set<ExpenseActionType>([
  "view",
  "edit",
  "approve",
  "reject",
  "process",
  "partial-pay",
  "processor-reject",
  "request-changes",
  "delete",
]);

export default function DashboardWorkspace() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSection = pathnameToSection(pathname);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [topProjectFilter, setTopProjectFilter] = useState("ALL");
  const [topDateFrom, setTopDateFrom] = useState("");
  const [topDateTo, setTopDateTo] = useState("");

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [actionType, setActionType] = useState<ExpenseActionType>("view");
  const openedFromQueryRef = useRef<string | null>(null);

  const [activeCategories, setActiveCategories] = useState<CategoryItem[]>([]);
  const [activeProjects, setActiveProjects] = useState<ProjectItem[]>([]);
  const [activeCountries, setActiveCountries] = useState<CountryItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = "/login";
      return;
    }
    if (mustChangePassword()) {
      window.location.href = "/set-password/";
      return;
    }
    if (mustSetupTotp()) {
      window.location.href = "/setup-authenticator/";
      return;
    }
    const cached = getUser();
    setCurrentUser(cached);

    // Refresh profile so assignedProjects stay current after Admin edits.
    (async () => {
      try {
        const res = await fetch(`${API_URL}/users/me`, { headers: authHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        const next: AuthUser = {
          ...(cached || {
            id: data.id || data._id,
            name: data.name,
            email: data.email,
            role: data.role,
          }),
          id: data.id || data._id || cached?.id || "",
          name: data.name,
          email: data.email,
          role: data.role,
          assignedProjects: Array.isArray(data.assignedProjects)
            ? data.assignedProjects
            : [],
          mustChangePassword: data.mustChangePassword ?? cached?.mustChangePassword,
          mustSetupTotp: data.mustSetupTotp ?? cached?.mustSetupTotp,
          totpEnabled: data.totpEnabled ?? cached?.totpEnabled,
        };
        updateStoredUser(next);
        setCurrentUser(next);
      } catch {
        // Keep cached user if profile refresh fails.
      }
    })();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    if (!canAccessSection(currentUser.role, activeSection)) {
      window.location.href = resolveAccessibleDashboardPath(
        currentUser.role,
        pathname
      );
    }
  }, [currentUser, activeSection, pathname]);

  const fetchData = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError("");
    try {
      const headers = authHeaders();
      const isRequester = currentUser.role === "REQUESTER";
      const expensesUrl = isRequester ? `${API_URL}/expenses/mine` : `${API_URL}/expenses`;
      const expensesResponse = await fetch(expensesUrl, { headers });

      if (!expensesResponse.ok) {
        throw new Error("Failed to load dashboard data from backend.");
      }

      let expensesData = (await expensesResponse.json()) as Expense[];

      // Approver: only assigned projects (client-side so Analytics cards always match the table)
      if (currentUser.role === "APPROVER") {
        const allowed = new Set(currentUser.assignedProjects || []);
        expensesData = expensesData.filter((e) => allowed.has(e.project));
      }

      expensesData = expensesData.sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
      setExpenses(expensesData);

      if (!isRequester) {
        // Stats from the same scoped list — Approver ≠ Processor company-wide totals
        setStats(buildStatsFromExpenses(expensesData));
      } else {
        setStats(null);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveCatalogs = async () => {
    setCatalogLoading(true);
    try {
      const [catRes, projRes, countryRes] = await Promise.all([
        fetch(`${API_URL}/categories/active`),
        fetch(`${API_URL}/projects/active`),
        fetch(`${API_URL}/countries/active`),
      ]);
      if (catRes.ok) setActiveCategories(await catRes.json());
      if (projRes.ok) setActiveProjects(await projRes.json());
      if (countryRes.ok) setActiveCountries(await countryRes.json());
    } catch {
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
      fetchActiveCatalogs();
    }
  }, [currentUser]);

  const openActionModal = (expense: Expense, type: ExpenseActionType) => {
    setSelectedExpense(expense);
    setActionType(type);
  };

  // Deep-link from notification: /dashboard/approver/?expense=EXP-...&action=view
  useEffect(() => {
    const expenseId = searchParams.get("expense");
    if (!expenseId) {
      openedFromQueryRef.current = null;
      return;
    }
    if (loading) return;
    if (openedFromQueryRef.current === expenseId) return;

    let cancelled = false;
    const requestedAction = (searchParams.get("action") || "view") as ExpenseActionType;
    const action = OPEN_FROM_QUERY_ACTIONS.has(requestedAction) ? requestedAction : "view";

    (async () => {
      let expense = expenses.find((e) => e.id === expenseId) || null;
      if (!expense) {
        try {
          const res = await fetch(`${API_URL}/expenses/${encodeURIComponent(expenseId)}`);
          if (res.ok) {
            const data = await res.json();
            expense = data as Expense;
          }
        } catch {
          // Ignore; leave modal closed if expense cannot be loaded.
        }
      }
      if (cancelled || !expense) return;
      openedFromQueryRef.current = expenseId;
      openActionModal(expense, action);
      router.replace(pathname, { scroll: false });
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, loading, expenses, pathname, router]);

  const assignedProjectSet =
    currentUser?.role === "APPROVER" || currentUser?.role === "REQUESTER"
      ? new Set(currentUser.assignedProjects || [])
      : null;

  const projectsForSubmit =
    currentUser?.role === "REQUESTER"
      ? activeProjects.filter((p) => (currentUser.assignedProjects || []).includes(p.name))
      : activeProjects;

  const projectsForApproverFilters =
    currentUser?.role === "APPROVER"
      ? activeProjects.filter((p) => (currentUser.assignedProjects || []).includes(p.name))
      : activeProjects;

  const projectsForTopFilters = useMemo(() => {
    if (!currentUser) return activeProjects;
    if (currentUser.role === "APPROVER" || currentUser.role === "REQUESTER") {
      const assigned = new Set(currentUser.assignedProjects || []);
      return activeProjects.filter((p) => assigned.has(p.name));
    }
    return activeProjects;
  }, [activeProjects, currentUser]);

  const categoryFilterOptions = buildCategoryFilterOptions(activeCategories);
  const projectFilterOptions = buildProjectFilterOptions(activeProjects);
  const approverProjectFilterOptions = buildProjectFilterOptions(projectsForApproverFilters);
  const topProjectFilterOptions = buildProjectFilterOptions(projectsForTopFilters);
  const topFilterEnabled = ["home", "analytics", "approver", "processor"].includes(activeSection);
  const topFilteredExpenses = useMemo(() => {
    if (!topFilterEnabled) return expenses;
    let filtered = expenses;
    if (topProjectFilter !== "ALL") {
      filtered = filtered.filter((e) => e.project === topProjectFilter);
    }
    filtered = filterExpensesByDateRange(filtered, topDateFrom, topDateTo);
    return filtered;
  }, [expenses, topProjectFilter, topDateFrom, topDateTo, topFilterEnabled]);
  const topFilteredStats =
    currentUser?.role === "REQUESTER" ? null : buildStatsFromExpenses(topFilteredExpenses);
  const sectionStats = topFilterEnabled ? topFilteredStats : stats;

  const queueBaseExpenses = topFilterEnabled ? topFilteredExpenses : expenses;
  const pendingApproverList = queueBaseExpenses.filter((e) => {
    if (e.status !== "PENDING_APPROVER") return false;
    if (currentUser?.role === "APPROVER" && assignedProjectSet) {
      return assignedProjectSet.has(e.project);
    }
    return true;
  });
  const approvedApproverList = queueBaseExpenses.filter(
    (e) => e.status === "APPROVED_APPROVER" || e.status === "PARTIALLY_PAID"
  );
  const sectionMeta = SECTION_META[activeSection];

  const expenseActions = {
    onView: (e: Expense) => openActionModal(e, "view"),
    onEdit: (e: Expense) => openActionModal(e, "edit"),
    onDelete: (e: Expense) => openActionModal(e, "delete"),
  };

  return (
    <div className="flex min-h-0 w-full flex-1">
      <DashboardSidebar
        user={currentUser}
        pendingApproverCount={pendingApproverList.length}
        pendingProcessorCount={approvedApproverList.length}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <div className="portal-page relative min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="relative z-10 mx-auto w-full max-w-screen-2xl px-3 py-5 sm:px-6 sm:py-8 lg:px-10 2xl:px-12">
          <DashboardBreadcrumb section={activeSection} />

          <div className="mb-6 sm:mb-8">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  {sectionMeta.title}
                  {sectionMeta.titleAccent && (
                    <>
                      {" "}
                      <span className="af-title-accent">{sectionMeta.titleAccent}</span>
                    </>
                  )}
                </h1>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{sectionMeta.subtitle}</p>
              </div>

              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-400 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <AppIcon name="menu" size="sm" />
                <span>Menu</span>
              </button>
            </div>

            {topFilterEnabled && (
              <div className="portal-card mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-3 py-3 sm:px-4 sm:py-3.5">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">From</span>
                    <input
                      type="date"
                      value={topDateFrom}
                      onChange={(e) => setTopDateFrom(e.target.value)}
                      className="af-input af-input-sm cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">To</span>
                    <input
                      type="date"
                      value={topDateTo}
                      min={topDateFrom || undefined}
                      onChange={(e) => setTopDateTo(e.target.value)}
                      className="af-input af-input-sm cursor-pointer"
                    />
                  </div>
                  {(topDateFrom || topDateTo) && (
                    <button
                      type="button"
                      onClick={() => {
                        setTopDateFrom("");
                        setTopDateTo("");
                      }}
                      className="text-xs font-semibold text-slate-600 hover:text-[var(--af-navy)] cursor-pointer"
                    >
                      Clear dates
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:ml-auto">
                  <span className="text-xs font-semibold text-slate-600">Project</span>
                  <select
                    value={topProjectFilter}
                    onChange={(e) => setTopProjectFilter(e.target.value)}
                    className="af-select af-select-sm cursor-pointer min-w-[10rem]"
                  >
                    {topProjectFilterOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700 inline-flex items-start gap-2">
              <AppIcon name="warning" size="sm" className="mt-0.5" />
              <span>
                {error}{" "}
                <button onClick={fetchData} className="underline font-bold ml-1">
                  Try Reconnecting
                </button>
              </span>
            </div>
          )}

          {activeSection !== "home" &&
            ![
              "categories",
              "projects",
              "countries",
              "user-management",
              "submit-expense",
              "my-requests",
            ].includes(activeSection) &&
            sectionStats && (
              <DashboardSectionStats
                section={activeSection}
                stats={sectionStats}
                expenses={topFilteredExpenses}
                pendingApproverCount={pendingApproverList.length}
                pendingProcessorCount={approvedApproverList.length}
              />
            )}

          {activeSection === "profile" && currentUser ? (
            <ProfilePanel
              currentUser={currentUser}
              onProfileUpdated={setCurrentUser}
            />
          ) : loading ? (
            <div className="portal-card flex flex-col items-center justify-center rounded-2xl py-20">
              <svg
                className="animate-spin h-8 w-8 text-[var(--af-accent)] mb-3"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-slate-700 text-sm">Loading expense database...</span>
            </div>
          ) : (
            <>
              {activeSection === "home" && (
                <DashboardHomeOverview
                  expenses={topFilteredExpenses}
                  stats={topFilteredStats}
                  dateFrom={topDateFrom}
                  dateTo={topDateTo}
                />
              )}

              {activeSection === "submit-expense" && currentUser && (
                <SubmitExpensePanel
                  currentUser={currentUser}
                  categories={activeCategories}
                  projects={projectsForSubmit}
                  countries={activeCountries}
                  catalogLoading={catalogLoading}
                  expenses={expenses}
                  onViewExpense={(e) => openActionModal(e, "view")}
                  onEditExpense={(e) => openActionModal(e, "edit")}
                  onSubmitted={fetchData}
                />
              )}

              {activeSection === "my-requests" && (
                <MyRequestsPanel
                  expenses={expenses}
                  categoryFilterOptions={categoryFilterOptions}
                  projectFilterOptions={projectFilterOptions}
                  {...expenseActions}
                />
              )}

              {activeSection === "approver" && (
                <ExpenseQueuePanel
                  variant="approver"
                  expenses={pendingApproverList}
                  categoryFilterOptions={categoryFilterOptions}
                  projectFilterOptions={approverProjectFilterOptions}
                  headerText={(count) =>
                    `Showing ${count} expenses awaiting your sign-off`
                  }
                  emptyInbox={{
                    icon: "party",
                    title: "Inbox is clear!",
                    subtitle:
                      currentUser?.role === "APPROVER" &&
                      !(currentUser.assignedProjects || []).length
                        ? "No projects assigned yet — ask an Admin to assign projects in User Management."
                        : "No expense requests are currently pending review for your projects.",
                  }}
                  getExtraActions={(e) => [
                    {
                      label: "Approve",
                      icon: "check",
                      tone: "success",
                      onClick: () => openActionModal(e, "approve"),
                    },
                    {
                      label: "Reject",
                      icon: "cross",
                      tone: "danger",
                      onClick: () => openActionModal(e, "reject"),
                    },
                  ]}
                  getEditSlotAction={(e) => ({
                    label: "Request Changes",
                    icon: "undo",
                    onClick: () => openActionModal(e, "request-changes"),
                  })}
                  showEdit={false}
                  showDelete={true}
                  {...expenseActions}
                />
              )}

              {activeSection === "processor" && (
                <ExpenseQueuePanel
                  variant="processor"
                  expenses={approvedApproverList}
                  categoryFilterOptions={categoryFilterOptions}
                  projectFilterOptions={projectFilterOptions}
                  headerText={(count) =>
                    `Showing ${count} approved expenses awaiting payment release`
                  }
                  emptyInbox={{
                    icon: "balloon",
                    title: "All payouts cleared!",
                    subtitle: "No approved requests are currently waiting to be processed.",
                  }}
                  getExtraActions={(e) => [
                    {
                      label: "Mark Paid",
                      icon: "money",
                      tone: "success",
                      onClick: () => openActionModal(e, "process"),
                    },
                    {
                      label: "Partially Paid",
                      icon: "coin",
                      tone: "success",
                      onClick: () => openActionModal(e, "partial-pay"),
                    },
                    {
                      label: "Reject Payout",
                      icon: "cross",
                      tone: "danger",
                      onClick: () => openActionModal(e, "processor-reject"),
                    },
                  ]}
                  getEditSlotAction={(e) =>
                    e.status === "APPROVED_APPROVER"
                      ? {
                          label: "Request Changes",
                          icon: "undo",
                          onClick: () => openActionModal(e, "request-changes"),
                        }
                      : null
                  }
                  showEdit={false}
                  showDelete={true}
                  {...expenseActions}
                />
              )}

              {activeSection === "analytics" && (
                <AnalyticsPanel
                  stats={topFilteredStats}
                  expenses={topFilteredExpenses}
                  categoryFilterOptions={categoryFilterOptions}
                  projectFilterOptions={projectFilterOptions}
                  {...expenseActions}
                  showEdit={false}
                  showDelete={
                    currentUser?.role === "ADMIN" ||
                    currentUser?.role === "APPROVER" ||
                    currentUser?.role === "PROCESSOR"
                  }
                  getEditSlotAction={(e) => {
                    if (isFullyPaid(e)) return null;
                    const role = currentUser?.role;
                    const canApproverReturn =
                      e.status === "PENDING_APPROVER" &&
                      (role === "APPROVER" || role === "ADMIN");
                    const canProcessorReturn =
                      e.status === "APPROVED_APPROVER" &&
                      (role === "PROCESSOR" || role === "ADMIN");
                    if (!canApproverReturn && !canProcessorReturn) return null;
                    return {
                      label: "Request Changes",
                      icon: "undo",
                      onClick: () => openActionModal(e, "request-changes"),
                    };
                  }}
                />
              )}
            </>
          )}

          <ExpenseActionModal
            expense={selectedExpense}
            actionType={actionType}
            onClose={() => setSelectedExpense(null)}
            onCompleted={fetchData}
            activeCategories={activeCategories}
            activeProjects={activeProjects}
            activeCountries={activeCountries}
            lockRequesterEmail={currentUser?.role === "REQUESTER"}
          />

          {activeSection === "user-management" && currentUser?.role === "ADMIN" && (
            <UsersPanel currentUser={currentUser} projects={activeProjects} />
          )}

          {activeSection === "categories" && currentUser?.role === "ADMIN" && (
            <CategoriesPanel onCatalogChanged={fetchActiveCatalogs} />
          )}

          {activeSection === "projects" && currentUser?.role === "ADMIN" && (
            <ProjectsPanel onCatalogChanged={fetchActiveCatalogs} />
          )}

          {activeSection === "countries" && currentUser?.role === "ADMIN" && (
            <CountriesPanel />
          )}
        </div>
      </div>
    </div>
  );
}
