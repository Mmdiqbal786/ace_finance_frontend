# Aceolution Finance — Frontend

Next.js web app for Aceolution Finance spend management: submit expenses, approve/process payments, analytics, and admin configuration.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS 4**
- **Static export** (`output: "export"`) — builds to `out/`
- Node.js `>=20 <23`

Talks to the NestJS API (`ace_finance_backend`) via `NEXT_PUBLIC_API_URL`.

## Roles

| Role | Main areas | Project scope |
|------|------------|---------------|
| `REQUESTER` | Submit expense, My Requests | Assigned projects only (dropdown + Profile) |
| `APPROVER` | Approver queue | Assigned projects only (queue / emails / Profile) |
| `PROCESSOR` | Processor / payment queue | All approved expenses (not project-scoped) |
| `ADMIN` | Users, categories, projects, countries | All projects (not project-scoped) |

Dashboard home includes spend analytics scoped to the signed-in user’s role.
Dashboard and queues support filtering by Project and `submittedAt` date range (From/To) in the header.

**Profile**
- Requester / Approver: view mode shows **Assigned Projects** (read-only chips, scrollable when many). Edit Profile hides projects (name only).
- Admin / Processor: view mode shows **Access Scope** instead (no project list). Edit Profile hides Access Scope too.
- Projects are assigned only by Admin in User Management.

**Submit Expense**
- Form plus desktop right panel: *What happens next* (4 steps) and *Your recent requests* (latest 4, or empty “No data”).

**Notifications**
- Backend in-app notification APIs exist; the header notification bell is **temporarily hidden** in the UI (code kept for later).

## Pages

- Landing, login, forgot/reset/set password, authenticator setup
- Dashboard: home, submit expense, my requests, approver, processor, analytics, profile
- Admin: user management, categories, projects, countries
- Guides: `/demo-guide`, `/docs-guide`, `/docs-guide/present` (password-gated)

## Setup

```bash
npm install
cp .env.example .env
# or .env.local — same variables
```

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend URL (local: `http://localhost:3001`) |
| `NEXT_PUBLIC_APP_URL` | For guides | Live frontend URL used in demo/docs links (e.g. `https://finance.aceolution.com`) |
| `NEXT_PUBLIC_DEMO_GUIDE_ACCESS_PASSWORD` | For guides | Unlocks `/demo-guide` and `/docs-guide` |

These are `NEXT_PUBLIC_*` values, so they are embedded in the client build. Do not put secrets that must stay server-only here. Keep real passwords out of git.

### Examples

```env
# Local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_GUIDE_ACCESS_PASSWORD=your-demo-password

# Production (set in Azure Static Web Apps env before build)
# NEXT_PUBLIC_API_URL=https://ace-finance-api-f5hnhhd6c3bvffhj.southindia-01.azurewebsites.net
# NEXT_PUBLIC_APP_URL=https://finance.aceolution.com
# NEXT_PUBLIC_DEMO_GUIDE_ACCESS_PASSWORD=your-secure-demo-password
```

## Run

```bash
# development
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Backend should already be running on port `3001`.

```bash
# production static build
npm run build
# output in ./out

# optional local preview of static export
npm run preview
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js development server |
| `npm run build` | Static export to `out/` |
| `npm run preview` | Serve the `out/` folder locally |
| `npm run lint` | ESLint |

### Docs screenshots (local)

Requires frontend `:3000` and backend `:3001`. Writes to `public/docs-screenshots/`.

```bash
# Full UI refresh (most /docs-guide/ shots)
node scripts/capture-docs-refresh.cjs

# Profile / Submit / Access Scope (demo Ops + Processor accounts)
node scripts/capture-docs-updated-ui.cjs

# Auth / confirm-preview / gaps (as needed)
node scripts/capture-docs-auth.cjs
node scripts/capture-docs-confirm-preview.cjs
node scripts/capture-docs-screenshots-gaps.cjs
```

Email inbox screenshots and the Excel workbook example (`38b-export-workbook-example.png`) are captured separately and usually left as-is.

## Deploy (Azure)

- **Frontend:** Azure Static Web Apps — static export `./out`
- **Backend:** Azure App Service (NestJS)

### One-command frontend deploy (recommended)

You do **not** need to manually flip `.env` local ↔ production or delete `node_modules` every time.

1. Copy deploy secrets (once):

```bash
cp .env.deploy.example .env.deploy
# Edit .env.deploy — set SWA_DEPLOYMENT_TOKEN from Azure Portal → Static Web App → Manage deployment token
```

2. Keep `.env` on **local** URLs for `npm run dev`.

3. Deploy:

```bash
npm run deploy:azure
# or: .\scripts\deploy-azure-swa.ps1
# optional full wipe: .\scripts\deploy-azure-swa.ps1 -CleanNodeModules
```

What the script does:

- Sets production `NEXT_PUBLIC_*` from `.env.deploy` **only for that build process** (does not rewrite `.env`)
- Cleans `out/` + `.next/`
- Runs `npm run build`
- Runs `swa deploy ./out --app-name ace-finance-frontend --env production`
- Leaves local `.env` unchanged

Requires: `npm i -g @azure/static-web-apps-cli`

`.env.deploy` is gitignored — never commit the deployment token.

### Live URLs

| App | URL |
|-----|-----|
| Frontend | https://finance.aceolution.com/ |
| Backend | https://ace-finance-api-f5hnhhd6c3bvffhj.southindia-01.azurewebsites.net/ |

## Related

- Backend: sibling repo / folder `ace_finance_backend`
- Demo accounts and flows: open `/demo-guide` after unlock
- Product docs: `/docs-guide`
