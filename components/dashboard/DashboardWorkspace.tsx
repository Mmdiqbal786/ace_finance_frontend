"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { getUser, isAuthenticated, authHeaders, AuthUser, mustChangePassword } from "../../lib/auth";
import { API_URL } from "../../lib/api";
import DashboardSidebar from "../DashboardSidebar";
import {
  buildCategoryFilterOptions,
  buildProjectFilterOptions,
} from "../../lib/dashboard/constants";
import {
  Expense,
  DashboardStats,
  ExpenseActionType,
  CategoryItem,
  ProjectItem,
  CountryItem,
} from "../../lib/dashboard/types";
import {
  canAccessSection,
  getDefaultDashboardRoute,
  pathnameToSection,
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

export default function DashboardWorkspace() {
  const pathname = usePathname();
  const activeSection = pathnameToSection(pathname);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [actionType, setActionType] = useState<ExpenseActionType>("view");

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
    setCurrentUser(getUser());
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    if (!canAccessSection(currentUser.role, activeSection)) {
      window.location.href = getDefaultDashboardRoute(currentUser.role);
    }
  }, [currentUser, activeSection]);

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

      const expensesData = (await expensesResponse.json()) as Expense[];
      setExpenses(
        expensesData.sort(
          (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        )
      );

      if (!isRequester) {
        const statsResponse = await fetch(`${API_URL}/expenses/stats`, { headers });
        if (!statsResponse.ok) {
          throw new Error("Failed to load dashboard stats from backend.");
        }
        setStats((await statsResponse.json()) as DashboardStats);
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

  const pendingApproverList = expenses.filter((e) => e.status === "PENDING_APPROVER");
  const approvedApproverList = expenses.filter(
    (e) => e.status === "APPROVED_APPROVER" || e.status === "PARTIALLY_PAID"
  );

  const categoryFilterOptions = buildCategoryFilterOptions(activeCategories);
  const projectFilterOptions = buildProjectFilterOptions(activeProjects);
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
        <div className="relative z-10 mx-auto w-full max-w-6xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
          <DashboardBreadcrumb section={activeSection} />

          <div className="flex items-start justify-between gap-3 mb-6 sm:mb-8">
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

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-400 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span>☰</span>
                <span>Menu</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
              ⚠️ {error}{" "}
              <button onClick={fetchData} className="underline font-bold ml-2">
                Try Reconnecting
              </button>
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
            stats && (
              <DashboardSectionStats
                section={activeSection}
                stats={stats}
                expenses={expenses}
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
                <DashboardHomeOverview expenses={expenses} stats={stats} />
              )}

              {activeSection === "submit-expense" && currentUser && (
                <SubmitExpensePanel
                  currentUser={currentUser}
                  categories={activeCategories}
                  projects={activeProjects}
                  countries={activeCountries}
                  catalogLoading={catalogLoading}
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
                  projectFilterOptions={projectFilterOptions}
                  headerText={(count) =>
                    `Showing ${count} expenses awaiting your sign-off`
                  }
                  emptyInbox={{
                    emoji: "🎉",
                    title: "Inbox is clear!",
                    subtitle: "No public expense requests are currently pending review.",
                  }}
                  getExtraActions={(e) => [
                    {
                      label: "Approve",
                      icon: "✅",
                      tone: "success",
                      onClick: () => openActionModal(e, "approve"),
                    },
                    {
                      label: "Reject",
                      icon: "❌",
                      tone: "danger",
                      onClick: () => openActionModal(e, "reject"),
                    },
                  ]}
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
                    emoji: "🎈",
                    title: "All payouts cleared!",
                    subtitle: "No approved requests are currently waiting to be processed.",
                  }}
                  getExtraActions={(e) => [
                    {
                      label: "Mark Paid",
                      icon: "💸",
                      tone: "success",
                      onClick: () => openActionModal(e, "process"),
                    },
                    {
                      label: "Partially Paid",
                      icon: "🪙",
                      tone: "success",
                      onClick: () => openActionModal(e, "partial-pay"),
                    },
                    {
                      label: "Reject Payout",
                      icon: "❌",
                      tone: "danger",
                      onClick: () => openActionModal(e, "processor-reject"),
                    },
                  ]}
                  {...expenseActions}
                />
              )}

              {activeSection === "analytics" && (
                <AnalyticsPanel
                  stats={stats}
                  expenses={expenses}
                  categoryFilterOptions={categoryFilterOptions}
                  projectFilterOptions={projectFilterOptions}
                  {...expenseActions}
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
            <UsersPanel currentUser={currentUser} />
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
