import React from "react";
import type { HistoryLog } from "../lib/dashboard/types";
import { getHistoryPaymentDetails } from "../lib/dashboard/historyPayment";

interface TimelineViewProps {
  history: HistoryLog[];
  maxHeightClass?: string;
}

function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

function getTimelineStyle(action: string) {
  if (action.includes("Submitted")) {
    return {
      bubble: "bg-slate-100 text-slate-500",
      icon: "📥",
    };
  }
  if (action.includes("Rejected")) {
    return {
      bubble: "bg-rose-50 text-rose-600 border border-rose-200",
      icon: "❌",
    };
  }
  if (action.includes("Approved")) {
    return {
      bubble: "bg-sky-50 text-[var(--af-accent)] border border-sky-200",
      icon: "✅",
    };
  }
  if (action.includes("Partially")) {
    return {
      bubble: "bg-amber-50 text-amber-700 border border-amber-200",
      icon: "🪙",
    };
  }
  return {
    bubble: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    icon: "💸",
  };
}

export default function TimelineView({
  history,
  maxHeightClass = "max-h-56 overflow-y-auto pr-1",
}: TimelineViewProps) {
  return (
    <div className="flow-root">
      <div className={maxHeightClass}>
        <ul role="list" className="-mb-8">
          {history.map((log, logIdx) => {
            const style = getTimelineStyle(log.action);
            const payment = getHistoryPaymentDetails(log);
            const showPayment = payment != null;

            return (
              <li key={logIdx}>
                <div className="relative pb-8">
                  {logIdx !== history.length - 1 ? (
                    <span
                      className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-slate-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span
                        className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white text-xs ${style.bubble}`}
                      >
                        {style.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{log.action}</p>
                      <div className="text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-1 mt-0.5">
                        <span>Logged by {log.user}</span>
                        <span className="text-xs text-slate-600">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>

                      {showPayment && payment && (
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-white p-2.5 text-xs">
                          {payment.paymentAmount != null && (
                            <div>
                              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                This payment
                              </span>
                              <span className="font-bold text-slate-900">
                                {formatUsd(payment.paymentAmount)}
                              </span>
                            </div>
                          )}
                          {payment.totalPaid != null && (
                            <div>
                              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Total paid
                              </span>
                              <span className="font-bold text-emerald-700">
                                {formatUsd(payment.totalPaid)}
                              </span>
                            </div>
                          )}
                          {payment.remaining != null && (
                            <div>
                              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Remaining
                              </span>
                              <span
                                className={`font-bold ${
                                  payment.remaining > 0 ? "text-amber-700" : "text-emerald-700"
                                }`}
                              >
                                {formatUsd(payment.remaining)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {log.notes && (
                        <p className="mt-1.5 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 font-sans italic">
                          Notes: &quot;{log.notes}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
