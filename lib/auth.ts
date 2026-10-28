import { resolveAccessibleDashboardPath } from './dashboard/routes';
import { API_URL, apiFetch } from './api';

const USER_KEY = 'ace_finance_user';
/** Legacy key — cleared on set/logout so JWTs are not left in localStorage. */
const LEGACY_TOKEN_KEY = 'ace_finance_token';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'APPROVER' | 'PROCESSOR' | 'REQUESTER';
  mustChangePassword?: boolean;
  mustSetupTotp?: boolean;
  totpEnabled?: boolean;
  assignedProjects?: string[];
  isDemo?: boolean;
  /** Which Mongo/storage store this session uses. */
  store?: 'live' | 'demo';
  /** Linked via Sign in with Microsoft — company MFA covers 2-step. */
  microsoftLinked?: boolean;
}

export function getToken(): string | null {
  // Session is httpOnly cookie — JS must not hold the JWT.
  return null;
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

/** Persist profile only. JWT lives in httpOnly cookie set by the API. */
export function setAuth(_token: string | null | undefined, user: AuthUser): void {
  try {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    // ignore
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function updateStoredUser(partial: Partial<AuthUser>): void {
  const user = getUser();
  if (!user) return;
  setAuth(null, { ...user, ...partial });
}

export async function logout(): Promise<void> {
  try {
    if (API_URL) {
      await apiFetch(`${API_URL}/auth/logout`, { method: 'POST' });
    }
  } catch {
    // ignore network errors on sign-out
  }
  try {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    // ignore
  }
  window.location.href = '/login';
}

/** True when a profile is stored; API cookie is validated on the next request. */
export function isAuthenticated(): boolean {
  return Boolean(getUser());
}

export function mustChangePassword(): boolean {
  return Boolean(getUser()?.mustChangePassword);
}

/** Non-admin users must enroll authenticator before using the dashboard. */
export function mustSetupTotp(): boolean {
  const user = getUser();
  if (!user) return false;
  if (user.role === 'ADMIN') return false;
  if (user.microsoftLinked === true) return false;
  if (user.totpEnabled === true) return false;
  if (user.mustSetupTotp === false) return false;
  if (user.mustSetupTotp === true) return true;
  return Boolean(user.role);
}

/** Post-auth destination: password change → authenticator → dashboard. */
export function getPostAuthDestination(
  user: AuthUser,
  intendedDashboardPath?: string | null,
): string {
  if (user.mustChangePassword) return '/set-password/';
  const needsTotp =
    user.role !== 'ADMIN' &&
    user.totpEnabled !== true &&
    user.mustSetupTotp !== false &&
    user.microsoftLinked !== true;
  if (needsTotp) {
    return '/setup-authenticator/';
  }
  return resolveAccessibleDashboardPath(user.role, intendedDashboardPath);
}

export function authHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json' };
}

/** For FormData / multipart (do not set Content-Type). Cookie carries the session. */
export function authTokenHeaders(): HeadersInit {
  return {};
}

/** Restore user from httpOnly cookie after Microsoft redirect (`?ms_ok=1`). */
export async function fetchSessionUser(): Promise<AuthUser | null> {
  if (!API_URL) return null;
  const res = await apiFetch(`${API_URL}/auth/me`, {
    headers: authHeaders(),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  const user = data?.user as AuthUser | undefined;
  if (!user?.id || !user?.email || !user?.role) return null;
  setAuth(null, user);
  return user;
}
