"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "../../lib/toast";
import {
  DEMO_ACCOUNTS,
  DEMO_API_URL,
  DEMO_APP_URL,
  DEMO_AUDIT_CHECKS,
  DEMO_ARCHITECTURE_URL,
  DEMO_DOCS_URL,
  DEMO_EXTRA_STAFF,
  DEMO_FLOW_A_STEPS,
  DEMO_ROLE_CAPABILITIES,
  DEMO_SECTIONS,
  DEMO_SECURITY_FEATURES,
  DEMO_SIGN_IN_STEPS,
  DEMO_UI_CHECKS,
  buildAccountsCopyText,
  buildFullGuideCopyText,
  buildShareInviteText,
  copyPlainText,
  lockDemoGuideAccess,
} from "../../lib/demo-guide";
import GuideActionBar, { type GuideActionItem } from "../guide/GuideActionBar";
import GuideJumpBar, { useGuideHashJumps } from "../guide/GuideJumpBar";
import "../docs-guide/docs-guide.css";

const DEMO_JUMP_CHIPS = DEMO_SECTIONS.map((s) => ({
  href: `#${s.id}`,
  label: s.label,
}));

function SectionMark({ kind, title }: { kind: "start" | "end"; title: string }) {
  return (
    <div className={`sec-mark sec-mark--${kind}`}>
      <span className="sec-mark__tag">{kind === "start" ? "Section start" : "Section end"}</span>
      <span className="sec-mark__title">{title}</span>
    </div>
  );
}

function GuideSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="pad-sm guide-section" id={id}>
      <SectionMark kind="start" title={title} />
      {children}
      <SectionMark kind="end" title={title} />
    </div>
  );
}

