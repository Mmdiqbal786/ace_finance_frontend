import type { Expense, HistoryLog } from "./types";

export interface PaymentSnapshot {
  paymentAmount?: number;
  totalPaid?: number;
  remaining?: number;
}

export interface PaymentHistoryEntry {
  requestId: string;
  requesterName: string;
  paymentNumber: number;
  paymentType: "Partial" | "Full";
  timestamp: string;
  paymentAmount: number;
  totalPaidAfter: number;
  remainingAfter: number;
  notes: string;
  loggedBy: string;
}

function isPaymentAction(action: string): boolean {
  return action.includes("Partially Paid") || action.includes("Processed & Paid");
}

function paymentTypeFromLog(action: string, remaining?: number): "Partial" | "Full" {
  if (action.includes("Processed & Paid") && (remaining == null || remaining <= 0)) {
    return "Full";
  }
  return action.includes("Partially Paid") ? "Partial" : "Full";
}

/** Parse legacy payment amounts embedded in history notes (pre-structured fields). */
export function parsePaymentFromNotes(
  action: string,
  notes?: string,
): PaymentSnapshot | null {
  if (!notes) return null;
  const isPayment =
    action.includes("Partially Paid") || action.includes("Processed & Paid");
  if (!isPayment) return null;

  const partialMatch = notes.match(
    /Partial payment of \$([\d.]+)\.\s*Paid \$([\d.]+) of \$([\d.]+)\.\s*Remaining \$([\d.]+)/i,
  );
  if (partialMatch) {
    return {
      paymentAmount: Number(partialMatch[1]),
      totalPaid: Number(partialMatch[2]),
      remaining: Number(partialMatch[4]),
    };
  }

  const finalPartialMatch = notes.match(
    /Final partial payment of \$([\d.]+)\.\s*Fully paid \$([\d.]+)/i,
  );
  if (finalPartialMatch) {
    return {
      paymentAmount: Number(finalPartialMatch[1]),
      totalPaid: Number(finalPartialMatch[2]),
      remaining: 0,
    };
  }

  const payoutMatch = notes.match(/Final payout \$([\d.]+)/i);
  if (payoutMatch && action.includes("Processed & Paid")) {
    const paymentAmount = Number(payoutMatch[1]);
    return {
      paymentAmount,
      remaining: 0,
    };
  }

  return null;
}

export function getHistoryPaymentDetails(log: HistoryLog): PaymentSnapshot | null {
  if (
    log.paymentAmount != null ||
    log.totalPaid != null ||
    log.remaining != null
  ) {
    return {
      paymentAmount: log.paymentAmount,
      totalPaid: log.totalPaid,
      remaining: log.remaining,
    };
  }
  return parsePaymentFromNotes(log.action, log.notes);
}

/** All partial / full payout steps from expense workflow history (chronological). */
export function getExpensePaymentHistory(expense: Expense): PaymentHistoryEntry[] {
  const entries: PaymentHistoryEntry[] = [];
  let paymentNumber = 0;

  for (const log of expense.history || []) {
    if (!isPaymentAction(log.action)) continue;

    const details = getHistoryPaymentDetails(log);
    if (details?.paymentAmount == null) continue;

    paymentNumber += 1;
    entries.push({
      requestId: expense.id,
      requesterName: expense.requesterName,
      paymentNumber,
      paymentType: paymentTypeFromLog(log.action, details.remaining),
      timestamp: log.timestamp,
      paymentAmount: details.paymentAmount,
      totalPaidAfter: details.totalPaid ?? details.paymentAmount,
      remainingAfter: details.remaining ?? 0,
      notes: log.notes || "",
      loggedBy: log.user,
    });
  }

  return entries;
}

export function formatPaymentHistorySummary(entries: PaymentHistoryEntry[]): string {
  if (entries.length === 0) return "";

  return entries
    .map((entry) => {
      const when = new Date(entry.timestamp).toLocaleString();
      const type = entry.paymentType === "Full" ? "Full payment" : "Partial payment";
      const lines = [
        `Payment #${entry.paymentNumber} (${type})`,
        `Date: ${when}`,
        `Paid: $${entry.paymentAmount.toFixed(2)} · Total: $${entry.totalPaidAfter.toFixed(2)} · Remaining: $${entry.remainingAfter.toFixed(2)}`,
      ];
      if (entry.notes) {
        lines.push(`Note: ${entry.notes}`);
      }
      return lines.join("\n");
    })
    .join("\n\n");
}

export function getAllPaymentHistory(rows: Expense[]): PaymentHistoryEntry[] {
  return rows.flatMap((expense) => getExpensePaymentHistory(expense));
}
