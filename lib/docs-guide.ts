import { DEMO_APP_URL } from "./demo-guide";

export const DOCS_DEMO_GUIDE_URL = "/demo-guide/";
export const DOCS_APP_URL = DEMO_APP_URL;

export const DOCS_TOC = [
  { href: "#status", label: "1. Status legend & flow" },
  { href: "#login", label: "2. All login possibilities" },
  { href: "#requester", label: "3. Requester pages (submit, track, edit)" },
  { href: "#approver", label: "4. Approver — every action" },
  { href: "#processor", label: "5. Processor — every action" },
  { href: "#analytics", label: "6. Analytics, details & Excel" },
  { href: "#profile", label: "7. Profile, password & Authenticator" },
  { href: "#admin", label: "8. Admin pages" },
  { href: "#emails", label: "9. Emails & attachments" },
  { href: "#email-requester", label: "9a. Requester emails (inbox screenshots)" },
  { href: "#email-approver", label: "9b. Approver emails (inbox screenshots)" },
  { href: "#email-processor", label: "9c. Processor emails (inbox screenshots)" },
  { href: "#roles", label: "10. Role matrix" },
  { href: "#errors-gallery", label: "11. Validation & toast gallery" },
] as const;

export function normalizeDocsPlainText(raw: string): string {
  return raw
    .replace(/\u00a0/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
