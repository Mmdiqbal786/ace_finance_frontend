# Aceolution Finance — Action-synced voice (baked into MP4)

Voice is **muxed into** `role-walkthroughs/with-voice/*.mp4` (not a separate track).
Lines are timed to on-screen actions. Rebuild: `npm run docs:build-voice` then `npm run docs:upload-videos`.

---

## How the product actually works (read before narrating)

### Requester
- **Projects:** dropdown shows **only Admin-assigned projects** (Requester GAC → GAC).
- **Amount:** enter **local currency** from Country (e.g. INR). On submit the **server converts to USD** and stores FX rate + date. Confirm modal shows local details; **View** later shows USD + FX line.
- **Emails on submit:** requester gets “submitted”; **approvers assigned to that project** get “awaiting approval”.
- **Hard duplicate:** same invoice **file** (hash) or conflicting invoice # → **blocked**, nothing created. Sticky toast → **Dismiss**.
- **Soft / potential duplicate:** **new file** + new invoice #, but same **project + category + amount (+ currency) within ±1 day** (expense date = today). Modal **Potential Duplicate Detected** → check confirm → **Confirm & Submit Expense**.
- **My Requests:** Awaiting Manager Approval · Changes Requested · Approved - Awaiting Processing · Partially Paid · Disbursed & Paid · Rejected by Manager/Finance. Edit only when Changes Requested.

### Approver
- **Queue:** **assigned projects only**. Approve / Request Changes / Reject only for those.
- **Approve:** status → Approved - Awaiting Processing; **processors** emailed (requester is **not** emailed on approve).
- **Request Changes:** requester emailed; Edit opens for requester.
- **Reject:** requester emailed; terminal for manager path.

### Processor / Admin
- Full/partial pay + receipts; paid email when **fully** paid. Admin catalogs + Demo Access users.

---

## 01 — Requester (longer, higher-res recording)

| Start (approx) | On screen | Say |
|------:|-----------|-----|
| 0.5s | Demo dashboard | Requester GAC in Demo. Only projects Admin assigned to this persona appear on Submit Expense. |
| 6s | Empty submit errors | Submit Expense. Project list is scoped. Submit empty — required fields highlight: country, category, due date, amount, description, invoice. |
| 16s | Bad file | Attach a text file on purpose. Blocked — invoice must be PDF or an image. |
| 22s | Fill local currency | Valid request. Pick a non-USD country so the amount is local currency. Choose an assigned project only, category, due date, description, and a real invoice image. |
| 32s | Confirm | Confirm submission — review local details, then Confirm and Submit. |
| 36s | Success + Dismiss | Success with an Expense ID. The system stored USD and the FX rate. Emails go to the requester and to approvers on this project. Click Dismiss — sticky notices stay until you close them. |
| 42s | Hard dup same file | Hard duplicate: same invoice file again. New invoice number does not matter — the exact file is blocked. Nothing is created. Dismiss. |
| 52s | Soft dup fill | Soft duplicate: brand-new file and invoice number, but the same project, category, amount, and day. |
| 58s | Potential Duplicate modal | Potential Duplicate Detected. Confirm it is a separate expense, then Confirm and Submit Expense. |
| 68s | Soft success | Submitted after soft confirm. Dismiss. |
| 78s | My Requests + View | My Requests tracks every status. Open View — local amount, USD, and FX rate. Then sign out. Next: Approver, same assigned projects only. |

*Timings are approximate; `build-docs-voice.ps1` shifts lines so they do not overlap.*

---

## 02 — Approver

| Start | Say |
|------:|-----|
| 0.5s | Approver Media in Demo. |
| 4s | Approver Panel — only expenses for **assigned projects** wait here. |
| 8s | Approve with optional notes. Confirm. Processors are emailed; the requester sees Approved - Awaiting Processing in the app. |
| 15s | Request Changes — tell the requester what to fix. They get email and can Edit. |
| 22s | Reject with a clear reason. Requester is emailed. Terminal for the manager. |
| 30s | Analytics — Export Excel Report. Sign out. |

---

## 03 — Processor

| Start | Say |
|------:|-----|
| 0.4s | Processor Alisha — pays approved items for all projects. |
| 3s | Mark Paid — receipt + note. Full payment; requester gets paid email when fully paid. |
| 9s | Partially Paid — amount now + receipt. |
| 13s | Request Changes back, or Reject Payout. |
| 16s | Sign out. |

---

## 04 — Admin

| Start | Say |
|------:|-----|
| 0.5s | Admin Demo workspace — catalogs and users drive what requesters and approvers can see. |
| 4s | Projects create, edit, delete. |
| 18s | Categories create, edit, delete. |
| 30s | Countries and currencies — these drive local amount and FX. |
| 45s | User Management — assign projects to requesters and approvers; Demo Access users appear on login. |
| 62s | Peek Approver and Processor, then sign out. |

---

## Demo accounts

- Requester GAC · `Requester@1234` · project GAC  
- Approver Media · `Approver@1234` · GAC + GNL + GNP  
- Alisha · `Processor@1234`  
- Admin · `finance@aceolution.com` / `Admin@1234` → Demo  
- Access code: `Aceolution_2024`
