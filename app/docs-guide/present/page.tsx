"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SopPresentation from "../../../components/docs-guide/SopPresentation";
import FullPageLoader from "../../../components/FullPageLoader";
import { isDemoGuideUnlocked } from "../../../lib/demo-guide";

export default function DocsGuidePresentPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (isDemoGuideUnlocked()) {
      setUnlocked(true);
      setChecking(false);
      return;
    }
    router.replace("/demo-guide/");
  }, [router]);

  if (checking || !unlocked) {
    return <FullPageLoader message="Loading Aceolution Finance..." />;
  }

  return <SopPresentation />;
}
