import React from "react";

interface HistoryLog {
  action: string;
  timestamp: string;
  user: string;
  notes?: string;
}

interface TimelineViewProps {
  history: HistoryLog[];
  maxHeightClass?: string;
}

export default function TimelineView({
  history,
  maxHeightClass = "max-h-56 overflow-y-auto pr-1",
}: TimelineViewProps) {
  return (
    <div className="flow-root">
      <div className={maxHeightClass}>
        <ul role="list" className="-mb-8">
          {history.map((log, logIdx) => (
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
                      className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white text-xs ${
                        log.action.includes("Submitted")
                          ? "bg-slate-100 text-slate-500"
                          : log.action.includes("Rejected")
                          ? "bg-rose-50 text-rose-600 border border-rose-200"
                          : log.action.includes("Approved")
                          ? "bg-sky-50 text-[var(--af-accent)] border border-sky-200"
                          : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      }`}
                    >
                      {log.action.includes("Submitted")
                        ? "📥"
                        : log.action.includes("Approved")
                        ? "✅"
                        : log.action.includes("Rejected")
                        ? "❌"
                        : "💸"}
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
                    {log.notes && (
                      <p className="mt-1 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 font-sans italic">
                        Notes: "{log.notes}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
