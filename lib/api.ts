/** Backend base URL from NEXT_PUBLIC_API_URL only (no hardcoded host). Trailing slash stripped. */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL?.trim() || "").replace(
  /\/$/,
  "",
);
