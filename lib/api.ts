/** Backend base URL from NEXT_PUBLIC_API_URL only (no hardcoded host). Trailing slash stripped. */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL?.trim() || "").replace(
  /\/$/,
  "",
);

/** Always include cookies (httpOnly session) on API calls. */
export const API_FETCH_CREDENTIALS: RequestCredentials = "include";

/** fetch() wrapper that always sends the session cookie to the API. */
export function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  return fetch(input, {
    ...init,
    credentials: API_FETCH_CREDENTIALS,
  });
}
