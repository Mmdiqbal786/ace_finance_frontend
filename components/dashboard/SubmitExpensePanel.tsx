"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ExpenseRequestFields, {
  ExpenseRequestField,
  ExpenseRequestValues,
  validatorsForExpenseRequest,
} from "../expense/ExpenseRequestFields";
import { useFormValidation } from "../../hooks/useFormValidation";
import { API_URL } from "../../lib/api";
import { AuthUser } from "../../lib/auth";
import { readApiError } from "../../lib/apiError";
import { toast } from "../../lib/toast";
import { todayIso } from "../../lib/validation";
import { DASHBOARD_ROUTES } from "../../lib/dashboard/routes";
import { CategoryItem, CountryItem, Expense, ProjectItem } from "../../lib/dashboard/types";

interface SubmitExpensePanelProps {
  currentUser: AuthUser;
  categories: CategoryItem[];
  projects: ProjectItem[];
  countries: CountryItem[];
  catalogLoading?: boolean;
  onSubmitted?: () => void;
}

function emptyValues(user: AuthUser): ExpenseRequestValues {
  return {
    requesterName: user.name || "",
    requesterEmail: (user.email || "").toLowerCase(),
    country: "",
    amount: "",
    date: todayIso(),
    dueDate: "",
    project: "",
    category: "",
    description: "",
  };
}

export default function SubmitExpensePanel({
  currentUser,
  categories,
  projects,
  countries,
  catalogLoading = false,
  onSubmitted,
}: SubmitExpensePanelProps) {
  const [values, setValues] = useState<ExpenseRequestValues>(() => emptyValues(currentUser));
  const form = useFormValidation<ExpenseRequestField>();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState<Expense | null>(null);

  useEffect(() => {
    setValues((prev) => ({
      ...prev,
      requesterName: currentUser.name || prev.requesterName,
      requesterEmail: (currentUser.email || "").toLowerCase(),
      date: prev.date || todayIso(),
      category: categories.length === 1 && !prev.category ? categories[0].name : prev.category,
      project: projects.length === 1 && !prev.project ? projects[0].name : prev.project,
      country: countries.length === 1 && !prev.country ? countries[0].name : prev.country,
    }));
  }, [currentUser, categories, projects, countries]);

  const handleFieldChange = <K extends keyof ExpenseRequestValues>(
    field: K,
    value: ExpenseRequestValues[K]
  ) => {
    if (field === "requesterEmail") return;
    setValues((prev) => ({ ...prev, [field]: value }));
    if (submitError) setSubmitError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validators = validatorsForExpenseRequest(values, { categories, projects, countries });
    const ok = form.validateAll(validators);
    if (!ok) {
      form.focusFirstInvalid();
      setSubmitError("Please fix the highlighted fields before submitting.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterName: values.requesterName.trim(),
          requesterEmail: currentUser.email.trim().toLowerCase(),
          originalAmount: Number(values.amount),
          country: values.country,
          category: values.category,
          project: values.project,
          description: values.description.trim(),
          date: values.date,
          dueDate: values.dueDate,
        }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Failed to submit expense request."));
      }

      const result = (await response.json()) as Expense;
      setSuccess(result);
      setValues(emptyValues(currentUser));
      form.clearAll();
      toast.success("Expense request submitted.");
      onSubmitted?.();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit expense request.");
      toast.error(err.message || "Failed to submit expense request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="portal-card rounded-2xl shadow-xl p-6 sm:p-8 space-y-4 max-w-2xl">
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
          <h3 className="text-sm font-bold text-emerald-800">Request submitted successfully</h3>
          <p className="text-xs text-emerald-700 mt-1">
            Your expense request is now awaiting manager approval.
          </p>
        </div>
        <div className="text-sm space-y-2">
          <div className="flex justify-between gap-4">
            <span className="text-slate-600">Request ID</span>
            <span className="font-mono font-bold text-[var(--af-accent)]">{success.id}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-600">Amount (USD)</span>
            <span className="font-semibold text-slate-900">${success.amount.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Link
            href={DASHBOARD_ROUTES.myRequests}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--af-navy)] px-4 text-sm font-semibold text-white hover:bg-[var(--af-navy-soft)] transition-colors"
          >
            View My Requests
          </Link>
          <button
            type="button"
            onClick={() => setSuccess(null)}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  const catalogError =
    !catalogLoading && (categories.length === 0 || projects.length === 0 || countries.length === 0);

  return (
    <div className="portal-card rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 max-w-3xl">
      <div className="mb-5 pb-4 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span>📄</span> New Expense Request
        </h3>
        <p className="text-xs text-slate-600 mt-1">
          Fields marked with <span className="text-rose-500 font-bold">*</span> are required.
        </p>
      </div>

      {catalogError && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          Form options are incomplete — contact an admin if country, project, or category lists are
          empty.
        </div>
      )}

      {submitError && (
        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <ExpenseRequestFields
          values={values}
          onChange={handleFieldChange}
          errors={form.errors}
          clearError={form.clearError}
          onBlurField={form.onBlur}
          fieldClass={form.fieldClass}
          categories={categories}
          projects={projects}
          countries={countries}
          catalogLoading={catalogLoading}
          emailReadOnly
          showRequiredNote={false}
        />

        <button
          type="submit"
          disabled={submitting || catalogError}
          className="w-full h-11 rounded-xl bg-[var(--af-navy)] hover:bg-[var(--af-navy-soft)] text-sm font-bold text-white shadow transition-colors cursor-pointer disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Expense Request"}
        </button>
      </form>
    </div>
  );
}
