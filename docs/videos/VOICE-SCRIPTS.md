# Aceolution Finance — Role walkthrough voice scripts (Demo)

Use with silent recordings in `docs/videos/role-walkthroughs/`.

**How to add voice:** Clipchamp / CapCut / PowerPoint → import `.webm` → narrate or TTS → export MP4.

**Demo accounts**

- Requester: Demo Access → Requester GAC · `Requester@1234`
- Approver: Demo Access → Approver Media · `Approver@1234`
- Processor: Demo Access → Alisha · `Processor@1234`
- Admin: password → `finance@aceolution.com` · `Admin@1234` → **Demo / training data**
- Access code: `Aceolution_2024`

---

## 01 — Requester (`01-requester-demo.webm`)

| Beat | Say |
|------|-----|
| Open | Requester flow in the Demo sandbox — success, errors, and duplicate detection. |
| Login | Unlock Demo Access, pick Requester GAC, and sign in. |
| Error validation | First, submit without an attachment. The form blocks the request and highlights what is missing. |
| Error file type | A disallowed file type is rejected — only PDF or image invoices are allowed. |
| Success | Now a valid submit: country, project, category, due date, amount, description, and invoice. Confirm and Submit. Success — Expense request submitted with an Expense ID. Click Dismiss to continue. |
| Hard duplicate | Submit the same invoice file again. Hard duplicate — exact file already used. The request is blocked and nothing is created. Dismiss the notice. |
| Soft duplicate | Submit again with a new file but the same project, category, amount, and date window. Potential Duplicate Detected. Confirm it is a separate expense, then Confirm and Submit Expense. Dismiss the success notice. |
| My Requests | Open My Requests to track every status — pending, changes requested, approved, paid, or rejected. |
| Done | Sign out. Next: Approver reviews these requests. |

---

## 02 — Approver (`02-approver-demo.webm`)

| Beat | Say |
|------|-----|
| Open | Approver flow in Demo. Sign in as Approver Media. |
| Panel | Approver Panel lists expenses waiting for manager sign-off. |
| Approve | Actions → Approve → optional notes → Confirm. Ready for Processor. |
| Request changes | Request Changes → explain what to fix → Send. Goes back to the Requester. |
| Reject | Reject → clear reason → Confirm. Terminal rejection by manager. |
| Report | Analytics and Tracker → Export Excel Report. |
| Done | Sign out. Next: Processor payout. |

---

## 03 — Processor (`03-processor-demo.webm`)

| Beat | Say |
|------|-----|
| Open | Processor flow in Demo. Sign in as Alisha. |
| Full pay | Mark Paid → attach payment receipt → Confirm. Full payment recorded. |
| Partial | Partially Paid → amount now → receipt → Record Partial Payment. |
| Changes | Request Changes → Approver or Requester → Send. |
| Reject payout | Reject Payout with a reason when finance will not pay. |
| Done | Sign out. Next: Admin setup. |

---

## 04 — Admin (`04-admin-demo.webm`)

| Beat | Say |
|------|-----|
| Open | Admin flow. Password login → choose Demo workspace. |
| Projects | Create, edit, then delete a training project. |
| Categories | Create, edit, delete a category. |
| Countries | Create, edit, delete a country and currency. |
| Users | Create a Demo Access user, edit, then delete. |
| Done | Sign out. Admin catalog and users covered. |

---

## Combined story (optional intro)

> Requesters submit with validation, hard-duplicate block, and soft-duplicate confirm. Approvers approve, send changes, or reject and export reports. Processors pay in full or part, send changes back, or reject payout. Admins manage projects, categories, countries, and users — all in Demo.
