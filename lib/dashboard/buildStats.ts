import { getPaidAmount } from "./payment";
import { DashboardStats, Expense } from "./types";

/** Build dashboard/analytics stats from an expense list (already role/project scoped). */
export function buildStatsFromExpenses(expenses: Expense[]): DashboardStats {
  let totalRequested = 0;
  let totalProcessed = 0;
  let pendingApproval = 0;
  let pendingProcessing = 0;
  let processed = 0;
  let rejected = 0;
  const byCategory: { [key: string]: number } = {};

  for (const e of expenses) {
    totalRequested += Number(e.amount) || 0;
    const paid = getPaidAmount(e);
    if (e.status === "PENDING_APPROVER") pendingApproval += 1;
    else if (e.status === "APPROVED_APPROVER" || e.status === "PARTIALLY_PAID") {
      pendingProcessing += 1;
    } else if (e.status === "PROCESSED") {
      processed += 1;
      totalProcessed += paid > 0 ? paid : Number(e.amount) || 0;
    } else if (e.status === "REJECTED_APPROVER" || e.status === "REJECTED_PROCESSOR") {
      rejected += 1;
    }
    if (e.status === "PARTIALLY_PAID" && paid > 0) {
      totalProcessed += paid;
    }
    const cat = e.category || "Other";
    byCategory[cat] = (byCategory[cat] || 0) + (Number(e.amount) || 0);
  }

  const recentActivity: DashboardStats["recentActivity"] = [];
  for (const e of expenses) {
    for (const h of e.history || []) {
      recentActivity.push({
        expenseId: e.id,
        requesterName: e.requesterName,
        action: h.action,
        timestamp: h.timestamp,
        user: h.user,
      });
    }
  }
  recentActivity.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return {
    totalRequests: expenses.length,
    pendingApproval,
    pendingProcessing,
    processed,
    rejected,
    totalRequestedAmount: totalRequested,
    totalProcessedAmount: totalProcessed,
    byCategory,
    recentActivity: recentActivity.slice(0, 20),
  };
}
