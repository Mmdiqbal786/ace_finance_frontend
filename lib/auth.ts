import { resolveAccessibleDashboardPath } from './dashboard/routes';

const TOKEN_KEY = 'ace_finance_token';
const USER_KEY = 'ace_finance_user';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'APPROVER' | 'PROCESSOR' | 'REQUESTER';
  mustChangePassword?: boolean;
  mustSetupTotp?: boolean;
  totpEnabled?: boolean;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
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

export function setAuth(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function updateStoredUser(partial: Partial<AuthUser>): void {
  const token = getToken();
  const user = getUser();
  if (!token || !user) return;
  setAuth(token, { ...user, ...partial });
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = '/login';
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    // Decode JWT payload (base64) to check expiry
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch {
    return false;
  }
}

export function mustChangePassword(): boolean {
  const user = getUser();
  if (user?.mustChangePassword) return true;
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Boolean(payload.mustChangePassword);
  } catch {
    return false;
  }
}

/** Non-admin users must enroll authenticator before using the dashboard. */
export function mustSetupTotp(): boolean {
  const user = getUser();
  const token = getToken();
  let role = user?.role;
  let totpEnabled = user?.totpEnabled === true;
  let flagged = user?.mustSetupTotp === true;

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      role = role || payload.role;
      // Either store or JWT saying enabled is enough (avoids stale-flag loops).
      if (payload.totpEnabled === true) totpEnabled = true;
      if (payload.mustSetupTotp === true) flagged = true;
    } catch {
      // ignore
    }
  }

  if (role === 'ADMIN') return false;
  // Enabled authenticator always wins over a stale mustSetupTotp flag.
  if (totpEnabled) return false;
  if (flagged) return true;
  // Non-admin without confirmed TOTP must enroll
  return Boolean(role);
}

/** Post-auth destination: password change → authenticator → dashboard. */
export function getPostAuthDestination(
  user: AuthUser,
  intendedDashboardPath?: string | null,
): string {
  if (user.mustChangePassword) return '/set-password/';
  // Only require setup when authenticator is not actually enabled.
  if (user.role !== 'ADMIN' && user.totpEnabled !== true) {
    return '/setup-authenticator/';
  }
  return resolveAccessibleDashboardPath(user.role, intendedDashboardPath);
}

export function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}
