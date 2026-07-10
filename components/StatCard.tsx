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
  valueColor = "text-white",
}: StatCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden shadow-sm">
      <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">
        {title}
      </span>
      <div className={`mt-2 text-2xl font-black ${valueColor}`}>{value}</div>
      <div className="text-[10px] text-zinc-400 mt-1">{subtext}</div>
      <div className="absolute top-4 right-4 text-zinc-800/40 select-none font-bold text-3xl">
        {emoji}
      </div>
    </div>
  );
}
