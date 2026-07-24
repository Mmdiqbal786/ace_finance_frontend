"use client";

import { useCallback, useEffect, type MouseEvent, type RefObject } from "react";

export type GuideJumpItem = {
  href: string;
  label: string;
};

function fixedBarsHeight(): number {
  const jumpBar = document.querySelector(".guide-jumpbar") as HTMLElement | null;
  if (jumpBar) return jumpBar.getBoundingClientRect().bottom;
  const topBar = document.querySelector(".guide-topbar") as HTMLElement | null;
  return topBar?.getBoundingClientRect().bottom || 0;
}

/** Keep CSS scroll-margin in sync with live fixed bar heights. */
export function syncGuideScrollMargin() {
  const topBar = document.querySelector(".guide-topbar") as HTMLElement | null;
  /** Distance from viewport top to bottom of guide action bar (includes site header offset). */
  const topEdge = topBar?.getBoundingClientRect().bottom || 68;
  const h = fixedBarsHeight() + 16;
  document.documentElement.style.setProperty("--guide-scroll-margin", `${h}px`);
  document.documentElement.style.setProperty("--guide-topbar-h", `${topEdge}px`);
}

function getScrollParent(el: HTMLElement): HTMLElement | Window {
  let node: HTMLElement | null = el.parentElement;
  while (node && node !== document.body) {
    const style = getComputedStyle(node);
    const oy = style.overflowY;
    if ((oy === "auto" || oy === "scroll" || oy === "overlay") && node.scrollHeight > node.clientHeight + 1) {
      return node;
    }
    node = node.parentElement;
  }
  return window;
}

/**
 * Jump to a section id/hash. Retries if the target is not in the DOM yet.
 * Lands the section title below the fixed top + jump bars.
 */
export function jumpToGuideSection(hash: string, attempt = 0) {
  const id = decodeURIComponent(hash.replace(/^#/, "").trim());
  if (!id) return;

  const el = document.getElementById(id);
  if (!el) {
    if (attempt < 16) {
      window.setTimeout(() => jumpToGuideSection(hash, attempt + 1), 40);
    } else if (process.env.NODE_ENV !== "production") {
      console.warn(`[guide-jump] section not found: #${id}`);
    }
    return;
  }

  syncGuideScrollMargin();
  const offset = fixedBarsHeight() + 16;
  const scroller = getScrollParent(el);

  const scrollToY = (behavior: ScrollBehavior) => {
    if (scroller === window) {
      const y = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, y), behavior });
      return;
    }
    const box = scroller as HTMLElement;
    const elTop = el.getBoundingClientRect().top;
    const boxTop = box.getBoundingClientRect().top;
    const y = box.scrollTop + (elTop - boxTop) - offset;
    box.scrollTo({ top: Math.max(0, y), behavior });
  };

  scrollToY("smooth");

  // Snap-correct after smooth scroll / layout
  window.setTimeout(() => {
    const again = document.getElementById(id);
    if (!again) return;
    const fixOffset = fixedBarsHeight() + 16;
    if (scroller === window) {
      const y = again.getBoundingClientRect().top + window.scrollY - fixOffset;
      if (Math.abs(window.scrollY - y) > 6) {
        window.scrollTo({ top: Math.max(0, y), behavior: "auto" });
      }
    } else {
      scrollToY("auto");
    }
    again.setAttribute("data-guide-jump-active", "1");
    window.setTimeout(() => again.removeAttribute("data-guide-jump-active"), 1400);
  }, 420);

  try {
    history.replaceState(null, "", `#${id}`);
  } catch {
    // ignore
  }
}

/** Capture all in-page # links (Contents + Jump bar). */
export function useGuideHashJumps(_containerRef?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    syncGuideScrollMargin();

    function onClick(e: Event) {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href^='#']") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      // Only pure hash links: #section-id
      if (!/^#[A-Za-z][\w:-]*$/.test(href)) return;
      e.preventDefault();
      jumpToGuideSection(href);
    }

    document.addEventListener("click", onClick, true);

    function onHashChange() {
      if (window.location.hash) jumpToGuideSection(window.location.hash);
    }
    window.addEventListener("hashchange", onHashChange);

    function onResize() {
      syncGuideScrollMargin();
    }
    window.addEventListener("resize", onResize);

    if (window.location.hash) {
      window.setTimeout(() => jumpToGuideSection(window.location.hash), 150);
    }

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("resize", onResize);
    };
  }, []);
}

type Props = {
  items: readonly GuideJumpItem[];
};

export default function GuideJumpBar({ items }: Props) {
  const onJump = useCallback((e: MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    jumpToGuideSection(href);
  }, []);

  return (
    <div className="guide-jumpbar fixed inset-x-0 z-40 border-b border-slate-300 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-2 overflow-x-auto px-3 py-2 sm:px-6 lg:px-8">
        <span className="shrink-0 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
          Jump
        </span>
        <nav className="flex min-w-0 flex-1 items-center gap-1.5" aria-label="Page jump">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => onJump(e, item.href)}
              className="guide-jumpchip shrink-0 rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:border-[#1850a8] hover:bg-sky-50 hover:text-[#1850a8]"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
