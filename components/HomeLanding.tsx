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
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Expense management
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm text-slate-600 sm:mt-8 sm:text-lg">
            A secure internal platform for expense requests, approvals, disbursements, and payment
            tracking — all in one dashboard.
          </p>
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
      </div>
    </div>
  );
}
