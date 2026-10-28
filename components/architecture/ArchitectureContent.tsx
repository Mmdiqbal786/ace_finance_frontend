"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "../../lib/toast";
import { copyPlainText, lockDemoGuideAccess } from "../../lib/demo-guide";
import { ARCHITECTURE_PAGE_BODY_HTML } from "../../lib/architecture-body";
import { DOCS_APP_URL, normalizeDocsPlainText } from "../../lib/docs-guide";
import GuideActionBar, { type GuideActionItem } from "../guide/GuideActionBar";
import GuideJumpBar, { useGuideHashJumps } from "../guide/GuideJumpBar";
import "../docs-guide/docs-guide.css";

const ARCH_JUMP_CHIPS = [
  { href: "#hosting", label: "Hosting" },
  { href: "#stores", label: "Live / Demo" },
  { href: "#signin", label: "Sign-in" },
  { href: "#duplicates", label: "Duplicates" },
  { href: "#roles", label: "Roles" },
  { href: "#vapt", label: "VAPT" },
  { href: "#repo", label: "PDF / repo" },
] as const;

export default function ArchitectureContent() {
  const contentRef = useRef<HTMLDivElement>(null);
  const topBarRef = useRef<HTMLDivElement>(null);
  const [copying, setCopying] = useState(false);
  const [topBarH, setTopBarH] = useState(68);

  useGuideHashJumps(contentRef);

  function handleExitAccess() {
    lockDemoGuideAccess();
    window.location.assign("/demo-guide/");
  }

  const measureTopBar = useCallback(() => {
    const h = topBarRef.current?.offsetHeight || 68;
    setTopBarH(h);
    const topEdge = topBarRef.current?.getBoundingClientRect().bottom || h;
    document.documentElement.style.setProperty("--guide-topbar-h", `${topEdge}px`);
  }, []);

  useEffect(() => {
    measureTopBar();
    const raf = requestAnimationFrame(measureTopBar);
    window.addEventListener("resize", measureTopBar);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measureTopBar);
    };
  }, [measureTopBar]);

  async function handleCopy() {
    setCopying(true);
    try {
      const raw =
        contentRef.current?.innerText || contentRef.current?.textContent || "";
      await copyPlainText(normalizeDocsPlainText(raw));
      toast.success("Architecture text copied — paste in Teams (Ctrl+Shift+V)");
    } catch {
      toast.error("Copy failed — try again");
    } finally {
      setCopying(false);
    }
  }

  const actions: GuideActionItem[] = [
    {
      id: "copy",
      label: "Copy architecture (Teams text)",
      busyLabel: "Copying…",
      busy: copying,
      disabled: copying,
      onClick: () => void handleCopy(),
      tone: "sky",
    },
    {
      id: "docs",
      label: "Open full documentation",
      href: "/docs-guide/",
      tone: "indigo",
    },
    {
      id: "demo",
      label: "Back to demo guide",
      href: "/demo-guide/",
      tone: "outline",
    },
    {
      id: "app",
      label: "Open App",
      href: DOCS_APP_URL,
      external: true,
      tone: "outline",
    },
    {
      id: "exit",
      label: "Exit access",
      onClick: handleExitAccess,
      tone: "danger",
    },
  ];

  return (
    <div className="relative min-w-0 flex-1 bg-[#e8edf4]">
      <GuideActionBar
        title="Architecture"
        actions={actions}
        barRef={topBarRef}
        onLayoutChange={measureTopBar}
      />

      <GuideJumpBar items={ARCH_JUMP_CHIPS} />

      <div style={{ height: topBarH + 44 }} aria-hidden />

      <div className="mx-auto w-full max-w-[1100px] px-2.5 py-3 sm:px-6 sm:py-7 lg:px-8">
        <div
          ref={contentRef}
          id="architecture-content"
          className="docs-guide-body min-w-0 overflow-x-clip rounded-xl border border-slate-400 bg-white shadow-xl sm:rounded-2xl"
          dangerouslySetInnerHTML={{ __html: ARCHITECTURE_PAGE_BODY_HTML }}
        />
      </div>
    </div>
  );
}
