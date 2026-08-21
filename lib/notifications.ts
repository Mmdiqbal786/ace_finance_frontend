import { API_URL } from "./api";
import { authHeaders } from "./auth";

export type NotificationType =
  | "EXPENSE_SUBMITTED"
  | "EXPENSE_PENDING_APPROVAL"
  | "EXPENSE_APPROVED"
  | "EXPENSE_REJECTED_APPROVER"
  | "EXPENSE_CHANGES_REQUESTED"
  | "EXPENSE_RETURNED_APPROVER"
  | "EXPENSE_REJECTED_PROCESSOR"
  | "EXPENSE_FULLY_PAID"
  | "EXPENSE_DUE_SOON";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  expenseId?: string;
  project?: string;
  isRead: boolean;
  createdAt: string;
}

export function notificationHref(n: AppNotification, role?: string): string {
  let path = "/dashboard/analytics/";
  if (n.type === "EXPENSE_PENDING_APPROVAL" || n.type === "EXPENSE_RETURNED_APPROVER" || n.type === "EXPENSE_DUE_SOON") {
    if (role === "PROCESSOR") path = "/dashboard/processor/";
    else if (role === "APPROVER" || role === "ADMIN") path = "/dashboard/approver/";
  } else if (n.type === "EXPENSE_APPROVED") {
    path = "/dashboard/processor/";
  } else if (
    n.type === "EXPENSE_SUBMITTED" ||
    n.type === "EXPENSE_CHANGES_REQUESTED" ||
    n.type === "EXPENSE_REJECTED_APPROVER" ||
    n.type === "EXPENSE_REJECTED_PROCESSOR" ||
    n.type === "EXPENSE_FULLY_PAID"
  ) {
    path = "/dashboard/my-requests/";
  }

  if (!n.expenseId) return path;
  const action = n.type === "EXPENSE_CHANGES_REQUESTED" ? "edit" : "view";
  return `${path}?expense=${encodeURIComponent(n.expenseId)}&action=${action}`;
}

export async function fetchNotifications(limit = 30): Promise<AppNotification[]> {
  const res = await fetch(`${API_URL}/notifications?limit=${limit}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load notifications");
  return res.json();
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const res = await fetch(`${API_URL}/notifications/unread-count`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load unread count");
  const data = await res.json();
  return Number(data.count) || 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/notifications/${id}/read`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to mark notification as read");
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await fetch(`${API_URL}/notifications/read-all`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to mark all notifications as read");
}
