import Link from "next/link";

const FEATURES = [
  {
    icon: "📄",
    title: "Submit Expenses",
    description:
      "Employees create reimbursement requests with project, category, and due date details.",
  },
  {
    icon: "✅",
    title: "Manager Approval",
    description: "Approvers review requests, add notes, and route approved items to finance.",
  },
  {
    icon: "💳",
    title: "Partial & Full Payout",
    description: "Processors record partial payments or mark requests fully paid with audit history.",
  },
  {
    icon: "📊",
    title: "Track & Export",
    description: "Real-time status tracking, analytics, and Excel reports for finance teams.",
  },
] as const;

export default function HomeLanding() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-[var(--af-bg)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(24,80,168,0.12),_transparent_60%)]" />
      <div className="pointer-events-none absolute -top-20 -left-16 h-52 w-52 rounded-full bg-sky-300/20 blur-3xl af-float-soft" />
      <div className="pointer-events-none absolute -bottom-24 -right-10 h-56 w-56 rounded-full bg-indigo-300/20 blur-3xl af-float-soft" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <section className="text-center af-animate-fade-up" style={{ animationDelay: "60ms" }}>
          <p className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--af-accent)] sm:text-xs">
            Aceolution Finance
          </p>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:mt-5 sm:text-5xl lg:text-6xl">
            Expense management
            <span className="mt-2 block af-title-accent sm:mt-3">built for your team</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm text-slate-600 sm:mt-8 sm:text-lg">
            A secure internal platform for expense requests, approvals, disbursements, and payment
            tracking — all in one dashboard.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row">
            <Link
              href="/login/"
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[var(--af-navy)] px-8 text-sm font-bold text-white shadow-lg shadow-[var(--af-navy)]/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--af-navy-soft)] hover:shadow-[0_12px_28px_rgba(32,60,98,0.22)] sm:w-auto"
            >
              Sign In to Dashboard
            </Link>
            <p className="text-sm text-slate-500">Contact your administrator for account access.</p>
          </div>
        </section>

        <section className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg af-animate-fade-up"
              style={{ animationDelay: `${140 + index * 90}ms` }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-lg transition-transform duration-300">
                {feature.icon}
              </span>
              <h2 className="mt-4 text-base font-bold text-slate-900">{feature.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
            </div>
          ))}
        </section>

        <section
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:mt-10 sm:p-8 af-animate-fade-up"
          style={{ animationDelay: "520ms" }}
        >
          <h2 className="text-lg font-bold text-slate-900">Private workspace only</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
            Public expense submission has been disabled. All requests are submitted by signed-in
            users from the dashboard.
          </p>
        </section>
      </div>
    </div>
  );
}
