import React from "react";

export type AppIconName =
  | "home"
  | "document"
  | "clipboard"
  | "shield"
  | "money"
  | "users"
  | "tag"
  | "folder"
  | "globe"
  | "chart"
  | "card"
  | "clock"
  | "calendar"
  | "blocked"
  | "check"
  | "cross"
  | "undo"
  | "party"
  | "balloon"
  | "coin"
  | "crown"
  | "eye"
  | "edit"
  | "trash"
  | "inbox"
  | "circle"
  | "profile"
  | "logout"
  | "menu"
  | "warning"
  | "search"
  | "signal"
  | "close"
  | "info"
  | "dot";

type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_CLASS: Record<IconSize, string> = {
  xs: "h-3.5 w-3.5",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
};

/** Colored SVG icons — consistent look across every browser. */
const TONE: Record<AppIconName, string> = {
  home: "#0ea5e9",
  document: "#8b5cf6",
  clipboard: "#6366f1",
  shield: "#0284c7",
  money: "#059669",
  users: "#4f46e5",
  tag: "#d97706",
  folder: "#ca8a04",
  globe: "#0d9488",
  chart: "#2563eb",
  card: "#0891b2",
  clock: "#f59e0b",
  calendar: "#ea580c",
  blocked: "#e11d48",
  check: "#10b981",
  cross: "#f43f5e",
  undo: "#f97316",
  party: "#ec4899",
  balloon: "#a855f7",
  coin: "#d97706",
  crown: "#f59e0b",
  eye: "#64748b",
  edit: "#0284c7",
  trash: "#e11d48",
  inbox: "#64748b",
  circle: "#94a3b8",
  profile: "#6366f1",
  logout: "#e11d48",
  menu: "#334155",
  warning: "#f59e0b",
  search: "#0284c7",
  signal: "#64748b",
  close: "#64748b",
  info: "#0284c7",
  dot: "#e11d48",
};

interface AppIconProps {
  name: AppIconName;
  size?: IconSize;
  className?: string;
  /** Override default color (CSS color / currentColor). */
  color?: string;
  title?: string;
}

