"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function DashboardScrollLock() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (isDashboard) {
      root.style.overflow = "hidden";
      body.style.overflow = "hidden";
      body.style.height = "100dvh";
    } else {
      root.style.overflow = "";
      body.style.overflow = "";
      body.style.height = "";
    }

    return () => {
      root.style.overflow = "";
      body.style.overflow = "";
      body.style.height = "";
    };
  }, [isDashboard]);

  return null;
}
