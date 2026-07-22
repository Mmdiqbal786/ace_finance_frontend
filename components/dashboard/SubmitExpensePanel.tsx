"use client";

import React, { useEffect, useState } from "react";
import ExpenseRequestFields, {
  ExpenseRequestField,
  ExpenseRequestValues,
  validatorsForExpenseRequest,
} from "../expense/ExpenseRequestFields";
import FormField from "../FormField";
import { useFormValidation } from "../../hooks/useFormValidation";
import { API_URL } from "../../lib/api";
import { AuthUser } from "../../lib/auth";
import { readApiError } from "../../lib/apiError";
import { toast } from "../../lib/toast";
import { todayIso } from "../../lib/validation";
import { CategoryItem, CountryItem, Expense, ProjectItem } from "../../lib/dashboard/types";

interface SubmitExpensePanelProps {
  currentUser: AuthUser;
  categories: CategoryItem[];
  projects: ProjectItem[];
  countries: CountryItem[];
  catalogLoading?: boolean;
  onSubmitted?: () => void;
}

const ALLOWED_INVOICE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_INVOICE_BYTES = 5 * 1024 * 1024;

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
    invoiceNumber: "",
    invoiceDate: "",
    description: "",
  };
}

function validateInvoiceFile(file: File | null): string {
  if (!file) return "Please attach an invoice.";
  if (!ALLOWED_INVOICE_TYPES.includes(file.type)) {
    return "Invoice must be a PDF or image (JPG, PNG, WEBP, GIF).";
  }
  if (file.size > MAX_INVOICE_BYTES) {
    return "Invoice file must be 5 MB or smaller.";
  }
  return "";
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
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceError, setInvoiceError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

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

  const handleInvoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setInvoiceFile(file);
    setInvoiceError(validateInvoiceFile(file));
    if (submitError) setSubmitError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const expenseDate = todayIso();
    const submitValues = { ...values, date: expenseDate };
    const validators = validatorsForExpenseRequest(submitValues, { categories, projects, countries });
    const fieldsOk = form.validateAll(validators);
    const invoiceMsg = validateInvoiceFile(invoiceFile);
    setInvoiceError(invoiceMsg);

    if (!fieldsOk || invoiceMsg) {
      form.focusFirstInvalid();
      setSubmitError("Please fix the highlighted fields before submitting.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const formData = new FormData();
      formData.append("requesterName", values.requesterName.trim());
      formData.append("requesterEmail", currentUser.email.trim().toLowerCase());
      formData.append("originalAmount", String(Number(values.amount)));
      formData.append("country", values.country);
      formData.append("category", values.category);
      formData.append("project", values.project);
      formData.append("description", values.description.trim());
      formData.append("date", expenseDate);
      formData.append("dueDate", values.dueDate);
      if (values.invoiceNumber.trim()) formData.append("invoiceNumber", values.invoiceNumber.trim());
      if (values.invoiceDate) formData.append("invoiceDate", values.invoiceDate);
      formData.append("invoice", invoiceFile as File);

      const response = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Failed to submit expense request."));
      }

      const result = (await response.json()) as Expense;
      setValues(emptyValues(currentUser));
      setInvoiceFile(null);
      setInvoiceError("");
      form.clearAll();
      toast.success("Expense request submitted.", {
        sticky: true,
        center: true,
        detail: `Expense ID: ${result.id}`,
      });
      onSubmitted?.();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit expense request.");
      toast.error(err.message || "Failed to submit expense request.");
    } finally {
      setSubmitting(false);
    }
  };

  const catalogError =
    !catalogLoading && (categories.length === 0 || projects.length === 0 || countries.length === 0);

  return (
    <div className="portal-card rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 max-w-3xl">
      <div className="mb-5 pb-4 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span>📄</span> New Expense Request
        </h3>
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
          hideExpenseDate
          showRequiredNote={false}
        />

        <FormField
          label="Attachment"
          htmlFor="invoice"
          required
          error={invoiceError}
          hint="PDF or image (JPG, PNG, WEBP, GIF), max 5 MB"
        >
          <input
            id="invoice"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,application/pdf,image/*"
            onChange={handleInvoiceChange}
            disabled={submitting}
            className={`af-input${invoiceError ? " is-invalid" : ""} file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200`}
            aria-invalid={Boolean(invoiceError)}
          />
          {invoiceFile && !invoiceError && (
            <p className="mt-1.5 text-xs text-slate-600">
              Selected: <span className="font-semibold text-slate-800">{invoiceFile.name}</span>
            </p>
          )}
        </FormField>

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
