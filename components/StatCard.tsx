import React from "react";

interface StatCardProps {
  title: string;
  value: string;
  subtext: string;
  emoji: string;
  valueColor?: string;
}

export default function StatCard({
  title,
  value,
  subtext,
  emoji,
  valueColor = "text-slate-900",
}: StatCardProps) {
  return (
    <div className="portal-card rounded-2xl p-4 sm:p-5 relative overflow-hidden">
      <span className="text-xs uppercase font-bold tracking-wider text-slate-700 block pr-10 leading-snug">
        {title}
      </span>
      <div className={`mt-2 text-2xl sm:text-3xl font-black ${valueColor}`}>{value}</div>
      <div className="text-xs text-slate-600 mt-1.5 pr-8 leading-relaxed">{subtext}</div>
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 text-slate-300 select-none font-bold text-2xl sm:text-3xl">
        {emoji}
      </div>
    </div>
  );
}