export default function DemoGuideContent() {
  const contentRef = useRef<HTMLDivElement>(null);
  const topBarRef = useRef<HTMLDivElement>(null);
  const [copying, setCopying] = useState<string | null>(null);
  const [topBarH, setTopBarH] = useState(68);

  useGuideHashJumps(contentRef);

  function handleExitAccess() {
    lockDemoGuideAccess();
    window.location.assign("/demo-guide/");
  }

  const measureTopBar = useCallback(() => {
    const h = topBarRef.current?.offsetHeight || 68;
    setTopBarH(h);
    const topEdge = topBarRef.current?.getBoundingClientRect().bottom || h;
    document.documentElement.style.setProperty("--guide-topbar-h", `${topEdge}px`);
  }, []);

  useEffect(() => {
    measureTopBar();
    const raf = requestAnimationFrame(measureTopBar);
    window.addEventListener("resize", measureTopBar);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measureTopBar);
    };
  }, [measureTopBar]);

  async function handleCopy(kind: "invite" | "guide" | "accounts") {
    setCopying(kind);
    try {
      const text =
        kind === "invite"
          ? buildShareInviteText()
          : kind === "guide"
            ? buildFullGuideCopyText()
            : buildAccountsCopyText();
      await copyPlainText(text);
      toast.success(
        kind === "invite"
          ? "Invite text copied — paste in Teams"
          : kind === "guide"
            ? "Full guide copied as plain text"
            : "Accounts copied"
      );
    } catch {
      toast.error("Copy failed — try again");
    } finally {
      setCopying(null);
    }
  }

  const actions: GuideActionItem[] = [
    {
      id: "invite",
      label: "Share access invite",
      busyLabel: "Copying…",
      busy: copying === "invite",
      disabled: Boolean(copying),
      onClick: () => void handleCopy("invite"),
      tone: "sky",
    },
    {
      id: "copy-guide",
      label: "Copy full guide",
      busyLabel: "Copying…",
      busy: copying === "guide",
      disabled: Boolean(copying),
      onClick: () => void handleCopy("guide"),
      tone: "indigo",
    },
    {
      id: "copy-accounts",
      label: "Copy accounts only",
      busyLabel: "Copying…",
      busy: copying === "accounts",
      disabled: Boolean(copying),
      onClick: () => void handleCopy("accounts"),
      tone: "emerald",
    },
    {
      id: "architecture",
      label: "Open Architecture",
      href: DEMO_ARCHITECTURE_URL,
      tone: "amber",
    },
    {
      id: "docs",
      label: "Open full documentation",
      href: DEMO_DOCS_URL,
      tone: "outline",
    },
    {
      id: "app",
      label: "Open App",
      href: DEMO_APP_URL,
      external: true,
      tone: "outline",
    },
    {
      id: "exit",
      label: "Exit access",
      onClick: handleExitAccess,
      tone: "danger",
    },
  ];

  return (
    <div className="relative min-w-0 flex-1 bg-[#e8edf4]">
      <GuideActionBar
        title="Demo guide"
        actions={actions}
        barRef={topBarRef}
        onLayoutChange={measureTopBar}
      />

      <GuideJumpBar items={DEMO_JUMP_CHIPS} />

      <div style={{ height: topBarH + 44 }} aria-hidden />

      <div className="mx-auto w-full max-w-[1600px] px-2.5 py-3 sm:px-6 sm:py-7 lg:px-8">
        <div
          ref={contentRef}
          className="docs-guide-body min-w-0 overflow-x-clip rounded-xl border border-slate-400 bg-white shadow-xl sm:rounded-2xl"
        >
          {/* Brand header — matches docs-guide */}
          <div className="pad" style={{ background: "#203c62" }}>
            <div className="brand-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Ace_logo_small_light.png"
                alt=""
                width={44}
                height={44}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: "#0b1a2e",
                  objectFit: "contain",
                }}
              />
              <div>
                <div className="brand-title">
                  Aceolution <span style={{ color: "#70bcfc" }}>Finance</span>
                </div>
                <div
                  style={{
                    marginTop: 2,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    color: "#93c5fd",
                    textTransform: "uppercase",
                  }}
                >
                  Full Live Demo Guide · Expense Approval &amp; Tracking
                </div>
              </div>
            </div>
            <div style={{ fontSize: 14, color: "#dbeafe", fontWeight: 600, lineHeight: 1.45 }}>
              Sign-in → every role → end-to-end expense cycle · login security · FX · approvals ·
              payments · audit &amp; Excel
            </div>
            <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
              <a
                href={DEMO_APP_URL}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: 40,
                  padding: "0 14px",
                  borderRadius: 10,
                  background: "#fff",
                  color: "#203c62",
                  fontWeight: 800,
                  fontSize: 13,
                  textDecoration: "none",
                }}
              >
                Open App →
              </a>
              <a
                href={DEMO_API_URL}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: 40,
                  padding: "0 14px",
                  borderRadius: 10,
                  border: "1.5px solid rgba(255,255,255,0.45)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 13,
                  textDecoration: "none",
                }}
              >
                Wake Backend API
              </a>
            </div>
          </div>

          <div className="pad">
            <p style={{ margin: "0 0 12px", fontSize: 15, lineHeight: 1.65, color: "#334155" }}>
              Use this guide for live demos. For page-by-page screenshots and every success/error
              path, open the{" "}
              <a href={DEMO_DOCS_URL}>
                <strong>Full App Documentation</strong>
              </a>
              .
            </p>

            <div className="toc">
              <strong style={{ color: "#0f172a" }}>Contents · click any item to jump</strong>
              <br />
              {DEMO_SECTIONS.map((section, i) => (
                <span key={section.id}>
                  <a href={`#${section.id}`}>
                    {i + 1}. {section.label}
                  </a>
                  <br />
                </span>
              ))}
            </div>
          </div>

          {/* Live URLs */}
          <GuideSection title="Live URLs">
            <div className="section-title">Live URLs</div>
            <div className="scroll-x">
              <table>
                <tbody>
                  <tr>
                    <th style={{ width: "28%" }}>Frontend (App)</th>
                    <td>
                      <a href={DEMO_APP_URL} target="_blank" rel="noreferrer">
                        {DEMO_APP_URL}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <th>Backend (API)</th>
                    <td>
                      <a href={DEMO_API_URL} target="_blank" rel="noreferrer">
                        {DEMO_API_URL}
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="block ex">
              <h4>Note</h4>
              Hosted on Azure (Static Web Apps + App Service). Use the Frontend URL for the app and
              the Backend URL for the API.
            </div>
          </GuideSection>

          {/* 1 Accounts */}
          <GuideSection id="accounts" title="1) Test accounts">
            <div className="section-title">1) Test accounts</div>
            <p className="meta">
              Primary accounts use real Gmail inboxes for Email OTP. Requester/Approver are
              project-scoped — pick a project both share (Media pair below).
            </p>
            <div className="scroll-x">
              <table>
                <thead>
                  <tr>
                    <th>Use as</th>
                    <th>Email</th>
                    <th>Password</th>
                    <th>Role</th>
                    <th>Assigned projects</th>
                    <th>Login 2FA</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_ACCOUNTS.map((account) => (
                    <tr key={account.email}>
                      <td>
                        <strong>{account.label}</strong>
                      </td>
                      <td>
                        <code>{account.email}</code>
                      </td>
                      <td>
                        <code>{account.password}</code>
                      </td>
                      <td>{account.role}</td>
                      <td>{account.projects}</td>
                      <td>{account.login2fa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="meta">
              *Admin has no email OTP by default. Optional Authenticator app can be enabled in
              Profile.
            </p>

            <div className="block info">
              <h4>Project-scoped demo users (Demo Access)</h4>
              Different Requesters and Approvers for different project groups. Prefer{" "}
              <strong>Demo Access</strong> on the login page (dynamic list from the demo database).
              One click signs you into the demo store only — no Microsoft / OTP.
            </div>
            <div className="scroll-x">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Password</th>
                    <th>Role</th>
                    <th>Assigned projects</th>
                    <th>Login</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_EXTRA_STAFF.map((staff) => (
                    <tr key={staff.email}>
                      <td>
                        <strong>{staff.name}</strong>
                      </td>
                      <td>
                        <code>{staff.email}</code>
                      </td>
                      <td>
                        <code>{staff.password}</code>
                      </td>
                      <td>{staff.role}</td>
                      <td>{staff.projects}</td>
                      <td>{staff.login2fa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="block ok">
              <h4>Pairing tip</h4>
              Requester News ↔ Approver Media (GNL/GNP) · Requester Systems ↔ Approver Systems ·
              Requester Ops ↔ Approver Ops · Requester GAC ↔ Approver Media.
            </div>
          </GuideSection>

          {/* 2 Sign in */}
          <GuideSection id="sign-in" title="2) How to sign in">
            <div className="section-title">2) How to sign in</div>
            <div className="block info">
              <h4>Steps</h4>
              <ol style={{ margin: 0, paddingLeft: "1.2rem", lineHeight: 1.55 }}>
                {DEMO_SIGN_IN_STEPS.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </GuideSection>

          {/* 3 Workflow */}
          <GuideSection id="workflow" title="3) Complete business flow">
            <div className="section-title">3) Complete business flow</div>
            <p className="meta">This is the proper path that exercises every major function.</p>
            <div className="block ex">
              <h4>FLOW A — Happy path with partial payment</h4>
            </div>
            {DEMO_FLOW_A_STEPS.map((step) => (
              <div key={step.id} className="block info" style={{ marginBottom: 12 }}>
                <h4>
                  {step.id} — {step.title}
                </h4>
                <ul style={{ margin: "0 0 8px", paddingLeft: "1.2rem", lineHeight: 1.55 }}>
                  {step.body.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                {step.actions ? (
                  <div className="scroll-x" style={{ marginBottom: 0 }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Action</th>
                          <th>Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {step.actions.map((action) => (
                          <tr key={action.action}>
                            <td>
                              <strong>{action.action}</strong>
                            </td>
                            <td>{action.result}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
                {step.tip ? (
                  <div className="block ex" style={{ marginTop: 8, marginBottom: 0 }}>
                    <h4>Tip</h4>
                    {step.tip}
                  </div>
                ) : null}
              </div>
            ))}
            <div className="block ok">
              <h4>FLOW B — Quick reject path (optional second test)</h4>
              Submit another expense as Requester → Approver <strong>Reject</strong> (reason
              required) → status Rejected by Approver · requester notified. Or approve then
              Processor <strong>Reject Payout</strong> → Rejected by Processor.
            </div>
          </GuideSection>

          {/* 4 Audit */}
          <GuideSection id="audit" title="4) Verify audit trail">
            <div className="section-title">4) Verify audit trail</div>
            <div className="block info">
              <h4>Expense Details &amp; Audit</h4>
              Open the paid request and confirm:
              <ul style={{ margin: "8px 0 0", paddingLeft: "1.2rem", lineHeight: 1.55 }}>
                {DEMO_AUDIT_CHECKS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="block ok">
              <h4>Excel export</h4>
              Analytics / Tracker → Export Excel — sheets: Expense Report · Change Requests ·
              Workflow History · Payment History
            </div>
          </GuideSection>

          {/* 5 Roles */}
          <GuideSection id="roles" title="5) Role capabilities">
            <div className="section-title">5) Role capabilities</div>
            {DEMO_ROLE_CAPABILITIES.map((role) => (
              <div key={role.role} className="block info">
                <h4>{role.role}</h4>
                {role.canDo}
              </div>
            ))}
          </GuideSection>

          {/* 6 Status */}
          <GuideSection id="status" title="6) Typical status flow">
            <div className="section-title">6) Typical status flow</div>
            <div className="status-box">{`Submitted (Pending Approver)
→ optional Changes Requested → edit → resubmit
→ Approved (Pending Processing)
→ optional Partially Paid
→ Processed & Paid
(or Rejected by Approver / Rejected by Processor)`}</div>
          </GuideSection>

          {/* 7 Security */}
          <GuideSection id="security" title="7) Security features to try">
            <div className="section-title">7) Security features to try</div>
            <div className="block info">
              <h4>Checklist</h4>
              <ul style={{ margin: 0, paddingLeft: "1.2rem", lineHeight: 1.55 }}>
                {DEMO_SECURITY_FEATURES.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </GuideSection>

          {/* 8 UI */}
          <GuideSection id="ui-checks" title="8) What to watch for in the UI">
            <div className="section-title">8) What to watch for in the UI</div>
            <div className="block info">
              <h4>UI checks</h4>
              <ul style={{ margin: 0, paddingLeft: "1.2rem", lineHeight: 1.55 }}>
                {DEMO_UI_CHECKS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </GuideSection>

          <div className="pad-footer">
            <p style={{ margin: "0 0 10px", fontSize: 14, color: "#334155", lineHeight: 1.6 }}>
              Please try the full path above (<strong>FLOW A: A1→A7</strong>), verify audit + Excel
              export, and share feedback. For page-by-page success/error reference, open the{" "}
              <a href={DEMO_DOCS_URL}>
                <strong>Full App Documentation</strong>
              </a>
              .
            </p>
            <p style={{ margin: 0, fontSize: 15, color: "#0f172a" }}>
              Thanks,
              <br />
              <strong style={{ color: "#203c62" }}>Aceolution Finance</strong>
            </p>
          </div>

          <div
            style={{
              background: "#203c62",
              padding: "14px 16px",
              textAlign: "center",
              fontSize: 12,
              color: "#93c5fd",
            }}
          >
            Secure internal expense requests · multi-currency FX · approvals · disbursements · audit
            · payment tracking
          </div>
        </div>
      </div>
    </div>
  );
}
