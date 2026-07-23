"use client";

import React, { useEffect, useState } from "react";
import Modal from "../Modal";
import TableToolbar from "../TableToolbar";
import TablePagination from "../TablePagination";
import TableRowActions from "../TableRowActions";
import StatCard from "../StatCard";
import FormField, { FormActionButtons, RequiredFieldsNote } from "../FormField";
import ConfirmDialog from "../ConfirmDialog";
import StatusToggle from "../StatusToggle";
import { usePaginatedList } from "../../hooks/usePaginatedList";
import { useFormValidation } from "../../hooks/useFormValidation";
import { API_URL } from "../../lib/api";
import { AuthUser, authHeaders } from "../../lib/auth";
import { readApiError } from "../../lib/apiError";
import { toast } from "../../lib/toast";
import {
  ROLE_FILTER_OPTIONS,
  USER_STATUS_FILTER_OPTIONS,
  filterUserTable,
} from "../../lib/dashboard/constants";
import { validateEmail, validatePassword, validatePersonName } from "../../lib/validation";

type UserRole = "ADMIN" | "APPROVER" | "PROCESSOR" | "REQUESTER";

interface ManagedUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  assignedProjects?: string[];
  isDemo?: boolean;
}

type CreateUserField = "name" | "email" | "role" | "assignedProjects";
type EditUserField = "name" | "role" | "password" | "assignedProjects";

function roleNeedsProjects(role: UserRole): boolean {
  return role === "REQUESTER" || role === "APPROVER";
}

interface UsersPanelProps {
  currentUser: AuthUser;
  openCreateSignal?: number;
  projects?: Array<{ name: string; isActive?: boolean }>;
}

