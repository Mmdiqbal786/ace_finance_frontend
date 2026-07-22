"use client";

import { useRef, useState } from "react";
import { toast } from "../../lib/toast";
import { copyPlainText } from "../../lib/demo-guide";
import { DOCS_GUIDE_BODY_HTML } from "../../lib/docs-guide-body";
import {
  DOCS_APP_URL,
  DOCS_DEMO_GUIDE_URL,
  normalizeDocsPlainText,
} from "../../lib/docs-guide";
import "./docs-guide.css";

/** Bump when screenshots are refreshed so browsers skip stale cached PNGs. */
const SCREENSHOT_CACHE_BUST = "20260722c";

const docsBodyHtml = DOCS_GUIDE_BODY_HTML.replace(
  /src="(\/docs-screenshots\/[^"?]+\.png)(?:\?[^"]*)?"/g,
  `src="$1?v=${SCREENSHOT_CACHE_BUST}"`
);

export default function DocsGuideContent() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [copying, setCopying] = useState(false);

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

  return (
    <div className="relative min-w-0 flex-1 overflow-x-hidden bg-[#e8edf4]">
      <div className="sticky top-0 z-40 border-b border-slate-600 bg-slate-900/95 shadow-sm backdrop-blur-md">
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
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1600px] px-2.5 py-3 sm:px-6 sm:py-7 lg:px-8">
        <div
          ref={contentRef}
          id="docs-content"
          className="docs-guide-body min-w-0 overflow-hidden rounded-xl border border-slate-400 bg-white shadow-xl sm:rounded-2xl"
          dangerouslySetInnerHTML={{ __html: docsBodyHtml }}
        />
      </div>
    </div>
  );
}
