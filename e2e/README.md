# Frontend Playwright E2E + UI VAPT

Runs against **live** Static Web App by default (`https://finance.aceolution.com`).

## Commands

```bash
npm run test:e2e          # full UI suite (excludes @mfa unless password set)
npm run test:e2e:vapt     # @vapt tagged (includes MFA only if MS_E2E_PASSWORD set)
npm run test:e2e:mfa      # C04 fresh Entra login + Authenticator number-match (headed)
npm run test:e2e:ui       # interactive UI mode
```

## Env

```bash
set BASE_URL=https://finance.aceolution.com
set DEMO_ACCESS_CODE=Aceolution_2024
set DEMO_REQUESTER_PASSWORD=Requester@1234

# Required for fresh MFA e2e (do not commit):
set MS_E2E_EMAIL=iqbal@aceolution.com
set MS_E2E_PASSWORD=your-microsoft-password
# optional: set MS_E2E_MFA_TIMEOUT_MS=180000
```

## Coverage

| Area | Spec |
|------|------|
| A02 SWA headers | `security-headers.spec.ts` |
| B03/B04 gates | `public-gates.spec.ts` |
| C03/C05/C07 Demo Access | `auth-demo.spec.ts` |
| C04 OAuth start | `microsoft-oauth.spec.ts` |
| C04 full MFA | `microsoft-mfa.spec.ts` — forces `?prompt=login`, prints Authenticator number, waits for phone approve |
| Requester nav RBAC | `rbac-nav.spec.ts` |

API-heavy VAPT remains in backend: `npm run test:api:vapt`.
