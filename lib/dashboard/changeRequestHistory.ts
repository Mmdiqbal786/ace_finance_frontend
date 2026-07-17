import { Expense, HistoryLog } from "./types";

const CHANGE_BACK_ACTIONS = ["Requested Changes", "Returned to Approver"] as const;

export type ChangeRequestLog = {
  action: string;
  notes: string;
  user: string;
  timestamp: string;
};

export function isChangeBackHistoryAction(action: string): boolean {
  return CHANGE_BACK_ACTIONS.some((a) => action.includes(a));
}

/** Every Request Changes / Returned to Approver event on an expense (oldest first). */
export function getChangeRequestLogs(expense: Pick<Expense, "history">): ChangeRequestLog[] {
  return (expense.history || [])
    .filter((log) => isChangeBackHistoryAction(log.action))
    .map((log: HistoryLog) => ({
      action: log.action,
      notes: (log.notes || "").trim(),
      user: log.user,
      timestamp: log.timestamp,
    }))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/** Multi-line summary for table tooltips / Excel — spaced like Payment History. */
export function formatChangeRequestHistorySummary(expense: Pick<Expense, "history">): string {
  const logs = getChangeRequestLogs(expense);
  if (logs.length === 0) return "";

  return logs
    .map((log, i) => {
      const when = new Date(log.timestamp).toLocaleString();
      const lines = [
        `Change Request #${i + 1} (${log.action})`,
        `Date: ${when}`,
        `By: ${log.user}`,
      ];
      if (log.notes) {
        lines.push(`Note: ${log.notes}`);
      }
      return lines.join("\n");
    })
    .join("\n\n");
}