export default function UsersPanel({
  currentUser,
  openCreateSignal = 0,
  projects = [],
}: UsersPanelProps) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<ManagedUser | null>(null);
  const [modalType, setModalType] = useState<"view" | "edit" | null>(null);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("APPROVER");
  const [newProjects, setNewProjects] = useState<string[]>([]);

  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("APPROVER");
  const [editActive, setEditActive] = useState(true);
  const [editPassword, setEditPassword] = useState("");
  const [editProjects, setEditProjects] = useState<string[]>([]);

  const createForm = useFormValidation<CreateUserField>();
  const editForm = useFormValidation<EditUserField>();
  const table = usePaginatedList(users, {
    filterFn: filterUserTable,
    initialFilters: { role: "ALL", status: "ALL" },
  });

  const activeProjectNames = projects
    .filter((p) => p.isActive !== false)
    .map((p) => p.name)
    .sort((a, b) => a.localeCompare(b));

  const toggleProject = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    name: string,
  ) => {
    setList((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name],
    );
  };
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users`, { headers: authHeaders() });
      if (res.ok) setUsers(await res.json());
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  useEffect(() => {
    if (openCreateSignal > 0) {
      closeCreate();
      setShowCreate(true);
    }
  }, [openCreateSignal]);

  const closeCreate = () => {
    setShowCreate(false);
    setNewName("");
    setNewEmail("");
    setNewRole("APPROVER");
    setNewProjects([]);
    createForm.clearAll();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = createForm.validateAll({
      name: () => validatePersonName(newName, "Full name"),
      email: () => validateEmail(newEmail),
      role: () => (newRole ? "" : "Role is required."),
      assignedProjects: () =>
        roleNeedsProjects(newRole) && newProjects.length === 0
          ? "Assign at least one project."
          : "",
    });
    if (!ok) {
      createForm.focusFirstInvalid();
      return;
    }
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: authHeaders() as HeadersInit,
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim().toLowerCase(),
          role: newRole,
          assignedProjects: roleNeedsProjects(newRole) ? newProjects : [],
        }),
      });
      if (!res.ok) throw new Error(await readApiError(res, "Failed to create user"));
      const created = await res.json().catch(() => ({}));
      closeCreate();
      if (created.welcomeEmailSent) {
        toast.success("User created — welcome email with auto password sent.");
      } else if (created.temporaryPassword) {
        toast.success(
          `User created. Email not sent${
            created.welcomeEmailError ? ` (${created.welcomeEmailError})` : ""
          }. Temporary password: ${created.temporaryPassword}`
        );
      } else {
        toast.success("User created. They must change password on first login.");
      }
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: "DELETE",
        headers: authHeaders() as HeadersInit,
      });
      if (!res.ok) throw new Error(await readApiError(res, "Failed to delete user"));
      setDeleteId(null);
      toast.success("User deleted.");
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    }
  };

  const handleToggle = async (user: ManagedUser) => {
    try {
      const res = await fetch(`${API_URL}/users/${user._id}`, {
        method: "PUT",
        headers: authHeaders() as HeadersInit,
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (!res.ok) throw new Error(await readApiError(res, "Failed to update user"));
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update user");
    }
  };

  const openEdit = (user: ManagedUser) => {
    setSelected(user);
    setModalType("edit");
    setEditName(user.name);
    setEditRole(user.role);
    setEditActive(user.isActive);
    setEditPassword("");
    setEditProjects(Array.isArray(user.assignedProjects) ? [...user.assignedProjects] : []);
    editForm.clearAll();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    const ok = editForm.validateAll({
      name: () => validatePersonName(editName, "Full name"),
      role: () => (editRole ? "" : "Role is required."),
      password: () => validatePassword(editPassword, { required: false }),
      assignedProjects: () =>
        roleNeedsProjects(editRole) && editProjects.length === 0
          ? "Assign at least one project."
          : "",
    });
    if (!ok) {
      editForm.focusFirstInvalid();
      return;
    }
    try {
      const body: Record<string, unknown> = {
        name: editName.trim(),
        role: editRole,
        isActive: editActive,
        assignedProjects: roleNeedsProjects(editRole) ? editProjects : [],
      };
      if (editPassword.trim()) {
        body.password = editPassword;
      }

      const res = await fetch(`${API_URL}/users/${selected._id}`, {
        method: "PUT",
        headers: authHeaders() as HeadersInit,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await readApiError(res, "Failed to update user"));

      setModalType(null);
      setSelected(null);
      editForm.clearAll();
      toast.success("User updated successfully!");
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update user");
    }
  };

  const activeCount = users.filter((u) => u.isActive).length;
  const adminCount = users.filter((u) => u.role === "ADMIN").length;

  return (
    <div className="mt-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard title="Total Users" value={String(users.length)} subtext="Registered accounts" emoji="👥" />
        <StatCard
          title="Active Users"
          value={String(activeCount)}
          subtext={`${users.length - activeCount} inactive`}
          emoji="✅"
          valueColor="text-emerald-600"
        />
        <StatCard
          title="Administrators"
          value={String(adminCount)}
          subtext="Full-access accounts"
          emoji="👑"
          valueColor="text-amber-600"
        />
      </div>

      <div className="flex items-center justify-end mb-4">
        <button
          type="button"
          onClick={() => {
            closeCreate();
            setShowCreate(true);
          }}
          className="px-4 py-2 rounded-lg bg-[var(--af-navy)] hover:bg-[var(--af-navy-soft)] text-xs font-bold text-white transition-colors cursor-pointer"
        >
          + Add New User
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-700">Loading users...</div>
      ) : (
        <div className="portal-card rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 min-w-0">
          <div className="mb-4">
            <TableToolbar
              search={table.search}
              onSearchChange={table.setSearch}
              searchPlaceholder="Search name or email..."
              filters={[
                {
                  id: "role",
                  value: table.filters.role,
                  onChange: (value) => table.setFilter("role", value),
                  options: ROLE_FILTER_OPTIONS,
                },
                {
                  id: "status",
                  value: table.filters.status,
                  onChange: (value) => table.setFilter("status", value),
                  options: USER_STATUS_FILTER_OPTIONS,
                },
              ]}
            />
          </div>

          {table.totalCount === 0 ? (
            <div className="text-center py-12 text-slate-700">
              <p className="text-sm font-semibold">No users match filters</p>
              <p className="text-xs mt-1">Try resetting search or changing role/status filters.</p>
            </div>
          ) : (
            <>
              <div className="af-table-wrap">
                <table className="af-table min-w-full">
                  <thead>
                    <tr>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Projects</th>
                      <th className="py-3 px-4">Demo</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.paginated.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{u.name}</td>
                        <td className="py-3.5 px-4 text-slate-700">{u.email}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-bold ring-1 ${
                              u.role === "ADMIN"
                                ? "bg-amber-50 text-amber-800 ring-amber-300"
                                : u.role === "APPROVER"
                                  ? "bg-sky-50 text-[var(--af-accent)] ring-sky-300"
                                  : u.role === "REQUESTER"
                                    ? "bg-violet-50 text-violet-800 ring-violet-300"
                                    : "bg-emerald-50 text-emerald-800 ring-emerald-300"
                            }`}
                          >
                            {u.role === "ADMIN"
                              ? "👑"
                              : u.role === "APPROVER"
                                ? "✅"
                                : u.role === "REQUESTER"
                                  ? "📄"
                                  : "💳"}{" "}
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 text-xs max-w-[220px]">
                          {roleNeedsProjects(u.role)
                            ? u.assignedProjects?.length
                              ? u.assignedProjects.join(", ")
                              : "None assigned"
                            : "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          {u.isDemo ? (
                            <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 ring-1 ring-amber-300">
                              Demo
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusToggle isActive={u.isActive} onToggle={() => handleToggle(u)} />
                        </td>
                        <td className="py-3.5 px-4">
                          <TableRowActions
                            align="start"
                            onView={() => {
                              setSelected(u);
                              setModalType("view");
                            }}
                            onEdit={() => openEdit(u)}
                            onDelete={() => setDeleteId(u._id)}
                            showDelete={u.email !== currentUser.email}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <TablePagination
                page={table.page}
                totalPages={table.totalPages}
                pageSize={table.pageSize}
                totalCount={table.totalCount}
                onPageChange={table.setPage}
                onPageSizeChange={table.setPageSize}
              />
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete User?"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />

      <Modal isOpen={showCreate} onClose={closeCreate} title="Create New User Account" maxWidthClass="max-w-lg">
        <form onSubmit={handleCreate} noValidate className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RequiredFieldsNote className="sm:col-span-2 -mt-1" />
          <FormField label="Full Name" required error={createForm.errors.name}>
            <input
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                createForm.clearError("name");
              }}
              onBlur={() => createForm.onBlur("name", validatePersonName(newName, "Full name"))}
              placeholder="Jane Smith"
              className={createForm.fieldClass("af-input", "name")}
              aria-invalid={Boolean(createForm.errors.name)}
            />
          </FormField>
          <FormField label="Email Address" required error={createForm.errors.email}>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                createForm.clearError("email");
              }}
              onBlur={() => createForm.onBlur("email", validateEmail(newEmail))}
              placeholder="jane@aceolution.com"
              className={createForm.fieldClass("af-input", "email")}
              aria-invalid={Boolean(createForm.errors.email)}
            />
          </FormField>
          <FormField label="Role" required error={createForm.errors.role}>
            <select
              value={newRole}
              onChange={(e) => {
                const role = e.target.value as UserRole;
                setNewRole(role);
                if (!roleNeedsProjects(role)) setNewProjects([]);
                createForm.clearError("role");
                createForm.clearError("assignedProjects");
              }}
              className={createForm.fieldClass("af-select", "role")}
            >
              <option value="REQUESTER">REQUESTER — Submits & tracks own expenses</option>
              <option value="APPROVER">APPROVER — Reviews & approves expenses</option>
              <option value="PROCESSOR">PROCESSOR — Processes approved expenses</option>
              <option value="ADMIN">ADMIN — Full access + user management</option>
            </select>
          </FormField>
          {roleNeedsProjects(newRole) && (
            <div className="sm:col-span-2">
              <FormField
                label="Assigned projects"
                required
                error={createForm.errors.assignedProjects}
              >
                <div
                  className={`max-h-40 overflow-y-auto rounded-lg border bg-white p-2 space-y-1 ${
                    createForm.errors.assignedProjects
                      ? "border-rose-400"
                      : "border-slate-200"
                  }`}
                >
                  {activeProjectNames.length === 0 ? (
                    <p className="text-xs text-slate-600 px-1 py-2">
                      No active projects in the catalog. Add projects first.
                    </p>
                  ) : (
                    activeProjectNames.map((name) => (
                      <label
                        key={name}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 text-sm text-slate-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={newProjects.includes(name)}
                          onChange={() => {
                            toggleProject(newProjects, setNewProjects, name);
                            createForm.clearError("assignedProjects");
                          }}
                          className="rounded border-slate-300"
                        />
                        <span>{name}</span>
                      </label>
                    ))
                  )}
                </div>
              </FormField>
            </div>
          )}
          <p className="sm:col-span-2 text-xs text-slate-600 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
            A temporary password is generated automatically and emailed to the user. They must set a
            new password on first login.
            {roleNeedsProjects(newRole)
              ? " Requesters and Approvers can only work with the projects you assign here."
              : ""}
          </p>
          <div className="sm:col-span-2">
            <FormActionButtons onCancel={closeCreate} submitLabel="Create User" />
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!selected && modalType === "view"}
        onClose={() => {
          setSelected(null);
          setModalType(null);
        }}
        title="User Details"
        maxWidthClass="max-w-md"
      >
        {selected && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-slate-700">Name</span>
              <span className="font-semibold text-slate-900 text-right">{selected.name}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-700">Email</span>
              <span className="text-slate-600 text-right break-all">{selected.email}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-700">Role</span>
              <span className="font-semibold text-[var(--af-accent)]">{selected.role}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-700">Status</span>
              <span className={selected.isActive ? "text-emerald-600" : "text-rose-600"}>
                {selected.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            {roleNeedsProjects(selected.role) && (
              <div className="flex justify-between gap-4">
                <span className="text-slate-700 shrink-0">Projects</span>
                <span className="font-semibold text-slate-900 text-right">
                  {selected.assignedProjects?.length
                    ? selected.assignedProjects.join(", ")
                    : "None assigned"}
                </span>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <span className="text-slate-700">Demo account</span>
              <span className={selected.isDemo ? "text-amber-700 font-semibold" : "text-slate-600"}>
                {selected.isDemo ? "Yes (password-only login)" : "No"}
              </span>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setModalType(null);
                }}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!selected && modalType === "edit"}
        onClose={() => {
          setSelected(null);
          setModalType(null);
          editForm.clearAll();
        }}
        title="Edit User"
        maxWidthClass="max-w-lg"
      >
        {selected && (
          <form onSubmit={handleUpdate} noValidate className="space-y-4">
            <FormField label="Full Name" required error={editForm.errors.name}>
              <input
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value);
                  editForm.clearError("name");
                }}
                onBlur={() => editForm.onBlur("name", validatePersonName(editName, "Full name"))}
                className={editForm.fieldClass("af-input", "name")}
                aria-invalid={Boolean(editForm.errors.name)}
              />
            </FormField>
            <FormField label="Email">
              <input value={selected.email} disabled className="af-input cursor-not-allowed opacity-70" />
            </FormField>
            <FormField label="Role" required error={editForm.errors.role}>
              <select
                value={editRole}
                onChange={(e) => {
                  const role = e.target.value as UserRole;
                  setEditRole(role);
                  if (!roleNeedsProjects(role)) setEditProjects([]);
                  editForm.clearError("role");
                  editForm.clearError("assignedProjects");
                }}
                className={editForm.fieldClass("af-select", "role")}
              >
                <option value="REQUESTER">REQUESTER</option>
                <option value="APPROVER">APPROVER</option>
                <option value="PROCESSOR">PROCESSOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </FormField>
            {roleNeedsProjects(editRole) && (
              <FormField
                label="Assigned projects"
                required
                error={editForm.errors.assignedProjects}
              >
                <div
                  className={`max-h-40 overflow-y-auto rounded-lg border bg-white p-2 space-y-1 ${
                    editForm.errors.assignedProjects
                      ? "border-rose-400"
                      : "border-slate-200"
                  }`}
                >
                  {activeProjectNames.length === 0 ? (
                    <p className="text-xs text-slate-600 px-1 py-2">
                      No active projects in the catalog. Add projects first.
                    </p>
                  ) : (
                    activeProjectNames.map((name) => (
                      <label
                        key={name}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 text-sm text-slate-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={editProjects.includes(name)}
                          onChange={() => {
                            toggleProject(editProjects, setEditProjects, name);
                            editForm.clearError("assignedProjects");
                          }}
                          className="rounded border-slate-300"
                        />
                        <span>{name}</span>
                      </label>
                    ))
                  )}
                </div>
              </FormField>
            )}
            <FormField label="Status">
              <select
                value={editActive ? "ACTIVE" : "INACTIVE"}
                onChange={(e) => setEditActive(e.target.value === "ACTIVE")}
                className="af-select"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </FormField>
            <FormField label="New Password (optional)" error={editForm.errors.password}>
              <input
                type="password"
                value={editPassword}
                onChange={(e) => {
                  setEditPassword(e.target.value);
                  editForm.clearError("password");
                }}
                onBlur={() =>
                  editForm.onBlur("password", validatePassword(editPassword, { required: false }))
                }
                placeholder="Leave blank to keep current password"
                className={editForm.fieldClass("af-input", "password")}
                aria-invalid={Boolean(editForm.errors.password)}
              />
            </FormField>
            <FormActionButtons
              onCancel={() => {
                setSelected(null);
                setModalType(null);
                editForm.clearAll();
              }}
              submitLabel="Save Changes"
            />
          </form>
        )}
      </Modal>
    </div>
  );
}
