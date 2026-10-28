/** Body HTML for /architecture/ (also summarized in docs-guide section 0). */
export const ARCHITECTURE_PAGE_BODY_HTML = `
<div class="pad" style="background:#203c62;">
  <div class="brand-row">
    <img src="/Ace_logo_small_light.png" alt="" width="44" height="44"
      style="width:44px;height:44px;border-radius:10px;background:#0b1a2e;object-fit:contain;" />
    <div>
      <div class="brand-title">Aceolution <span style="color:#70bcfc;">Finance</span></div>
      <div style="margin-top:2px;font-size:11px;font-weight:600;letter-spacing:0.04em;color:#93c5fd;text-transform:uppercase;">
        System Architecture · Live / Demo · Auth · Hosting
      </div>
    </div>
  </div>
  <div style="font-size:14px;color:#dbeafe;font-weight:600;line-height:1.45;">
    High-level system view for demos, onboarding, and security review
  </div>
</div>

<div class="pad">
  <p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:#334155;">
    This page is the web entry for architecture.
    Path: <code>/architecture/</code>
    · Full markdown sources live in the git repo at <code>docs/Architecture/</code>
    (mirrored in the backend repo).
  </p>
  <div class="toc">
    <strong style="color:#0f172a;">On this page</strong><br/>
    <a href="#hosting">Hosting &amp; stack</a><br/>
    <a href="#stores">Live vs Demo stores</a><br/>
    <a href="#signin">Sign-in</a><br/>
    <a href="#duplicates">Duplicate invoice detection</a><br/>
    <a href="#roles">Roles</a><br/>
    <a href="#vapt">Security / VAPT</a><br/>
    <a href="#repo">Repo files &amp; PDF</a>
  </div>
</div>

<div class="pad-sm guide-section" id="hosting">
  <div class="section-title">Hosting &amp; stack (Azure)</div>
  <div class="block info">
    <strong>Web:</strong> <a href="https://finance.aceolution.com/" target="_blank" rel="noopener">https://finance.aceolution.com/</a><br/>
    <strong>API:</strong> <a href="https://ace-finance-api-f5hnhhd6c3bvffhj.southindia-01.azurewebsites.net/" target="_blank" rel="noopener">https://ace-finance-api-f5hnhhd6c3bvffhj.southindia-01.azurewebsites.net/</a><br/>
    <strong>Demo guide:</strong> <a href="/demo-guide/">/demo-guide/</a><br/>
    <strong>Full UI docs:</strong> <a href="/docs-guide/">/docs-guide/</a><br/>
    <strong>Stack:</strong> Next.js (Static Web Apps) · NestJS (App Service) · MongoDB Atlas · Azure Blob · Microsoft Entra · ACS Email
  </div>
</div>

<div class="pad-sm guide-section" id="stores">
  <div class="section-title">Live vs Demo stores (isolation)</div>
  <div class="block info">
    Real company work and training data are <strong>fully separate</strong>.
    The JWT <code>store</code> claim (<code>live</code> / <code>demo</code>) routes every API request.
    <br/><br/>
    <table>
      <tr><th></th><th>Live</th><th>Demo</th></tr>
      <tr><td>MongoDB</td><td><code>ace_finance</code></td><td><code>ace_finance_demo</code></td></tr>
      <tr><td>Azure Blob</td><td><code>ace-finance-files</code></td><td><code>ace-finance-files-demo</code></td></tr>
      <tr><td>Purpose</td><td>Real company work</td><td>Training / client demos</td></tr>
    </table>
    Header and sidebar show a <strong>Live</strong> or <strong>Demo</strong> workspace badge after sign-in.
  </div>
</div>

<div class="pad-sm guide-section" id="signin">
  <div class="section-title">Sign-in (Microsoft-first)</div>
  <div class="block info">
    1. <strong>Sign in with Microsoft</strong> — company staff (<code>@aceolution.*</code>), company MFA<br/>
    2. <strong>Demo Access</strong> — dynamic list of active <code>isDemo</code> users in the <strong>demo</strong> DB<br/>
    3. <strong>Use password instead</strong> — admin / accounts without Microsoft (OTP + optional TOTP)<br/>
    <br/>
    If the same email exists in Live <em>and</em> Demo → <strong>Choose Workspace</strong> with role per store.
    Microsoft-linked accounts cannot use password or forgot-password.
    Step-by-step UI: <a href="/docs-guide/#login">docs-guide · login</a>.
  </div>
</div>

<div class="pad-sm guide-section" id="duplicates">
  <div class="section-title">Duplicate invoice detection</div>
  <div class="block err">
    <h4>Hard duplicate — auto-blocked at submit</h4>
    Same invoice file (SHA-256) or same invoice number (same project / matching details across projects)
    → HTTP 400 · <strong>no expense created</strong> (not a Rejected status — never enters Approver queue).
    Checked before Azure Blob upload. Rejected claims are excluded so a fixed invoice can be resubmitted.
  </div>
  <div class="block info">
    <h4>Potential duplicate — warning</h4>
    Same project + category + amount within ±1 day → modal “Potential Duplicate Detected”;
    requester must confirm to continue. Details in docs-guide <a href="/docs-guide/#duplicates">§3a</a>
    and repo <code>docs/Architecture/aceolution_finance_architecture.md</code> §6.
  </div>
</div>

<div class="pad-sm guide-section" id="roles">
  <div class="section-title">Roles</div>
  <div class="block info">
    <code>ADMIN</code> · <code>APPROVER</code> · <code>PROCESSOR</code> · <code>REQUESTER</code><br/>
    Same role names in both stores; data is separate.
    Requester / Approver are project-scoped via <code>assignedProjects</code>.
    Matrix: <a href="/docs-guide/#roles">docs-guide · roles</a>.
  </div>
</div>

<div class="pad-sm guide-section" id="vapt">
  <div class="section-title">Security / VAPT</div>
  <div class="block ok">
    Prefer <strong>Demo</strong> workspace or Demo Access for destructive tests.
    Microsoft allows customer pen-tests of <em>your</em> Azure web apps under their Cloud Unified Penetration Testing Rules of Engagement
    (no DoS, no other tenants). Checklist in repo: <code>docs/Architecture/AUTH_LIVE_DEMO_STORES.md</code>.
  </div>
</div>

<div class="pad-sm guide-section" id="repo">
  <div class="section-title">Repo files &amp; PDF</div>
  <div class="block info">
    <strong>Download PDF (this site):</strong>
    <a href="/architecture/Aceolution_Finance_Architecture.pdf" target="_blank" rel="noopener">
      Aceolution_Finance_Architecture.pdf
    </a><br/><br/>
    Git-tracked sources (frontend repo — also mirrored in backend):<br/>
    <code>docs/Architecture/README.md</code><br/>
    <code>docs/Architecture/aceolution_finance_architecture.md</code><br/>
    <code>docs/Architecture/AUTH_LIVE_DEMO_STORES.md</code><br/>
    <code>docs/Architecture/Aceolution_Finance_Architecture.pdf</code>
  </div>
</div>

<div class="pad-footer">
  <p style="margin:0 0 10px;font-size:14px;color:#334155;line-height:1.6;">
    Related:
    <a href="/demo-guide/"><strong>Demo guide</strong></a>
    ·
    <a href="/docs-guide/"><strong>Full documentation</strong></a>
    ·
    <a href="/docs-guide/#architecture"><strong>Docs section 0</strong></a>
  </p>
  <p style="margin:0;font-size:15px;color:#0f172a;">
    Thanks,<br/><strong style="color:#203c62;">Aceolution Finance</strong>
  </p>
</div>

<div style="background:#203c62;padding:14px 16px;text-align:center;font-size:12px;color:#93c5fd;">
  /architecture/ · Live vs Demo · Microsoft-first auth
</div>
`;
