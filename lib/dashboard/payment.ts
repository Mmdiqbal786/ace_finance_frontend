import { Expense } from "./types";

export function roundMoney(value: number): number {
  return Math.round(Number(value) * 100) / 100;
}

export function getPaidAmount(expense: Pick<Expense, "paidAmount">): number {
  return roundMoney(Number(expense.paidAmount || 0));
}

export function getRemainingAmount(expense: Pick<Expense, "amount" | "paidAmount">): number {
  return roundMoney(Math.max(0, Number(expense.amount) - getPaidAmount(expense)));
}

export function isProcessorQueueStatus(status: string): boolean {
  return status === "APPROVED_APPROVER" || status === "PARTIALLY_PAID";
}

export function isFullyPaid(expense: Pick<Expense, "status" | "amount" | "paidAmount">): boolean {
  if (expense.status === "PROCESSED") return true;
  return getPaidAmount(expense) > 0 && getRemainingAmount(expense) === 0;
}
