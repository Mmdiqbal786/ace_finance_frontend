# Frontend Playwright E2E + UI VAPT

Runs against **live** Static Web App by default (`https://finance.aceolution.com`).

## Commands

```bash
npm run test:e2e          # full UI suite
npm run test:e2e:vapt     # @vapt tagged only (headers, gates, demo auth, MS OAuth start)
npm run test:e2e:ui       # interactive UI mode
```

## Env

```bash
set BASE_URL=https://finance.aceolution.com
set DEMO_ACCESS_CODE=Aceolution_2024
set DEMO_REQUESTER_PASSWORD=Requester@1234
```

## Coverage

| Area | Spec |
|------|------|
| A02 SWA headers | `security-headers.spec.ts` |
| B03/B04 gates | `public-gates.spec.ts` |
| C03/C05/C07 Demo Access | `auth-demo.spec.ts` |
| C04 OAuth start | `microsoft-oauth.spec.ts` (MFA number-match still human) |
| Requester nav RBAC | `rbac-nav.spec.ts` |

API-heavy VAPT remains in backend: `npm run test:api:vapt`.
