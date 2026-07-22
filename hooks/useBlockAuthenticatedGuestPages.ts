"use client";

import { useEffect, useState } from "react";
import { getUser, isAuthenticated, mustChangePassword, mustSetupTotp } from "../lib/auth";
import { getPostAuthDestination } from "../lib/auth";
import { resolveAccessibleDashboardPath } from "../lib/dashboard/routes";

/**
 * When the user already has a session, send them past guest pages
 * (home, login) using the same post-auth gate order as login.
 */
export function useBlockAuthenticatedGuestPages(nextPath?: string | null) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      const user = getUser();
      if (!user) {
        window.location.replace("/login/");
        return;
      }
      if (mustChangePassword()) {
        window.location.replace("/set-password/");
        return;
      }
      if (mustSetupTotp()) {
        window.location.replace("/setup-authenticator/");
        return;
      }
      window.location.replace(
        getPostAuthDestination(
          user,
          resolveAccessibleDashboardPath(user.role, nextPath),
        ),
      );
      return;
    }
    setAllowed(true);
  }, [nextPath]);

  return allowed;
}
