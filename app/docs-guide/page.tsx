"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DocsGuideContent from "../../components/docs-guide/DocsGuideContent";

const GATE_KEY = "ace_demo_guide_unlocked";

export default function DocsGuidePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(GATE_KEY) === "1") {
        setUnlocked(true);
        setChecking(false);
        return;
      }
    } catch {
      // ignore
    }
    router.replace("/demo-guide/");
  }, [router]);

  if (checking || !unlocked) {
    return (
      <div className="portal-page relative flex min-h-[70vh] flex-1 items-center justify-center p-4">
        <p className="text-sm font-semibold text-slate-600">Loading…</p>
      </div>
    );
  }

  return <DocsGuideContent />;
}
