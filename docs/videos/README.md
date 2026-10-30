# Role walkthrough videos (Demo)

Silent screen recordings of **full Demo flows** (not just navigation):

- **Requester** — validation / bad-file errors · successful submit · **hard duplicate** (same file blocked) · **soft/potential duplicate** (confirm to continue) · My Requests
- **Approver** — approve · request changes · reject · export Analytics report
- **Processor** — mark paid · partial pay · request changes · reject payout
- **Admin** — create / edit / delete projects, categories, countries, users

Add narration with [VOICE-SCRIPTS.md](./VOICE-SCRIPTS.md).

## Generate

```bash
cd ace_finance_frontend
npm run test:e2e:docs
npm run docs:publish-videos
```

Outputs land in `role-walkthroughs/`:

| File | Role |
|------|------|
| `01-requester-demo.webm` | Requester |
| `02-approver-demo.webm` | Approver |
| `03-processor-demo.webm` | Processor |
| `04-admin-demo.webm` | Admin |

Live app: https://finance.aceolution.com/  
Demo guide: https://finance.aceolution.com/demo-guide/ (code `Aceolution_2024`)

## Add voice (baked into the MP4)

Narration is **action-timed** and **muxed into** the MP4 — one file with picture + sound (not a separate audio track).

```powershell
# after: winget install Gyan.FFmpeg
powershell -ExecutionPolicy Bypass -File scripts/build-docs-voice.ps1
```

Scripts / timing: [VOICE-SCRIPTS.md](./VOICE-SCRIPTS.md)  
Output: `role-walkthroughs/with-voice/*.mp4`

## Live (Azure Blob + Demo Guide)

Videos stay **out of Git**. Host them on a dedicated **private** container (not invoice blobs) with a **read-only SAS** (storage account disallows anonymous public access):

```bash
cd ace_finance_frontend
npm run docs:upload-videos
```

- Container: `ace-finance-docs-videos`
- Paths: `role-walkthroughs/01-requester-demo.mp4` … `04-admin-demo.mp4`
- Uses `AZURE_STORAGE_CONNECTION_STRING` from `ace_finance_backend/.env`
- Prints `NEXT_PUBLIC_DOCS_VIDEOS_BASE_URL` + `NEXT_PUBLIC_DOCS_VIDEOS_SAS` (also writes `with-voice/azure-urls.env`)

Copy those two vars into `.env.deploy`, then redeploy:

```bash
npm run deploy:azure
```

Players appear on Demo Guide → **Training videos** after access-code unlock:

https://finance.aceolution.com/demo-guide/

Do not commit large binary videos or SAS secrets to git (see `.gitignore`).
