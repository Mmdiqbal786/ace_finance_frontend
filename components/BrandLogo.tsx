"use client";

import Link from "next/link";

interface BrandLogoProps {
  href?: string;
  size?: "sm" | "md" | "lg";
  /** Show "Finance" next to Aceolution wordmark */
  showWordmark?: boolean;
  /** Use full Aceolution wordmark (Ace_logo) */
  full?: boolean;
  className?: string;
}

const iconSize = {
  sm: 28,
  md: 36,
  lg: 44,
} as const;

export default function BrandLogo({
  href,
  size = "md",
  showWordmark = true,
  full = false,
  className = "",
}: BrandLogoProps) {
  const px = iconSize[size];

  const mark = full ? (
    <span className="inline-flex min-w-0 items-center gap-2">
      <img
        src="/Ace_logo_light.png"
        alt="Aceolution"
        width={220}
        height={50}
        className="h-9 w-auto max-w-[min(55vw,230px)] object-contain object-left sm:h-10"
      />
      {showWordmark && (
        <span className="hidden truncate text-base font-bold tracking-tight text-[var(--af-accent)] sm:inline sm:text-lg">
          Finance
        </span>
      )}
    </span>
  ) : (
    <span className="inline-flex items-center gap-2.5 min-w-0">
      <img
        src="/Ace_logo_small_light.png"
        alt="Aceolution"
        width={px}
        height={px}
        className="object-contain shrink-0"
        style={{ width: px, height: px }}
      />
      {showWordmark && (
        <span className="truncate text-base sm:text-lg font-bold tracking-tight text-slate-900">
          Aceolution <span className="text-[var(--af-accent)]">Finance</span>
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`inline-flex min-w-0 items-center transition-opacity hover:opacity-90 ${className}`}
      >
        {mark}
      </Link>
    );
  }

  return <span className={`inline-flex min-w-0 items-center ${className}`}>{mark}</span>;
}
