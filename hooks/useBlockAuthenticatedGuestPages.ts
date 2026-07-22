"use client";

import { useEffect, useState } from "react";
import { getUser, isAuthenticated, mustChangePassword } from "../lib/auth";
import { resolveAccessibleDashboardPath } from "../lib/dashboard/routes";

/**
 * When the user already has a session, send them to the dashboard
 * so public/guest pages (home, login) are not accessible.
 * Users who still need a password change go to /set-password.
 * Optional `next` is resolved against the signed-in role.
 */
export function useBlockAuthenticatedGuestPages(nextPath?: string | null) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      if (mustChangePassword()) {
        window.location.replace("/set-password/");
        return;
      }
      const user = getUser();
      window.location.replace(
        user
          ? resolveAccessibleDashboardPath(user.role, nextPath)
          : "/dashboard/"
      );
      return;
    }
    setAllowed(true);
  }, [nextPath]);

  return allowed;
}