function Svg({
  children,
  className,
  color,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  color: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      className={className}
      style={{ color }}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/** Stroke icon helper */
function Path({ d, strokeWidth = 1.8 }: { d: string; strokeWidth?: number }) {
  return (
    <path
      d={d}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

export default function AppIcon({
  name,
  size = "md",
  className = "",
  color,
  title,
}: AppIconProps) {
  const tone = color || TONE[name];
  const cls = `${SIZE_CLASS[size]} shrink-0 ${className}`.trim();

  switch (name) {
    case "home":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 01-1.5 1.5H15v-6H9v6H4.5A1.5 1.5 0 013 20V10.5z" />
        </Svg>
      );
    case "document":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M7 3.5h7l4 4V20a1.5 1.5 0 01-1.5 1.5H7A1.5 1.5 0 015.5 20V5A1.5 1.5 0 017 3.5z" />
          <Path d="M14 3.5V8h4.5M9 12h6M9 16h6" />
        </Svg>
      );
    case "clipboard":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M9 4.5h6a1 1 0 011 1V6h1.5A1.5 1.5 0 0119 7.5v12A1.5 1.5 0 0117.5 21h-11A1.5 1.5 0 015 19.5v-12A1.5 1.5 0 016.5 6H8V5.5a1 1 0 011-1z" />
          <Path d="M9 4.5a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0115 4.5V6H9V4.5zM9 12h6M9 16h4" />
        </Svg>
      );
    case "shield":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M12 3l8 3.5v5.2c0 4.6-3.2 8.7-8 9.8-4.8-1.1-8-5.2-8-9.8V6.5L12 3z" />
          <Path d="M9.5 12.2l1.8 1.8 3.4-3.6" />
        </Svg>
      );
    case "money":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M4 8.5A2.5 2.5 0 016.5 6h11A2.5 2.5 0 0120 8.5v7A2.5 2.5 0 0117.5 18h-11A2.5 2.5 0 014 15.5v-7z" />
          <Path d="M12 9v6M9.5 10.5c.4-.7 1.2-1.1 2.5-1.1 1.5 0 2.5.7 2.5 1.8s-1 1.7-2.5 1.7-2.5.6-2.5 1.7c0 1.1 1.1 1.9 2.7 1.9 1.3 0 2.1-.4 2.5-1.1" />
        </Svg>
      );
    case "users":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M16 19v-1.2a3.3 3.3 0 00-3.3-3.3H7.3A3.3 3.3 0 004 17.8V19" />
          <Path d="M10.5 11.2a3.1 3.1 0 100-6.2 3.1 3.1 0 000 6.2z" />
          <Path d="M20 19v-1.1a2.8 2.8 0 00-2.1-2.7M16.2 5.3a2.7 2.7 0 010 5.2" />
        </Svg>
      );
    case "tag":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M3.5 12.5V5.8A1.8 1.8 0 015.3 4h6.7L20.5 12.5 12.5 20.5 3.5 12.5z" />
          <circle cx="8.2" cy="8.2" r="1.2" fill="currentColor" />
        </Svg>
      );
    case "folder":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M3.5 7.5A2 2 0 015.5 5.5h4l2 2h7A2 2 0 0120.5 9.5v8a2 2 0 01-2 2h-13a2 2 0 01-2-2v-10z" />
        </Svg>
      );
    case "globe":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
          <Path d="M3.5 12h17M12 3c2.5 2.8 3.8 5.8 3.8 9S14.5 18.2 12 21c-2.5-2.8-3.8-5.8-3.8-9S9.5 5.8 12 3z" />
        </Svg>
      );
    case "chart":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M4 19.5h16M7 16.5v-5M12 16.5V8M17 16.5v-8.5" />
        </Svg>
      );
    case "card":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M3.5 8.5A2.5 2.5 0 016 6h12a2.5 2.5 0 012.5 2.5v7A2.5 2.5 0 0118 18H6a2.5 2.5 0 01-2.5-2.5v-7z" />
          <Path d="M3.5 10.5h17M7 14.5h3" />
        </Svg>
      );
    case "clock":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
          <Path d="M12 7.5V12l3 2" />
        </Svg>
      );
    case "calendar":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M5 6.5A1.5 1.5 0 016.5 5h11A1.5 1.5 0 0119 6.5v12a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 015 18.5v-12z" />
          <Path d="M8 3.5V6M16 3.5V6M5 9.5h14" />
        </Svg>
      );
    case "blocked":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
          <Path d="M7.2 7.2l9.6 9.6" />
        </Svg>
      );
    case "check":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
          <Path d="M8.5 12.2l2.4 2.4 4.6-4.8" />
        </Svg>
      );
    case "cross":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
          <Path d="M9 9l6 6M15 9l-6 6" />
        </Svg>
      );
    case "undo":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M9 8H5V4" />
          <Path d="M5 8a8 8 0 118 8" />
        </Svg>
      );
    case "party":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M6 20l3.2-8.5L14.5 14 6 20z" />
          <Path d="M12 4.5l.6 1.8 1.9.2-1.4 1.2.5 1.8L12 8.6l-1.6.9.5-1.8-1.4-1.2 1.9-.2.6-1.8zM17.5 8l.4 1.2 1.3.1-1 .8.3 1.2-1-.6-1 .6.3-1.2-1-.8 1.3-.1.4-1.2z" />
        </Svg>
      );
    case "balloon":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M12 3.5c3 0 5.2 2.4 5.2 5.5 0 3.5-2.8 6.5-5.2 8.5-2.4-2-5.2-5-5.2-8.5 0-3.1 2.2-5.5 5.2-5.5z" />
          <Path d="M12 17.5v3.5M10.5 21h3" />
        </Svg>
      );
    case "coin":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
          <Path d="M12 8v8M9.8 10.2c.5-.8 1.4-1.2 2.4-1.2 1.4 0 2.4.7 2.4 1.8s-1 1.6-2.4 1.6-2.4.6-2.4 1.7c0 1.1 1.1 1.9 2.6 1.9 1.1 0 2-.4 2.4-1.1" />
        </Svg>
      );
    case "crown":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M4 17.5h16l-1.2-9.5L15 12l-3-6.5L9 12 5.2 8 4 17.5z" />
          <Path d="M5 19.5h14" />
        </Svg>
      );
    case "eye":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" />
          <Path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
        </Svg>
      );
    case "edit":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M4.5 19.5h4L19.5 8.5 15.5 4.5 4.5 15.5v4z" />
          <Path d="M13.2 6.8l4 4" />
        </Svg>
      );
    case "trash":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M5 8h14M9.5 8V5.5h5V8M7.5 8l.8 11h7.4l.8-11" />
        </Svg>
      );
    case "inbox":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M4 13.5l2.2-7A1.5 1.5 0 017.6 5.5h8.8A1.5 1.5 0 0117.8 6.5l2.2 7V18a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 18v-4.5z" />
          <Path d="M4 13.5h4.2l1.3 2h5l1.3-2H20" />
        </Svg>
      );
    case "circle":
      return (
        <Svg className={cls} color={tone} title={title}>
          <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth={1.8} />
        </Svg>
      );
    case "dot":
      return (
        <Svg className={cls} color={tone} title={title}>
          <circle cx="12" cy="12" r="5" fill="currentColor" />
        </Svg>
      );
    case "profile":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M12 12.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" />
          <Path d="M5 19.5c1.8-3 4.1-4.5 7-4.5s5.2 1.5 7 4.5" />
        </Svg>
      );
    case "logout":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M10 4.5H6.5A2 2 0 004.5 6.5v11A2 2 0 006.5 19.5H10" />
          <Path d="M14 12H21M18 8.5L21.5 12 18 15.5" />
        </Svg>
      );
    case "menu":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M4.5 7h15M4.5 12h15M4.5 17h15" />
        </Svg>
      );
    case "warning":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M12 4.5L21 19.5H3L12 4.5z" />
          <Path d="M12 10v4.5M12 17.2h.01" />
        </Svg>
      );
    case "search":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M11 18.5a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
          <Path d="M16.5 16.5L21 21" />
        </Svg>
      );
    case "signal":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M5 18.5v-3M9.5 18.5v-6M14 18.5V8M18.5 18.5V5.5" />
        </Svg>
      );
    case "close":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
        </Svg>
      );
    case "info":
      return (
        <Svg className={cls} color={tone} title={title}>
          <Path d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
          <Path d="M12 10.5V16.5M12 7.5h.01" />
        </Svg>
      );
    default:
      return null;
  }
}
