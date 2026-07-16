"use client";

import { ReactNode } from "react";
import { useBlockAuthenticatedGuestPages } from "../hooks/useBlockAuthenticatedGuestPages";
import FullPageLoader from "./FullPageLoader";

interface GuestPageGateProps {
  children: ReactNode;
  loaderMessage?: string;
}

/** Renders children only for guests; redirects signed-in users to the dashboard. */
export default function GuestPageGate({
  children,
  loaderMessage = "Checking session...",
}: GuestPageGateProps) {
  const guestAllowed = useBlockAuthenticatedGuestPages();

  if (!guestAllowed) {
    return <FullPageLoader message={loaderMessage} />;
  }

  return <>{children}</>;
}
