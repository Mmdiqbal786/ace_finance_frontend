"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "../../lib/toast";
import { copyPlainText, lockDemoGuideAccess } from "../../lib/demo-guide";
import { DOCS_GUIDE_BODY_HTML } from "../../lib/docs-guide-body";
import {
  DOCS_APP_URL,
  DOCS_DEMO_GUIDE_URL,
  normalizeDocsPlainText,
} from "../../lib/docs-guide";
import { downloadSopPptx } from "../../lib/build-sop-pptx";
import GuideActionBar, { type GuideActionItem } from "../guide/GuideActionBar";
import GuideJumpBar, { useGuideHashJumps } from "../guide/GuideJumpBar";
import FullPageLoader from "../FullPageLoader";
import "./docs-guide.css";

/** Bump when screenshots are refreshed so browsers skip stale cached PNGs. */
const SCREENSHOT_CACHE_BUST = "20261028d";

const docsBodyHtml = DOCS_GUIDE_BODY_HTML.replace(
  /src="(\/docs-screenshots\/[^"?]+\.png)(?:\?[^"]*)?"/g,
  `src="$1?v=${SCREENSHOT_CACHE_BUST}"`
);

/** Sticky jump chips — exact hrefs matching section ids in docs-guide-body. */
const DOCS_JUMP_CHIPS = [
  { href: "#architecture", label: "0. Architecture" },
  { href: "#status", label: "1. Status" },
  { href: "#login", label: "2. Login" },
  { href: "#requester", label: "3. Requester" },
  { href: "#duplicates", label: "3a. Duplicates" },
  { href: "#approver", label: "4. Approver" },
  { href: "#processor", label: "5. Processor" },
  { href: "#analytics", label: "6. Analytics" },
  { href: "#profile", label: "7. Profile" },
  { href: "#admin", label: "8. Admin" },
  { href: "#emails", label: "9. Emails" },
  { href: "#roles", label: "10. Roles" },
  { href: "#errors-gallery", label: "11. Validation" },
] as const;

export default function DocsGuideContent() {
  const contentRef = useRef<HTMLDivElement>(null);
  const topBarRef = useRef<HTMLDivElement>(null);
  const [copying, setCopying] = useState(false);
  const [buildingPptx, setBuildingPptx] = useState(false);
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
      toast.success("Plain text copied — paste in Teams (Ctrl+Shift+V)");
    } catch {
      toast.error("Copy failed — try again");
    } finally {
      setCopying(false);
    }
  }

  async function handleDownloadPptx() {
    setBuildingPptx(true);
    try {
      await downloadSopPptx();
      toast.success("Full SOP PowerPoint downloaded — Aceolution-Finance-SOP.pptx");
    } catch {
      toast.error("PowerPoint download failed — try again (large deck may need a moment)");
    } finally {
      setBuildingPptx(false);
    }
  }

  const busy = copying || buildingPptx;

  const actions: GuideActionItem[] = [
    {
      id: "copy",
      label: "Copy documentation (Teams text)",
      busyLabel: "Copying…",
      busy: copying,
      disabled: busy,
      onClick: () => void handleCopy(),
      tone: "sky",
    },
    {
      id: "present",
      label: "Present SOP",
      href: "/docs-guide/present/",
      tone: "indigo",
    },
    {
      id: "pptx",
      label: "Download PowerPoint",
      busyLabel: "Building full SOP PPTX…",
      busy: buildingPptx,
      disabled: busy,
      onClick: () => void handleDownloadPptx(),
      tone: "emerald",
    },
    {
      id: "architecture",
      label: "Open Architecture",
      href: "/architecture/",
      tone: "amber",
    },
    {
      id: "demo",
      label: "Back to demo guide",
      href: DOCS_DEMO_GUIDE_URL,
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
      {buildingPptx ? <FullPageLoader message="Building PowerPoint..." /> : null}
      <GuideActionBar
        title="Full documentation"
        actions={actions}
        barRef={topBarRef}
        onLayoutChange={measureTopBar}
      />

      <GuideJumpBar items={DOCS_JUMP_CHIPS} />

      <div style={{ height: topBarH + 44 }} aria-hidden />

      <div className="mx-auto w-full max-w-[1600px] px-2.5 py-3 sm:px-6 sm:py-7 lg:px-8">
        <div
          ref={contentRef}
          id="docs-content"
          className="docs-guide-body min-w-0 overflow-x-clip rounded-xl border border-slate-400 bg-white shadow-xl sm:rounded-2xl"
          dangerouslySetInnerHTML={{ __html: docsBodyHtml }}
        />
      </div>
    </div>
  );
}
