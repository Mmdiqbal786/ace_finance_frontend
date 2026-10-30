/**
 * Role walkthrough videos on Azure Blob (private container + read SAS).
 * Upload: npm run docs:upload-videos
 * Live: NEXT_PUBLIC_DOCS_VIDEOS_BASE_URL + NEXT_PUBLIC_DOCS_VIDEOS_SAS
 */

export const DOCS_VIDEOS_CONTAINER = "ace-finance-docs-videos";

/** Default account from Aceolution Finance Azure storage (override via env). */
export const DOCS_VIDEOS_BASE_URL_DEFAULT =
  "https://acefinance.blob.core.windows.net/ace-finance-docs-videos";

export function docsVideosBaseUrl(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_DOCS_VIDEOS_BASE_URL || "").trim();
  return (fromEnv || DOCS_VIDEOS_BASE_URL_DEFAULT).replace(/\/$/, "");
}

/** Container SAS query without leading ? (from upload script / .env.deploy). */
export function docsVideosSas(): string {
  return (process.env.NEXT_PUBLIC_DOCS_VIDEOS_SAS || "").trim().replace(/^\?/, "");
}

export type DocsWalkthroughVideo = {
  id: string;
  title: string;
  file: string;
  caption: string;
};

export const DOCS_WALKTHROUGH_VIDEOS: DocsWalkthroughVideo[] = [
  {
    id: "requester",
    title: "01 — Requester",
    file: "role-walkthroughs/01-requester-demo.mp4",
    caption:
      "Validation & bad-file errors · successful submit · hard duplicate (same file blocked) · soft / potential duplicate · My Requests. Sticky notices need Dismiss.",
  },
  {
    id: "approver",
    title: "02 — Approver",
    file: "role-walkthroughs/02-approver-demo.mp4",
    caption: "Approve · request changes · reject · Analytics Excel export.",
  },
  {
    id: "processor",
    title: "03 — Processor",
    file: "role-walkthroughs/03-processor-demo.mp4",
    caption: "Mark paid · partial pay · request changes · reject payout.",
  },
  {
    id: "admin",
    title: "04 — Admin",
    file: "role-walkthroughs/04-admin-demo.mp4",
    caption:
      "Projects / categories / countries / users — create, edit, delete (Demo workspace).",
  },
];

export function docsWalkthroughVideoUrl(file: string): string {
  const base = docsVideosBaseUrl();
  const path = file.replace(/^\//, "");
  const url = `${base}/${path}`;
  const sas = docsVideosSas();
  if (!sas) return url;
  return `${url}?${sas}`;
}
