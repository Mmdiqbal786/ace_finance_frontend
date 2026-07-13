"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import StatusBadge from "../StatusBadge";
import Modal from "../Modal";
import TimelineView from "../TimelineView";
import { getUser, isAuthenticated, authHeaders, AuthUser } from "../../lib/auth";
import { API_URL } from "../../lib/api";
import DashboardSidebar from "../DashboardSidebar";
import TableToolbar from "../TableToolbar";
import TablePagination from "../TablePagination";
import TableRowActions from "../TableRowActions";
import { usePaginatedList } from "../../hooks/usePaginatedList";
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  CATEGORY_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
  ROLE_FILTER_OPTIONS,
  USER_STATUS_FILTER_OPTIONS,
  filterExpenseTable,
  filterTrackerTable,
  filterUserTable,
} from "../../lib/dashboard/constants";
import { Expense, DashboardStats, ExpenseActionType } from "../../lib/dashboard/types";
import {
  canAccessSection,
  getDefaultDashboardRoute,
  pathnameToSection,
} from "../../lib/dashboard/routes";
import DashboardHomeOverview from "./DashboardHomeOverview";
import DashboardSectionStats from "./DashboardSectionStats";
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

  // Modals & Action states
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [actionType, setActionType] = useState<ExpenseActionType>("view");
  const [actionNotes, setActionNotes] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Edit Form States
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("Software");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");

  // Users Management State (Admin only)
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"ADMIN"|"APPROVER"|"PROCESSOR">("APPROVER");
  const [userActionMsg, setUserActionMsg] = useState("");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userModalType, setUserModalType] = useState<"view" | "edit" | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserRole, setEditUserRole] = useState<"ADMIN" | "APPROVER" | "PROCESSOR">("APPROVER");
  const [editUserActive, setEditUserActive] = useState(true);
  const [editUserPassword, setEditUserPassword] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth check on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = "/login";
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

  useEffect(() => {
    if (currentUser?.role === "ADMIN" && activeSection === "user-management") {
      fetchUsers();
    }
  }, [currentUser, activeSection]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = authHeaders();
      const expensesResponse = await fetch(`${API_URL}/expenses`, { headers });
      const statsResponse = await fetch(`${API_URL}/expenses/stats`, { headers });

      if (!expensesResponse.ok || !statsResponse.ok) {
        throw new Error("Failed to load dashboard data from backend.");
      }

      const expensesData = (await expensesResponse.json()) as Expense[];
      const statsData = (await statsResponse.json()) as DashboardStats;

      setExpenses(expensesData.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch(`${API_URL}/users`, { headers: authHeaders() });
      if (res.ok) setUsers(await res.json());
    } catch {}
    setUsersLoading(false);
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
      if (currentUser.role === "ADMIN") fetchUsers();
    }
  }, [currentUser]);

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;

    setSubmittingAction(true);

    if (actionType === "edit") {
      try {
        const response = await fetch(`${API_URL}/expenses/${selectedExpense.id}`, {
          method: "PUT",
          headers: authHeaders() as any,
          body: JSON.stringify({
            requesterName: editName,
            requesterEmail: editEmail,
            amount: parseFloat(editAmount),
            category: editCategory,
            description: editDescription,
            date: editDate,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update expense.");
        }

        setSelectedExpense(null);
        await fetchData();
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      } finally {
        setSubmittingAction(false);
      }
      return;
    }

    let endpoint = "";

    if (actionType === "approve") {
      endpoint = "approve";
    } else if (actionType === "reject") {
      endpoint = "reject";
    } else if (actionType === "process") {
      endpoint = "process";
    } else if (actionType === "processor-reject") {
      endpoint = "processor-reject";
    } else {
      setSubmittingAction(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/expenses/${selectedExpense.id}/${endpoint}`, {
        method: "PATCH",
        headers: authHeaders() as any,
        body: JSON.stringify({ notes: actionNotes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to perform action: ${actionType}`);
      }

      setSelectedExpense(null);
      setActionNotes("");
      await fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserActionMsg("");
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: authHeaders() as any,
        body: JSON.stringify({ name: newUserName, email: newUserEmail, password: newUserPassword, role: newUserRole }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("APPROVER");
      closeCreateUserModal();
      setUserActionMsg("✅ User created successfully!");
      fetchUsers();
    } catch (err: any) { setUserActionMsg(`❌ ${err.message}`); }
  };

  const closeCreateUserModal = () => {
    setShowCreateUser(false);
    setNewUserName("");
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserRole("APPROVER");
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await fetch(`${API_URL}/users/${id}`, { method: "DELETE", headers: authHeaders() as any });
      setDeleteUserId(null);
      fetchUsers();
    } catch {}
  };

  const handleToggleActive = async (user: any) => {
    try {
      await fetch(`${API_URL}/users/${user._id}`, {
        method: "PUT",
        headers: authHeaders() as any,
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      fetchUsers();
    } catch {}
  };

  const openUserView = (user: any) => {
    setSelectedUser(user);
    setUserModalType("view");
  };

  const openUserEdit = (user: any) => {
    setSelectedUser(user);
    setUserModalType("edit");
    setEditUserName(user.name);
    setEditUserRole(user.role);
    setEditUserActive(user.isActive);
    setEditUserPassword("");
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setUserActionMsg("");
    try {
      const body: Record<string, unknown> = {
        name: editUserName,
        role: editUserRole,
        isActive: editUserActive,
      };
      if (editUserPassword.trim()) {
        body.password = editUserPassword;
      }

      const res = await fetch(`${API_URL}/users/${selectedUser._id}`, {
        method: "PUT",
        headers: authHeaders() as any,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update user.");
      }

      setUserModalType(null);
      setSelectedUser(null);
      setUserActionMsg("✅ User updated successfully!");
      fetchUsers();
    } catch (err: any) {
      setUserActionMsg(`❌ ${err.message}`);
    }
  };

  const openActionModal = (expense: Expense, type: typeof actionType) => {
    setSelectedExpense(expense);
    setActionType(type);
    setActionNotes("");
  };

  const openEditModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setActionType("edit");
    setEditName(expense.requesterName);
    setEditEmail(expense.requesterEmail);
    setEditAmount(String(expense.amount));
    setEditCategory(expense.category);
    setEditDescription(expense.description);
    setEditDate(expense.date);
  };

  const triggerDeleteConfirm = (expense: Expense) => {
    setSelectedExpense(expense);
    setActionType("delete");
  };

  const executeDelete = async () => {
    if (!selectedExpense) return;

    setSubmittingAction(true);
    try {
      const response = await fetch(`${API_URL}/expenses/${selectedExpense.id}`, {
        method: "DELETE",
        headers: authHeaders() as any,
      });

      if (!response.ok) throw new Error("Failed to delete expense.");

      setSelectedExpense(null);
      await fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Filtered lists & table controls
  const pendingApproverList = expenses.filter((e) => e.status === "PENDING_APPROVER");
  const approvedApproverList = expenses.filter((e) => e.status === "APPROVED_APPROVER");

  const approverTable = usePaginatedList(pendingApproverList, {
    filterFn: filterExpenseTable,
    initialFilters: { category: "ALL" },
  });

  const processorTable = usePaginatedList(approvedApproverList, {
    filterFn: filterExpenseTable,
    initialFilters: { category: "ALL" },
  });

  const trackerTable = usePaginatedList(expenses, {
    filterFn: filterTrackerTable,
    initialFilters: { status: "ALL", category: "ALL" },
  });

  const usersTable = usePaginatedList(users, {
    filterFn: filterUserTable,
    initialFilters: { role: "ALL", status: "ALL" },
  });

  const handleExportCSV = () => {
    if (trackerTable.filtered.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = [
      "Request ID",
      "Requester Name",
      "Requester Email",
      "Amount (USD)",
      "Category",
      "Description",
      "Date Logged",
      "Status",
      "Date Submitted",
      "Manager Notes",
      "Finance Notes"
    ];

    const rows = trackerTable.filtered.map((e) => [
      e.id,
      e.requesterName,
      e.requesterEmail,
      e.amount.toFixed(2),
      e.category,
      `"${e.description.replace(/"/g, '""')}"`,
      e.date,
      e.status,
      e.submittedAt,
      e.approverNotes ? `"${e.approverNotes.replace(/"/g, '""')}"` : "",
      e.processorNotes ? `"${e.processorNotes.replace(/"/g, '""')}"` : ""
    ]);

    const csvString = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `AceFinance_Report_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sectionMeta = SECTION_META[activeSection];

  return (
    <>
      <DashboardSidebar
        user={currentUser}
        pendingApproverCount={pendingApproverList.length}
        pendingProcessorCount={approvedApproverList.length}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <div className="portal-page relative min-h-0 min-w-0 flex-1 overflow-y-auto">
        <div className="portal-bg" aria-hidden="true">
          <div className="portal-orb portal-orb--violet" />
          <div className="portal-orb portal-orb--indigo" />
          <div className="portal-orb portal-orb--cyan" />
          <div className="portal-grid" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-6xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
          <DashboardBreadcrumb section={activeSection} />

          <div className="flex items-start justify-between gap-3 mb-6 sm:mb-8">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {sectionMeta.title}
                {sectionMeta.titleAccent && (
                  <>
                    {" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400">
                      {sectionMeta.titleAccent}
                    </span>
                  </>
                )}
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                {sectionMeta.subtitle}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {activeSection === "user-management" && currentUser?.role === "ADMIN" && (
                <button
                  onClick={() => {
                    closeCreateUserModal();
                    setUserActionMsg("");
                    setShowCreateUser(true);
                  }}
                  className="hidden sm:inline-flex px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  + Add New User
                </button>
              )}
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <span>☰</span>
                <span>Menu</span>
              </button>
            </div>
          </div>

      {error && (
        <div className="mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-sm text-rose-400">
          ⚠️ {error}{" "}
          <button onClick={fetchData} className="underline font-bold ml-2">
            Try Reconnecting
          </button>
        </div>
      )}

      {activeSection !== "home" && stats && (
        <DashboardSectionStats
          section={activeSection}
          stats={stats}
          expenses={expenses}
          users={users}
          pendingApproverCount={pendingApproverList.length}
          pendingProcessorCount={approvedApproverList.length}
        />
      )}

      {loading ? (
        <div className="portal-card flex flex-col items-center justify-center rounded-2xl py-20">
          <svg className="animate-spin h-8 w-8 text-indigo-500 mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-zinc-400 text-sm">Loading expense database...</span>
        </div>
      ) : (
        <>
          {activeSection === "home" && (
            <DashboardHomeOverview expenses={expenses} stats={stats} />
          )}

          {activeSection === "approver" && (
            <div className="portal-card rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 min-w-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5 sm:mb-6 pb-4 border-b border-zinc-800">
                <span className="text-[11px] sm:text-xs text-zinc-400 font-medium">
                  Showing {approverTable.totalCount} expenses awaiting your sign-off
                </span>
              </div>

              {pendingApproverList.length === 0 ? (
                <div className="text-center py-16 text-zinc-500">
                  <span className="text-3xl block mb-2">🎉</span>
                  <p className="text-sm font-semibold">Inbox is clear!</p>
                  <p className="text-xs mt-1 text-zinc-600">No public expense requests are currently pending review.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <TableToolbar
                      search={approverTable.search}
                      onSearchChange={approverTable.setSearch}
                      searchPlaceholder="Search requester, ID, desc..."
                      filters={[
                        {
                          id: "category",
                          value: approverTable.filters.category,
                          onChange: (value) => approverTable.setFilter("category", value),
                          options: CATEGORY_FILTER_OPTIONS,
                        },
                      ]}
                    />
                  </div>

                  {approverTable.totalCount === 0 ? (
                    <div className="text-center py-12 text-zinc-500">
                      <p className="text-sm font-semibold">No results match filters</p>
                      <p className="text-xs mt-1">Try resetting search or selecting another category.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
                        <thead>
                          <tr className="text-zinc-400 font-semibold text-xs uppercase tracking-wider">
                            <th className="py-3 px-4">Request ID</th>
                            <th className="py-3 px-4">Requester</th>
                            <th className="py-3 px-4">Category</th>
                            <th className="py-3 px-4">Date Submitted</th>
                            <th className="py-3 px-4">Description</th>
                            <th className="py-3 px-4 text-right">Amount</th>
                            <th className="py-3 px-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                          {approverTable.paginated.map((e) => (
                        <tr key={e.id} className="hover:bg-zinc-950/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs text-indigo-400 font-bold">{e.id}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-zinc-100">{e.requesterName}</div>
                            <div className="text-xs text-zinc-500">{e.requesterEmail}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1">
                              <span>{CATEGORY_ICONS[e.category] || "📦"}</span>
                              <span className="font-medium">{e.category}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-zinc-400 text-xs">
                            {new Date(e.submittedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 max-w-xs truncate text-xs text-zinc-400" title={e.description}>
                            {e.description}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-white">${e.amount.toFixed(2)}</td>
                          <td className="py-3.5 px-4 text-center">
                            <TableRowActions
                              onView={() => openActionModal(e, "view")}
                              onEdit={() => openEditModal(e)}
                              onDelete={() => triggerDeleteConfirm(e)}
                              extraActions={[
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
                            />
                          </td>
                        </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <TablePagination
                    page={approverTable.page}
                    totalPages={approverTable.totalPages}
                    pageSize={approverTable.pageSize}
                    totalCount={approverTable.totalCount}
                    onPageChange={approverTable.setPage}
                    onPageSizeChange={approverTable.setPageSize}
                  />
                </>
              )}
            </div>
          )}

          {/* TAB 2: PROCESSOR VIEW (USER 2) */}
          {activeSection === "processor" && (
            <div className="portal-card rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 min-w-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5 sm:mb-6 pb-4 border-b border-zinc-800">
                <span className="text-[11px] sm:text-xs text-zinc-400 font-medium">
                  Showing {processorTable.totalCount} approved expenses awaiting payment release
                </span>
              </div>

              {approvedApproverList.length === 0 ? (
                <div className="text-center py-16 text-zinc-500">
                  <span className="text-3xl block mb-2">🎈</span>
                  <p className="text-sm font-semibold">All payouts cleared!</p>
                  <p className="text-xs mt-1 text-zinc-600">No approved requests are currently waiting to be processed.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <TableToolbar
                      search={processorTable.search}
                      onSearchChange={processorTable.setSearch}
                      searchPlaceholder="Search requester, ID, desc..."
                      filters={[
                        {
                          id: "category",
                          value: processorTable.filters.category,
                          onChange: (value) => processorTable.setFilter("category", value),
                          options: CATEGORY_FILTER_OPTIONS,
                        },
                      ]}
                    />
                  </div>

                  {processorTable.totalCount === 0 ? (
                    <div className="text-center py-12 text-zinc-500">
                      <p className="text-sm font-semibold">No results match filters</p>
                      <p className="text-xs mt-1">Try resetting search or selecting another category.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
                        <thead>
                          <tr className="text-zinc-400 font-semibold text-xs uppercase tracking-wider">
                            <th className="py-3 px-4">Request ID</th>
                            <th className="py-3 px-4">Requester</th>
                            <th className="py-3 px-4">Category</th>
                            <th className="py-3 px-4">Approver's Notes</th>
                            <th className="py-3 px-4 text-right">Amount</th>
                            <th className="py-3 px-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                          {processorTable.paginated.map((e) => (
                        <tr key={e.id} className="hover:bg-zinc-950/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs text-indigo-400 font-bold">{e.id}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-zinc-100">{e.requesterName}</div>
                            <div className="text-xs text-zinc-500">{e.requesterEmail}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1">
                              <span>{CATEGORY_ICONS[e.category] || "📦"}</span>
                              <span className="font-medium">{e.category}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs truncate text-xs text-indigo-300 italic" title={e.approverNotes}>
                            "{e.approverNotes || "No notes written."}"
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-white">${e.amount.toFixed(2)}</td>
                          <td className="py-3.5 px-4 text-center">
                            <TableRowActions
                              onView={() => openActionModal(e, "view")}
                              onEdit={() => openEditModal(e)}
                              onDelete={() => triggerDeleteConfirm(e)}
                              extraActions={[
                                {
                                  label: "Mark Paid",
                                  icon: "💸",
                                  tone: "success",
                                  onClick: () => openActionModal(e, "process"),
                                },
                                {
                                  label: "Reject Payout",
                                  icon: "❌",
                                  tone: "danger",
                                  onClick: () => openActionModal(e, "processor-reject"),
                                },
                              ]}
                            />
                          </td>
                        </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <TablePagination
                    page={processorTable.page}
                    totalPages={processorTable.totalPages}
                    pageSize={processorTable.pageSize}
                    totalCount={processorTable.totalCount}
                    onPageChange={processorTable.setPage}
                    onPageSizeChange={processorTable.setPageSize}
                  />
                </>
              )}
            </div>
          )}

          {/* TAB 3: ANALYTICS & ALL TRACKER VIEW */}
          {activeSection === "analytics" && (
            <div className="space-y-6">
              {/* Analytics Section */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Category Breakdown Card */}
                  <div className="md:col-span-2 portal-card rounded-2xl p-6 shadow-xl">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <span>📊</span> Volume by Category
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(stats.byCategory).map(([category, amount]) => {
                        const percent = stats.totalRequestedAmount > 0 
                          ? (amount / stats.totalRequestedAmount) * 100 
                          : 0;
                        const colorClass = CATEGORY_COLORS[category] || "from-zinc-500 to-zinc-600";
                        return (
                          <div key={category} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-medium">
                              <span className="flex items-center gap-1">
                                <span>{CATEGORY_ICONS[category] || "📦"}</span>
                                <span className="text-zinc-300">{category}</span>
                              </span>
                              <span className="text-zinc-400 font-bold">
                                ${amount.toFixed(2)} <span className="text-zinc-600">({percent.toFixed(1)}%)</span>
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-zinc-950 overflow-hidden">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${colorClass}`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      {Object.keys(stats.byCategory).length === 0 && (
                        <p className="text-xs text-zinc-500 py-6 text-center">No categories recorded yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Recent Activity Log Card */}
                  <div className="portal-card rounded-2xl p-6 shadow-xl">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <span>⏱️</span> Audit Activity Log
                    </h3>
                    <div className="flow-root max-h-64 overflow-y-auto pr-1">
                      <ul role="list" className="-mb-8">
                        {stats.recentActivity.map((log, logIdx) => (
                          <li key={logIdx}>
                            <div className="relative pb-6">
                              {logIdx !== stats.recentActivity.length - 1 ? (
                                <span className="absolute left-3 top-3 -ml-px h-full w-0.5 bg-zinc-850" aria-hidden="true" />
                              ) : null}
                              <div className="relative flex space-x-2 items-start">
                                <div className="h-6 w-6 rounded-full bg-zinc-950 border border-zinc-850 flex items-center justify-center text-[10px]">
                                  {log.action.includes("Submitted") ? "📥" : log.action.includes("Approved") ? "✅" : log.action.includes("Rejected") ? "❌" : "💸"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[11px] font-bold text-zinc-200">
                                    {log.action}
                                  </div>
                                  <div className="text-[9px] text-zinc-500 font-mono mt-0.5">
                                    {log.expenseId.substring(0, 14)}... • {log.user}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                        {stats.recentActivity.length === 0 && (
                          <p className="text-xs text-zinc-500 py-6 text-center">No logged logs.</p>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Table with Filters */}
              <div className="portal-card rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 min-w-0">
                <div className="flex flex-col gap-4 mb-6">
                  <h3 className="text-lg font-bold text-white">All Expense Database</h3>

                  <TableToolbar
                    search={trackerTable.search}
                    onSearchChange={trackerTable.setSearch}
                    searchPlaceholder="Search requester, ID, desc..."
                    filters={[
                      {
                        id: "status",
                        value: trackerTable.filters.status,
                        onChange: (value) => trackerTable.setFilter("status", value),
                        options: STATUS_FILTER_OPTIONS,
                      },
                      {
                        id: "category",
                        value: trackerTable.filters.category,
                        onChange: (value) => trackerTable.setFilter("category", value),
                        options: CATEGORY_FILTER_OPTIONS,
                      },
                    ]}
                  >
                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-500 px-3.5 py-1.5 text-xs font-bold text-white shadow transition-colors cursor-pointer"
                    >
                      📥 Export CSV Report
                    </button>
                  </TableToolbar>
                </div>

                {trackerTable.totalCount === 0 ? (
                  <div className="text-center py-12 text-zinc-500">
                    <p className="text-sm font-semibold">No results match filters</p>
                    <p className="text-xs mt-1">Try resetting search string or selecting another status filter.</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
                        <thead>
                          <tr className="text-zinc-400 font-semibold text-xs uppercase tracking-wider">
                            <th className="py-2.5 px-3">ID</th>
                            <th className="py-2.5 px-3">Requester</th>
                            <th className="py-2.5 px-3">Category</th>
                            <th className="py-2.5 px-3">Submission Date</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Amount</th>
                            <th className="py-2.5 px-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
                          {trackerTable.paginated.map((e) => {
                          return (
                            <tr key={e.id} className="hover:bg-zinc-950/40 transition-colors">
                              <td className="py-3 px-3 font-mono text-xs text-indigo-400 font-bold">{e.id}</td>
                              <td className="py-3 px-3">
                                <div className="font-semibold text-zinc-100 text-xs">{e.requesterName}</div>
                                <div className="text-[10px] text-zinc-500">{e.requesterEmail}</div>
                              </td>
                              <td className="py-3 px-3 text-xs">
                                <span className="flex items-center gap-1">
                                  <span>{CATEGORY_ICONS[e.category] || "📦"}</span>
                                  <span>{e.category}</span>
                                </span>
                              </td>
                              <td className="py-3 px-3 text-xs text-zinc-400">
                                {new Date(e.submittedAt).toLocaleDateString()}
                              </td>
                              <td className="py-3 px-3">
                                <StatusBadge status={e.status} className="text-[10px] py-0.5" />
                              </td>
                              <td className="py-3 px-3 text-right font-semibold text-white">${e.amount.toFixed(2)}</td>
                              <td className="py-3 px-3 text-center">
                                <TableRowActions
                                  onView={() => openActionModal(e, "view")}
                                  onEdit={() => openEditModal(e)}
                                  onDelete={() => triggerDeleteConfirm(e)}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    </div>

                    <TablePagination
                      page={trackerTable.page}
                      totalPages={trackerTable.totalPages}
                      pageSize={trackerTable.pageSize}
                      totalCount={trackerTable.totalCount}
                      onPageChange={trackerTable.setPage}
                      onPageSizeChange={trackerTable.setPageSize}
                    />
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Action Decision Backdrop Modal */}
      <Modal
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        title={
          selectedExpense && (
            <>
              {actionType === "approve" && <span className="text-emerald-400">✅ Approve Expense</span>}
              {actionType === "reject" && <span className="text-rose-400">❌ Reject Expense</span>}
              {actionType === "process" && <span className="text-emerald-400">💸 Mark as Processed (Paid)</span>}
              {actionType === "processor-reject" && <span className="text-rose-400">❌ Reject Disbursement Payout</span>}
              {actionType === "view" && <span className="text-zinc-300">📄 Expense Details & Audit</span>}
              {actionType === "edit" && <span className="text-indigo-400">✏️ Edit Expense Request</span>}
              {actionType === "delete" && <span className="text-rose-500">⚠️ Confirm Deletion</span>}
            </>
          )
        }
      >
        {selectedExpense && (
          <>
            {/* Summary details (hide on edit/delete) */}
            {actionType !== "edit" && actionType !== "delete" && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Request ID:</span>
                  <span className="font-mono text-indigo-400 font-bold">{selectedExpense.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Requester:</span>
                  <span className="font-semibold text-zinc-200">{selectedExpense.requesterName} ({selectedExpense.requesterEmail})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Amount:</span>
                  <span className="font-extrabold text-white text-sm">${selectedExpense.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Category:</span>
                  <span>{CATEGORY_ICONS[selectedExpense.category]} {selectedExpense.category}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Description:</span>
                  <p className="text-zinc-300 italic mt-0.5">"{selectedExpense.description}"</p>
                </div>
                
                {/* Show Manager Notes if on Payout processing step */}
                {selectedExpense.approverNotes && (
                  <div className="pt-2 mt-2 border-t border-zinc-800/80">
                    <span className="text-indigo-400 font-bold block">Approver's Notes (User 1):</span>
                    <p className="text-zinc-300 bg-zinc-900/60 p-2 rounded border border-zinc-800 mt-1 italic">
                      "{selectedExpense.approverNotes}"
                    </p>
                  </div>
                )}

                {/* Show Payout Notes if already processed */}
                {selectedExpense.processorNotes && (
                  <div className="pt-2 mt-1">
                    <span className="text-emerald-400 font-bold block">Processor's Notes (User 2):</span>
                    <p className="text-zinc-300 bg-zinc-900/60 p-2 rounded border border-zinc-800 mt-1 italic">
                      "{selectedExpense.processorNotes}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Render forms conditionally */}
            {actionType === "edit" ? (
              <form onSubmit={handleActionSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-805 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-805 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      Amount (USD)
                    </label>
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      step="0.01"
                      min="0.01"
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-805 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      Expense Date
                    </label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-805 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-805 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Travel">Travel & Lodging</option>
                    <option value="Meals">Meals & Entertainment</option>
                    <option value="Office">Office Supplies</option>
                    <option value="Software">Software & SaaS</option>
                    <option value="Other">Other Expenses</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Purpose / Description
                  </label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-805 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedExpense(null)}
                    className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/15 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {submittingAction ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : actionType === "delete" ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/25 p-4 text-zinc-100 flex items-start gap-3">
                  <span className="text-2xl mt-0.5">⚠️</span>
                  <div>
                    <h4 className="text-sm font-bold text-rose-450">Warning: Permanent Deletion</h4>
                    <p className="text-xs text-zinc-300 mt-1">
                      Are you sure you want to delete this expense request? This operation cannot be undone and will permanently remove the record from the database.
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 font-medium">Request ID:</span>
                    <span className="font-mono text-indigo-400 font-bold">{selectedExpense.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 font-medium">Requester:</span>
                    <span className="font-semibold text-zinc-200">{selectedExpense.requesterName} ({selectedExpense.requesterEmail})</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 font-medium">Amount:</span>
                    <span className="font-extrabold text-white text-sm">${selectedExpense.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-zinc-500 font-medium">Purpose:</span>
                    <span className="text-zinc-305 max-w-[280px] text-right italic truncate" title={selectedExpense.description}>
                      "{selectedExpense.description}"
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedExpense(null)}
                    className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                  >
                    Cancel, Keep Request
                  </button>
                  <button
                    type="button"
                    onClick={executeDelete}
                    disabled={submittingAction}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-600/10 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {submittingAction ? "Deleting..." : "Yes, Delete Permanently"}
                  </button>
                </div>
              </div>
            ) : actionType !== "view" ? (
              // Simple approval/rejection comments form
              <form onSubmit={handleActionSubmit} className="space-y-4">
                <div>
                  <label htmlFor="notes" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    {actionType.includes("reject") ? "Reason for Rejection" : "Add Review / Payout Notes (Optional)"}
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder={
                      actionType.includes("reject")
                        ? "State the reason why this expense request is being rejected..."
                        : "Enter transaction details, wire references, or general comments..."
                    }
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-indigo-500 focus:outline-none transition-colors resize-none"
                    required={actionType.includes("reject")}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedExpense(null)}
                    className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className={`px-4 py-2 rounded-lg text-xs font-bold text-white shadow-lg transition-colors cursor-pointer disabled:opacity-50 ${
                      actionType.includes("reject")
                        ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/10"
                        : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/10"
                    }`}
                  >
                    {submittingAction ? "Saving..." : "Confirm Action"}
                  </button>
                </div>
              </form>
            ) : (
              // Timeline/Workflow logs display inside details
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Workflow Timeline History</h4>
                <TimelineView history={selectedExpense.history} />
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedExpense(null)}
                    className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* ───── USERS MANAGEMENT TAB (Admin Only) ───── */}
      {activeSection === "user-management" && currentUser?.role === "ADMIN" && (
        <div className="mt-2">
          <div className="flex items-center justify-end mb-4 sm:hidden">
            <button
              onClick={() => {
                closeCreateUserModal();
                setUserActionMsg("");
                setShowCreateUser(true);
              }}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              + Add New User
            </button>
          </div>

          {userActionMsg && (
            <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${userActionMsg.startsWith("✅") ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" : "bg-rose-500/10 border border-rose-500/30 text-rose-400"}`}>
              {userActionMsg}
            </div>
          )}

          {/* Users Table */}
          {usersLoading ? (
            <div className="text-center py-12 text-zinc-500">Loading users...</div>
          ) : (
            <div className="portal-card rounded-xl overflow-hidden">
              <div className="p-4 border-b border-zinc-800">
                <TableToolbar
                  search={usersTable.search}
                  onSearchChange={usersTable.setSearch}
                  searchPlaceholder="Search name or email..."
                  filters={[
                    {
                      id: "role",
                      value: usersTable.filters.role,
                      onChange: (value) => usersTable.setFilter("role", value),
                      options: ROLE_FILTER_OPTIONS,
                    },
                    {
                      id: "status",
                      value: usersTable.filters.status,
                      onChange: (value) => usersTable.setFilter("status", value),
                      options: USER_STATUS_FILTER_OPTIONS,
                    },
                  ]}
                />
              </div>

              {usersTable.totalCount === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <p className="text-sm font-semibold">No users match filters</p>
                  <p className="text-xs mt-1">Try resetting search or changing role/status filters.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-900 border-b border-zinc-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Role</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {usersTable.paginated.map((u) => (
                    <tr key={u._id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">{u.name}</td>
                      <td className="px-4 py-3 text-zinc-400">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          u.role === "ADMIN" ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25" :
                          u.role === "APPROVER" ? "bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/25" :
                          "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25"
                        }`}>
                          {u.role === "ADMIN" ? "👑" : u.role === "APPROVER" ? "✅" : "💳"} {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleToggleActive(u)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
                            u.isActive ? "bg-emerald-500/10 text-emerald-400 hover:bg-rose-500/10 hover:text-rose-400" : "bg-rose-500/10 text-rose-400 hover:bg-emerald-500/10 hover:text-emerald-400"
                          }`}>
                          {u.isActive ? "● Active" : "○ Inactive"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <TableRowActions
                          align="end"
                          onView={() => openUserView(u)}
                          onEdit={() => openUserEdit(u)}
                          onDelete={() => setDeleteUserId(u._id)}
                          showDelete={u.email !== currentUser?.email}
                        />
                      </td>
                        </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-4 pb-4">
                    <TablePagination
                      page={usersTable.page}
                      totalPages={usersTable.totalPages}
                      pageSize={usersTable.pageSize}
                      totalCount={usersTable.totalCount}
                      onPageChange={usersTable.setPage}
                      onPageSizeChange={usersTable.setPageSize}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Delete User Confirmation Modal */}
          {deleteUserId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                <div className="text-center mb-4">
                  <div className="text-3xl mb-2">🗑️</div>
                  <h3 className="text-lg font-bold text-white">Delete User?</h3>
                  <p className="text-sm text-zinc-400 mt-1">This action is permanent and cannot be undone.</p>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setDeleteUserId(null)}
                    className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold text-zinc-300 transition-colors">
                    Cancel
                  </button>
                  <button onClick={() => handleDeleteUser(deleteUserId)}
                    className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-sm font-bold text-white transition-colors">
                    Yes, Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          <Modal
            isOpen={showCreateUser}
            onClose={closeCreateUserModal}
            title="Create New User Account"
            maxWidthClass="max-w-lg"
          >
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1 uppercase tracking-wider">Full Name</label>
                <input
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                  placeholder="Jane Smith"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                  placeholder="jane@acefinance.com"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  required
                  placeholder="Min 8 characters"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1 uppercase tracking-wider">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as "ADMIN" | "APPROVER" | "PROCESSOR")}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                >
                  <option value="APPROVER">APPROVER — Reviews & approves expenses</option>
                  <option value="PROCESSOR">PROCESSOR — Processes approved expenses</option>
                  <option value="ADMIN">ADMIN — Full access + user management</option>
                </select>
              </div>
              <div className="sm:col-span-2 flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={closeCreateUserModal}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Create User
                </button>
              </div>
            </form>
          </Modal>

          <Modal
            isOpen={!!selectedUser && userModalType === "view"}
            onClose={() => { setSelectedUser(null); setUserModalType(null); }}
            title="User Details"
            maxWidthClass="max-w-md"
          >
            {selectedUser && (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Name</span>
                  <span className="font-semibold text-white text-right">{selectedUser.name}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Email</span>
                  <span className="text-zinc-300 text-right break-all">{selectedUser.email}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Role</span>
                  <span className="font-semibold text-indigo-300">{selectedUser.role}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Status</span>
                  <span className={selectedUser.isActive ? "text-emerald-400" : "text-rose-400"}>
                    {selectedUser.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => { setSelectedUser(null); setUserModalType(null); }}
                    className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </Modal>

          <Modal
            isOpen={!!selectedUser && userModalType === "edit"}
            onClose={() => { setSelectedUser(null); setUserModalType(null); }}
            title="Edit User"
            maxWidthClass="max-w-lg"
          >
            {selectedUser && (
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1 uppercase tracking-wider">Full Name</label>
                  <input
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1 uppercase tracking-wider">Email</label>
                  <input
                    value={selectedUser.email}
                    disabled
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1 uppercase tracking-wider">Role</label>
                  <select
                    value={editUserRole}
                    onChange={(e) => setEditUserRole(e.target.value as "ADMIN" | "APPROVER" | "PROCESSOR")}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                  >
                    <option value="APPROVER">APPROVER</option>
                    <option value="PROCESSOR">PROCESSOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1 uppercase tracking-wider">Status</label>
                  <select
                    value={editUserActive ? "ACTIVE" : "INACTIVE"}
                    onChange={(e) => setEditUserActive(e.target.value === "ACTIVE")}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1 uppercase tracking-wider">New Password (optional)</label>
                  <input
                    type="password"
                    value={editUserPassword}
                    onChange={(e) => setEditUserPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => { setSelectedUser(null); setUserModalType(null); }}
                    className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </Modal>
        </div>
      )}
        </div>
      </div>
    </>
  );
}
