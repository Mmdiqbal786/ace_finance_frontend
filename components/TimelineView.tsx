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
                    className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-zinc-800"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span
                      className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-zinc-900 text-xs ${
                        log.action.includes("Submitted")
                          ? "bg-zinc-800 text-zinc-400"
                          : log.action.includes("Rejected")
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          : log.action.includes("Approved")
                          ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
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
                    <p className="text-sm font-semibold text-zinc-100">{log.action}</p>
                    <div className="text-xs text-zinc-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1 mt-0.5">
                      <span>Logged by {log.user}</span>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {log.notes && (
                      <p className="mt-1 text-xs text-zinc-400 bg-zinc-950/50 p-2 rounded border border-zinc-800 font-sans italic">
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
