# Aceolution Finance — Architecture Documentation

This folder is the **frontend-repo copy** of the system architecture (diagrams, auth/Live–Demo, VAPT, PDF).  
The same files also live in `ace_finance_backend/docs/Architecture/` so either git remote can recover them.

```
docs/Architecture/
├── Aceolution_Finance_Architecture.pdf
├── aceolution_finance_architecture.md
├── AUTH_LIVE_DEMO_STORES.md
├── VAPT_SCOPE.md
├── INTERNAL_VAPT_CHECKLIST.md
├── BACKUP_AND_RESTORE.md
├── templates/
├── scripts/
└── README.md
```

**Web page:** `/architecture/` (unlock via `/demo-guide/` first).  
Also summarized in `/docs-guide/#architecture`. PDF download: `/architecture/Aceolution_Finance_Architecture.pdf`.

| Link | Path |
|------|------|
| Frontend app README | [`../../README.md`](../../README.md) |
| Backend twin copy | `ace_finance_backend/docs/Architecture/` (sibling repo) |
| Backend README | sibling `ace_finance_backend/README.md` |

---

## Key Artifacts

1. [**`Aceolution_Finance_Architecture.pdf`**](./Aceolution_Finance_Architecture.pdf)
   - Multi-page dark-theme PDF with Mermaid diagrams.

2. [**`aceolution_finance_architecture.md`**](./aceolution_finance_architecture.md)
   - Full system specification (stack, dual Mongo/blob, security).

3. [**`AUTH_LIVE_DEMO_STORES.md`**](./AUTH_LIVE_DEMO_STORES.md)
   - Microsoft-first login · Demo Access · password · Choose Workspace · Live/Demo isolation · VAPT notes.

4. [**`VAPT_SCOPE.md`**](./VAPT_SCOPE.md)
   - Formal VAPT engagement brief: targets, in/out of scope, Microsoft ROE, pre-flight checklist.

5. [**`INTERNAL_VAPT_CHECKLIST.md`**](./INTERNAL_VAPT_CHECKLIST.md)
   - How to run internal VAPT without a vendor: steps, checklist IDs, evidence folder, report template.

6. [**`INTERNAL_VAPT_REPORT_2026-10-29.md`**](./INTERNAL_VAPT_REPORT_2026-10-29.md)
   - Filled internal VAPT run (2026-10-29): results + findings (Swagger High).

7. [**`BACKUP_AND_RESTORE.md`**](./BACKUP_AND_RESTORE.md)
   - Full package: Atlas DB backup, Azure blob soft delete/versioning, App Service backup, restore drills.

---

## Sign-in flow (summary)

1. **Sign in with Microsoft** (company staff)  
2. **Demo Access** (dynamic `isDemo` list → demo DB/files only)  
3. **Use password instead** (admin / no Microsoft → OTP/TOTP when required)  
4. **Choose Workspace** if email exists in Live and Demo (role shown per store)  
5. Dashboard shows **Live** or **Demo** badge  

---

## Re-generate the PDF

From the **frontend** repo root:

```bash
node docs/Architecture/scripts/build-exact-pdf.cjs
```

(Adjust paths inside the script if it still expects the old workspace-root `Architecture/` location.)

When you edit architecture docs, update **both** frontend and backend `docs/Architecture` copies.
