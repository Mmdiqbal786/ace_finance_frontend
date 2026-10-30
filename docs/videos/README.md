# Role walkthrough videos (Demo)

Silent screen recordings of Admin, Requester, Approver, and Processor on the **Demo** workspace. Add narration with [VOICE-SCRIPTS.md](./VOICE-SCRIPTS.md).

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

## Add voice

Import each `.webm` into Clipchamp / CapCut → record or TTS from VOICE-SCRIPTS.md → export MP4.

Do not commit large binary videos to git unless the team agrees (see `.gitignore`).
