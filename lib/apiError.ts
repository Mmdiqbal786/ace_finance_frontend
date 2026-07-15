export async function readApiError(res: Response, fallback: string): Promise<string> {
  const text = await res.text();
  if (!text) return `${fallback} (${res.status}).`;
  try {
    const data = JSON.parse(text) as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message.join(" ");
    if (typeof data.message === "string" && data.message.trim()) return data.message;
  } catch {
    // non-JSON body (e.g. Express "Cannot POST /projects")
  }
  if (/cannot\s+(get|post|put|patch|delete)\s+/i.test(text)) {
    return "API route not found. Restart the backend so the latest modules are loaded.";
  }
  return text.length > 160 ? `${fallback} (${res.status}).` : text;
}
