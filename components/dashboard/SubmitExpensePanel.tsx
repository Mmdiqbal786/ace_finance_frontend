"use client";

import React, { useEffect, useMemo, useState } from "react";
import ExpenseRequestFields, {
  ExpenseRequestField,
  ExpenseRequestValues,
  validatorsForExpenseRequest,
} from "../expense/ExpenseRequestFields";
import FormField from "../FormField";
import Modal from "../Modal";
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

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDisplayDate(iso: string): string {
  if (!iso) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="text-right text-sm font-semibold text-slate-900 break-words">{value}</span>
    </div>
  );
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
  const [confirmOpen, setConfirmOpen] = useState(false);

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

  const currency = useMemo(() => {
    const selected = countries.find((c) => c.name === values.country);
    return (selected?.currency || "USD").toUpperCase();
  }, [countries, values.country]);

  const attachmentPreviewUrl = useMemo(() => {
    if (!invoiceFile) return null;
    const isImage = invoiceFile.type.startsWith("image/");
    const isPdf =
      invoiceFile.type === "application/pdf" || /\.pdf$/i.test(invoiceFile.name);
    if (!isImage && !isPdf) return null;
    return URL.createObjectURL(invoiceFile);
  }, [invoiceFile]);

  const attachmentIsPdf = Boolean(
    invoiceFile &&
      (invoiceFile.type === "application/pdf" || /\.pdf$/i.test(invoiceFile.name)),
  );

  const attachmentIsImage = Boolean(
    invoiceFile && invoiceFile.type.startsWith("image/"),
  );

  useEffect(() => {
    return () => {
      if (attachmentPreviewUrl) URL.revokeObjectURL(attachmentPreviewUrl);
    };
  }, [attachmentPreviewUrl]);

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

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    const expenseDate = todayIso();
    const submitValues = { ...values, date: expenseDate };
    const validators = validatorsForExpenseRequest(submitValues, {
      categories,
      projects,
      countries,
    });
    const fieldsOk = form.validateAll(validators);
    const invoiceMsg = validateInvoiceFile(invoiceFile);
    setInvoiceError(invoiceMsg);

    if (!fieldsOk || invoiceMsg) {
      form.focusFirstInvalid();
      setSubmitError("Please fix the highlighted fields before submitting.");
      return;
    }

    setSubmitError("");
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (submitting) return;
    setConfirmOpen(false);
  };

  const confirmAndSubmit = async () => {
    if (!invoiceFile) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      const expenseDate = todayIso();
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
      if (values.invoiceNumber.trim()) {
        formData.append("invoiceNumber", values.invoiceNumber.trim());
      }
      if (values.invoiceDate) formData.append("invoiceDate", values.invoiceDate);
      formData.append("invoice", invoiceFile);

      const response = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Failed to submit expense request."));
      }

      const result = (await response.json()) as Expense;
      setConfirmOpen(false);
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
      setConfirmOpen(false);
      setSubmitError(err.message || "Failed to submit expense request.");
      toast.error(err.message || "Failed to submit expense request.");
    } finally {
      setSubmitting(false);
    }
  };

  const catalogError =
    !catalogLoading && (categories.length === 0 || projects.length === 0 || countries.length === 0);

  const noAssignedProjects =
    currentUser.role === "REQUESTER" &&
    !(currentUser.assignedProjects && currentUser.assignedProjects.length > 0);

  return (
    <div className="portal-card rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 max-w-3xl">
      <div className="mb-5 pb-4 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span>📄</span> New Expense Request
        </h3>
      </div>

      {noAssignedProjects && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
          You have no projects assigned. Contact an administrator to assign projects before you can
          submit expenses.
        </div>
      )}

      {catalogError && !noAssignedProjects && (
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

      <form onSubmit={handleSubmitClick} noValidate className="space-y-4">
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
            disabled={submitting || noAssignedProjects}
            className={`af-input${invoiceError ? " is-invalid" : ""} file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200`}
            aria-invalid={Boolean(invoiceError)}
          />
          {invoiceFile && !invoiceError && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-600">
                Selected:{" "}
                <span className="font-semibold text-slate-800 break-all">{invoiceFile.name}</span>
                {" · "}
                {formatBytes(invoiceFile.size)}
              </p>
              {attachmentPreviewUrl && attachmentIsImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={attachmentPreviewUrl}
                  alt="Attachment preview"
                  className="mt-3 max-h-56 w-full rounded-lg border border-slate-200 object-contain bg-white"
                />
              )}
              {attachmentPreviewUrl && attachmentIsPdf && (
                <iframe
                  title="PDF attachment preview"
                  src={attachmentPreviewUrl}
                  className="mt-3 h-64 w-full rounded-lg border border-slate-200 bg-white"
                />
              )}
            </div>
          )}
        </FormField>

        <button
          type="submit"
          disabled={submitting || catalogError || noAssignedProjects}
          className="w-full h-11 rounded-xl bg-[var(--af-navy)] hover:bg-[var(--af-navy-soft)] text-sm font-bold text-white shadow transition-colors cursor-pointer disabled:opacity-50"
        >
          Submit Expense Request
        </button>
      </form>

      <Modal
        isOpen={confirmOpen}
        onClose={closeConfirm}
        title="Confirm submission"
        maxWidthClass="max-w-xl"
      >
        <p className="mb-4 text-sm text-slate-700">
          Please review the details below. Are you sure you want to submit this expense request?
        </p>

        <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/80 px-4">
          <SummaryRow label="Name" value={values.requesterName.trim() || "—"} />
          <SummaryRow label="Email" value={currentUser.email} />
          <SummaryRow label="Country" value={values.country || "—"} />
          <SummaryRow label="Project" value={values.project || "—"} />
          <SummaryRow label="Category" value={values.category || "—"} />
          <SummaryRow
            label="Invoice number"
            value={values.invoiceNumber.trim() || "—"}
          />
          <SummaryRow
            label="Invoice date"
            value={formatDisplayDate(values.invoiceDate)}
          />
          <SummaryRow label="Due date" value={formatDisplayDate(values.dueDate)} />
          <SummaryRow
            label={`Amount (${currency})`}
            value={
              values.amount
                ? `${Number(values.amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} ${currency}`
                : "—"
            }
          />
          <SummaryRow
            label="Description"
            value={
              <span className="whitespace-pre-wrap">{values.description.trim() || "—"}</span>
            }
          />
          <div className="py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Attachment
            </p>
            {invoiceFile ? (
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-sm font-semibold text-slate-900 break-all">
                  {invoiceFile.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  {invoiceFile.type || "file"} · {formatBytes(invoiceFile.size)}
                </p>
                {attachmentPreviewUrl && attachmentIsImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={attachmentPreviewUrl}
                    alt="Invoice preview"
                    className="mt-3 max-h-56 w-full rounded-lg border border-slate-200 object-contain bg-slate-50"
                  />
                )}
                {attachmentPreviewUrl && attachmentIsPdf && (
                  <iframe
                    title="PDF invoice preview"
                    src={attachmentPreviewUrl}
                    className="mt-3 h-64 w-full rounded-lg border border-slate-200 bg-slate-50"
                  />
                )}
              </div>
            ) : (
              <p className="text-sm text-rose-700">No attachment</p>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={closeConfirm}
            disabled={submitting}
            className="h-10 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmAndSubmit}
            disabled={submitting}
            className="h-10 rounded-xl bg-[var(--af-navy)] px-5 text-sm font-bold text-white hover:bg-[var(--af-navy-soft)] disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Submitting..." : "Confirm & Submit"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
