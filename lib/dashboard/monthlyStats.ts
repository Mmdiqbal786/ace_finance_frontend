import { Expense } from "./types";

export interface MonthlyBucket {
  label: string;
  monthKey: string;
  requested: number;
  paid: number;
  submissionCount: number;
  processedCount: number;
}

export interface CurrentMonthStats {
  label: string;
  requested: number;
  paid: number;
  submissions: number;
  processed: number;
  pending: number;
  rejected: number;
}

function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function buildMonthlyStats(expenses: Expense[], months = 6): MonthlyBucket[] {
  const now = new Date();
  const buckets: MonthlyBucket[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      label: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      monthKey: toMonthKey(date),
      requested: 0,
      paid: 0,
      submissionCount: 0,
      processedCount: 0,
    });
  }

  expenses.forEach((expense) => {
    const submitted = new Date(expense.submittedAt);
    const key = toMonthKey(submitted);
    const bucket = buckets.find((item) => item.monthKey === key);
    if (!bucket) return;

    bucket.requested += expense.amount;
    bucket.submissionCount += 1;

    if (expense.status === "PROCESSED") {
      bucket.paid += expense.amount;
      bucket.processedCount += 1;
    }
  });

  return buckets;
}

export function getCurrentMonthStats(expenses: Expense[]): CurrentMonthStats {
  const now = new Date();
  const key = toMonthKey(now);
  const label = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const monthExpenses = expenses.filter(
    (expense) => toMonthKey(new Date(expense.submittedAt)) === key
  );

  return {
    label,
    requested: monthExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    paid: monthExpenses
      .filter((expense) => expense.status === "PROCESSED")
      .reduce((sum, expense) => sum + expense.amount, 0),
    submissions: monthExpenses.length,
    processed: monthExpenses.filter((expense) => expense.status === "PROCESSED").length,
    pending: monthExpenses.filter(
      (expense) =>
        expense.status === "PENDING_APPROVER" || expense.status === "APPROVED_APPROVER"
    ).length,
    rejected: monthExpenses.filter(
      (expense) =>
        expense.status === "REJECTED_APPROVER" || expense.status === "REJECTED_PROCESSOR"
    ).length,
  };
}

export function getCurrentMonthByCategory(expenses: Expense[]): Record<string, number> {
  const now = new Date();
  const key = toMonthKey(now);
  const byCategory: Record<string, number> = {};

  expenses.forEach((expense) => {
    if (toMonthKey(new Date(expense.submittedAt)) !== key) return;
    byCategory[expense.category] = (byCategory[expense.category] || 0) + expense.amount;
  });

  return byCategory;
}

export function getMonthOverMonthChange(expenses: Expense[]): {
  requestedChange: number | null;
  paidChange: number | null;
  submissionsChange: number | null;
} {
  const trend = buildMonthlyStats(expenses, 2);
  if (trend.length < 2) {
    return { requestedChange: null, paidChange: null, submissionsChange: null };
  }

  const [lastMonth, thisMonth] = trend;
  const pct = (current: number, previous: number) =>
    previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100;

  return {
    requestedChange: pct(thisMonth.requested, lastMonth.requested),
    paidChange: pct(thisMonth.paid, lastMonth.paid),
    submissionsChange: pct(thisMonth.submissionCount, lastMonth.submissionCount),
  };
}
