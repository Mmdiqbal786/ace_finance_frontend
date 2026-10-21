"use client";

import type { Expense } from "../../lib/dashboard/types";

const REQUEST_REF = /\(Request (EXP-[^)\s]+)\)/;

/**
 * Soft-duplicate warning text. The other request id is a link only when that
 * expense is already in the viewer's accessible list (processor: all,
 * approver: assigned projects, requester: own). Otherwise the sentence stays
 * plain text.
 */
export default function DuplicateWarningMessage({
  reason,
  expenses,
  onOpen,
}: {
  reason: string;
  expenses: Expense[];
  onOpen?: (expense: Expense) => void;
}) {
  const match = reason.match(REQUEST_REF);
  const related = match ? expenses.find((expense) => expense.id === match[1]) : undefined;

  if (!match || !related || !onOpen) {
    return <>{reason}</>;
  }

  const start = match.index ?? 0;
  const before = reason.slice(0, start);
  const after = reason.slice(start + match[0].length);

  return (
    <>
      {before}
      (Request{" "}
      <button
        type="button"
        onClick={() => onOpen(related)}
        className="font-bold text-amber-950 underline decoration-amber-700/80 underline-offset-2 hover:text-[var(--af-navy)] cursor-pointer"
        title="Open this expense"
      >
        {related.id}
      </button>
      ){after}
    </>
  );
}
