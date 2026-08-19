# Aceolution Finance — Frontend

Next.js web app for Aceolution Finance spend management: submit expenses, approve/process payments, analytics, and admin configuration.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS 4**
- **Static export** (`output: "export"`) — builds to `out/`
- Node.js `>=20 <23`

Talks to the NestJS API (`ace_finance_backend`) via `NEXT_PUBLIC_API_URL`.

## Roles

| Role | Main areas |
|------|------------|
| `REQUESTER` | Submit expense, My Requests |
| `APPROVER` | Approver queue |
| `PROCESSOR` | Processor / payment queue |
| `ADMIN` | Users, categories, projects, countries |

Dashboard home includes spend analytics scoped to the signed-in user’s role.
Dashboard and dashboard queues support filtering by Project and `submittedAt` date range (From/To) in the header.

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

## Deploy (Azure)

- **Frontend:** Azure Static Web Apps — build `npm run build`, publish `./out`
- **Backend:** Azure App Service (NestJS)
- Set `NEXT_PUBLIC_API_URL` (and demo password if needed) in the Static Web Apps build environment **before** build

### Live URLs

| App | URL |
|-----|-----|
| Frontend | https://finance.aceolution.com/ |
| Backend | https://ace-finance-api-f5hnhhd6c3bvffhj.southindia-01.azurewebsites.net/ |

## Related

- Backend: sibling repo / folder `ace_finance_backend`
- Demo accounts and flows: open `/demo-guide` after unlock
- Product docs: `/docs-guide`
