# Aceolution Finance — Action-synced voice (baked into MP4)

Voice is **not** a separate track you play beside the video.  
Each line is timed to the on-screen action, then **muxed into** `role-walkthroughs/with-voice/*.mp4`.

Rebuild:

```powershell
cd ace_finance_frontend
powershell -ExecutionPolicy Bypass -File scripts/build-docs-voice.ps1
npm run docs:upload-videos
```

Style: short coach lines (“Now we…”, “Watch — …”), not a script dump from second zero.

---

## 01 — Requester (~71s) · `01-requester-demo.webm`

| Start | On screen | Say |
|------:|-----------|-----|
| 0.5s | Dashboard after Demo login | We're in as Requester GAC in the Demo workspace. Dashboard is loading. |
| 5s | Empty submit — red errors | Opening Submit Expense. I hit Submit with the form empty — see the red messages? Country, category, due date, amount, description, and invoice are required. |
| 15s | Bad `.txt` attachment | Now I attach a text file on purpose. The app blocks it — invoices must be a PDF or an image. |
| 20s | Filling a valid form | Filling a real request: country, category, due date, amount, description, and a proper invoice image. |
| 25s | Confirm submission modal | Confirm submission — reviewing the summary, then Confirm and Submit. |
| 28s | Success sticky + Dismiss | Success — we got an Expense ID. This notice stays until we click Dismiss. |
| 33s | Same invoice file again | Hard duplicate test: same invoice file again. |
| 36s | Confirm / hard-block toast | Confirm… the system blocks it — that exact file was already used. Nothing new is created. Dismiss. |
| 44s | Soft duplicate path | Soft duplicate: new file, but same project, category, amount, and date window. |
| 48s | Confirm / potential duplicate | Review, confirm it is a separate expense if asked, then submit. |
| 55s | Soft success + Dismiss | Submitted again — Dismiss the success notice. |
| 60s | My Requests table | My Requests — every status lives here: awaiting approval, changes requested, paid, rejected. |
| 67s | Dashboard / sign out | Back to the dashboard, then sign out. Next up is the Approver. |

---

## 02 — Approver (~36s) · `02-approver-demo.webm`

| Start | On screen | Say |
|------:|-----------|-----|
| 0.5s | Approver dashboard | Signed in as Approver Media in Demo. |
| 4s | Approver Panel queue | Opening the Approver Panel — expenses waiting for manager sign-off. |
| 8s | Approve modal + notes | Actions, Approve. Optional notes — approved for payment — then Confirm. |
| 14s | Request Changes modal | Next row — Request Changes. Tell the requester what to fix, then Send. |
| 20s | Reject modal | Reject with a clear reason, then Confirm. That ends the request for the manager. |
| 26s | Panel after actions | Queue updates after each decision. |
| 30s | Analytics + Export Excel | Analytics and Tracker — Export Excel Report for the tracker. Then sign out. |

---

## 03 — Processor (~18s) · `03-processor-demo.webm`

| Start | On screen | Say |
|------:|-----------|-----|
| 0.3s | Processor dashboard | Processor Alisha in Demo. |
| 3s | Processor panel / Mark Paid | Processor panel. Mark Paid — attach a payment receipt, add a note, Confirm. Full payment recorded. |
| 9s | Partial payment | Partially Paid — amount now, receipt, Record Partial Payment. |
| 13s | Changes / reject if shown | Request Changes back to Approver, or Reject Payout when finance will not pay. |
| 16s | Sign out | Sign out. Next is Admin setup. |

---

## 04 — Admin (~69s) · `04-admin-demo.webm`

| Start | On screen | Say |
|------:|-----------|-----|
| 0.5s | Admin Demo workspace | Admin password login into the Demo workspace. |
| 4s | Projects create | Projects — Add Project, create a training project. |
| 10s | Projects edit / delete | Edit the name, save, then delete it so Demo stays clean. |
| 18s | Categories CRUD | Categories — create, edit, delete a training category. |
| 30s | Countries CRUD + search | Countries — create one with a unique currency, search to find it, edit, then delete. |
| 45s | Users create | User Management — Add New User for Demo Access, assign a role and project, Create. |
| 55s | Users edit / delete | Edit the user, save, then delete. |
| 62s | Approver / Processor peek | Quick look at Approver and Processor panels, then sign out. |

---

## Demo accounts (unchanged)

- Requester: Demo Access → Requester GAC · `Requester@1234`
- Approver: Demo Access → Approver Media · `Approver@1234`
- Processor: Demo Access → Alisha · `Processor@1234`
- Admin: password → `finance@aceolution.com` · `Admin@1234` → **Demo / training data**
- Access code: `Aceolution_2024`
