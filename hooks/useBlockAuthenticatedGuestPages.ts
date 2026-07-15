"use client";

import { useEffect, useState } from "react";
import { getUser, isAuthenticated } from "../lib/auth";
import { getDefaultDashboardRoute } from "../lib/dashboard/routes";

/**
 * When the user already has a session, send them to the dashboard
 * so public/guest pages (home, login) are not accessible.
 */
export function useBlockAuthenticatedGuestPages() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      const user = getUser();
      window.location.replace(user ? getDefaultDashboardRoute(user.role) : "/dashboard/");
      return;
    }
    setAllowed(true);
  }, []);

  return allowed;
}
