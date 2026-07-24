"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "../../lib/toast";
import { copyPlainText, lockDemoGuideAccess } from "../../lib/demo-guide";
import { DOCS_GUIDE_BODY_HTML } from "../../lib/docs-guide-body";
import {
  DOCS_APP_URL,
  DOCS_DEMO_GUIDE_URL,
  normalizeDocsPlainText,
} from "../../lib/docs-guide";
import { downloadSopPptx } from "../../lib/build-sop-pptx";
import GuideJumpBar, { useGuideHashJumps } from "../guide/GuideJumpBar";
import "./docs-guide.css";

/** Bump when screenshots are refreshed so browsers skip stale cached PNGs. */
const SCREENSHOT_CACHE_BUST = "20260723a";

const docsBodyHtml = DOCS_GUIDE_BODY_HTML.replace(
  /src="(\/docs-screenshots\/[^"?]+\.png)(?:\?[^"]*)?"/g,
  `src="$1?v=${SCREENSHOT_CACHE_BUST}"`
);

/** Sticky jump chips — exact hrefs matching section ids in docs-guide-body. */
const DOCS_JUMP_CHIPS = [
  { href: "#status", label: "1. Status" },
  { href: "#login", label: "2. Login" },
  { href: "#requester", label: "3. Requester" },
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

  useEffect(() => {
    function measure() {
      const h = topBarRef.current?.offsetHeight || 68;
      setTopBarH(h);
      const topEdge = topBarRef.current?.getBoundingClientRect().bottom || h;
      document.documentElement.style.setProperty("--guide-topbar-h", `${topEdge}px`);
    }
    measure();
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, []);

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

  return (
    <div className="relative min-w-0 flex-1 bg-[#e8edf4]">
      <div
        ref={topBarRef}
        className="guide-topbar fixed inset-x-0 z-40 border-b border-slate-600 bg-slate-900/95 shadow-sm backdrop-blur-md"
        style={{ top: "var(--af-site-header-h, 0px)" }}
      >
        <div className="mx-auto grid w-full max-w-[1600px] grid-cols-2 gap-2 px-3 py-3 sm:flex sm:flex-wrap sm:justify-center sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={handleCopy}
            disabled={copying}
            className="col-span-2 inline-flex min-h-10 items-center justify-center rounded-[10px] bg-sky-300 px-3 py-2 text-center text-xs font-extrabold text-slate-900 hover:bg-sky-200 disabled:opacity-60 sm:col-auto sm:px-4 sm:text-[13px]"
          >
            {copying ? "Copying…" : "Copy documentation (Teams text)"}
          </button>
          <a
            href="/docs-guide/present/"
            className="inline-flex min-h-10 items-center justify-center rounded-[10px] bg-indigo-300 px-3 py-2 text-center text-xs font-extrabold text-slate-900 hover:bg-indigo-200 sm:px-4 sm:text-[13px]"
          >
            Present SOP
          </a>
          <button
            type="button"
            onClick={handleDownloadPptx}
            disabled={buildingPptx}
            className="inline-flex min-h-10 items-center justify-center rounded-[10px] bg-emerald-300 px-3 py-2 text-center text-xs font-extrabold text-slate-900 hover:bg-emerald-200 disabled:opacity-60 sm:px-4 sm:text-[13px]"
          >
            {buildingPptx ? "Building full SOP PPTX…" : "Download PowerPoint"}
          </button>
          <a
            href={DOCS_DEMO_GUIDE_URL}
            className="inline-flex min-h-10 items-center justify-center rounded-[10px] border-[1.5px] border-slate-400 px-3 py-2 text-center text-xs font-extrabold text-slate-200 hover:bg-slate-400/20 sm:px-4 sm:text-[13px]"
          >
            Back to demo guide
          </a>
          <a
            href={DOCS_APP_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center justify-center rounded-[10px] border-[1.5px] border-slate-400 px-3 py-2 text-center text-xs font-extrabold text-slate-200 hover:bg-slate-400/20 sm:px-4 sm:text-[13px]"
          >
            Open App
          </a>
          <button
            type="button"
            onClick={handleExitAccess}
            title="Lock guide access and return to the password screen"
            className="inline-flex min-h-10 items-center justify-center rounded-[10px] border-[1.5px] border-rose-400/80 bg-rose-500/20 px-3 py-2 text-center text-xs font-extrabold text-rose-100 hover:bg-rose-500/35 sm:px-4 sm:text-[13px]"
          >
            Exit access
          </button>
        </div>
      </div>

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
