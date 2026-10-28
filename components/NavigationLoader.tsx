"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import FullPageLoader from "./FullPageLoader";

const MIN_VISIBLE_MS = 320;

function sameAppUrl(href: string): { pathname: string; search: string } | null {
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return { pathname: url.pathname, search: url.search };
  } catch {
    return null;
  }
}

function NavigationLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : "";
  const [visible, setVisible] = useState(false);
  const shownAt = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeKey = `${pathname}${search}`;
  const prevRoute = useRef(routeKey);

  function clearHideTimer() {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }

  function showLoader() {
    clearHideTimer();
    shownAt.current = Date.now();
    setVisible(true);
  }

  function hideLoaderSoon() {
    clearHideTimer();
    const elapsed = Date.now() - shownAt.current;
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      hideTimer.current = null;
    }, wait);
  }

  // Show as soon as an in-app link is clicked (before the route settles).
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as Element | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const rel = (anchor.getAttribute("rel") || "").toLowerCase();
      if (rel.includes("external")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      const next = sameAppUrl(href);
      if (!next) return;

      const currentPath = window.location.pathname;
      const currentSearch = window.location.search;
      if (next.pathname === currentPath && next.search === currentSearch) return;

      showLoader();
    }

    function onPopState() {
      showLoader();
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  // Hide after the new route is active.
  useEffect(() => {
    if (prevRoute.current === routeKey) return;
    prevRoute.current = routeKey;
    if (visible) hideLoaderSoon();
    else setVisible(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to route changes
  }, [routeKey]);

  useEffect(() => () => clearHideTimer(), []);

  if (!visible) return null;
  return <FullPageLoader message="Loading Aceolution Finance..." />;
}

/** Full-page loader on in-app page changes (sidebar, header, breadcrumbs, etc.). */
export default function NavigationLoader() {
  return (
    <Suspense fallback={null}>
      <NavigationLoaderInner />
    </Suspense>
  );
}
