"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ExpenseRequestFields, {
  ExpenseRequestField,
  ExpenseRequestValues,
  validatorsForExpenseRequest,
} from "../expense/ExpenseRequestFields";
import FormField from "../FormField";
import Modal from "../Modal";
import { useFormValidation } from "../../hooks/useFormValidation";
import { API_URL, apiFetch } from "../../lib/api";
import { AuthUser, authTokenHeaders } from "../../lib/auth";
import { readApiError } from "../../lib/apiError";
import { toast } from "../../lib/toast";
import AppIcon, { AppIconName } from "../icons/AppIcon";
import StatusBadge from "../StatusBadge";
import { todayIso } from "../../lib/validation";
import {
  CategoryItem,
  CountryItem,
  Expense,
  ProjectItem,
  ParsedInvoiceData,
  ParsedInvoiceResponse,
} from "../../lib/dashboard/types";
import { DASHBOARD_ROUTES } from "../../lib/dashboard/routes";
import { canRequesterEditExpense } from "../../lib/dashboard/payment";
import DuplicateWarningMessage from "./DuplicateWarningMessage";

const SUBMIT_FLOW_STEPS: {
  step: string;
  title: string;
  detail: string;
  icon: AppIconName;
  tone: string;
  iconColor: string;
  line: string;
}[] = [
  {
    step: "1",
    title: "You submit",
    detail: "Fill the form and attach your invoice. You get a Request ID right away.",
    icon: "document",
    tone: "border-violet-200 bg-violet-50",
    iconColor: "#7c3aed",
    line: "bg-violet-300",
  },
  {
    step: "2",
    title: "Approver review",
    detail: "Your project manager can approve, reject, or ask you for changes.",
    icon: "shield",
    tone: "border-sky-200 bg-sky-50",
    iconColor: "#0284c7",
    line: "bg-sky-300",
  },
  {
    step: "3",
    title: "Finance payout",
    detail: "Processor records full or partial payment and uploads receipts.",
    icon: "money",
    tone: "border-emerald-200 bg-emerald-50",
    iconColor: "#059669",
    line: "bg-emerald-300",
  },
  {
    step: "4",
    title: "Track status",
    detail: "Follow every update here and in My Requests until it is fully paid.",
    icon: "chart",
    tone: "border-amber-200 bg-amber-50",
    iconColor: "#d97706",
    line: "bg-amber-300",
  },
];

interface SubmitExpensePanelProps {
  currentUser: AuthUser;
  categories: CategoryItem[];
  projects: ProjectItem[];
  countries: CountryItem[];
  catalogLoading?: boolean;
  expenses?: Expense[];
  onViewExpense?: (expense: Expense) => void;
  onEditExpense?: (expense: Expense) => void;
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
const IS_INVOICE_PARSE_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_INVOICE_PARSE === "true" ||
  process.env.NEXT_PUBLIC_ENABLE_INVOICE_PARSE === "1";

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
  expenses = [],
  onViewExpense,
  onEditExpense,
  onSubmitted,
}: SubmitExpensePanelProps) {
  const [values, setValues] = useState<ExpenseRequestValues>(() => emptyValues(currentUser));
  const form = useFormValidation<ExpenseRequestField>();

  const recentRequests = useMemo(() => {
    return [...expenses]
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 4);
  }, [expenses]);

  const needsUpdateCount = useMemo(
    () => expenses.filter((e) => e.status === "CHANGES_REQUESTED").length,
    [expenses]
  );
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceError, setInvoiceError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [potentialDuplicateWarning, setPotentialDuplicateWarning] = useState<string | null>(null);
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `sub-${Date.now()}-${Math.random()}`
  );
  const [parsingInvoice, setParsingInvoice] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedInvoiceData | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [convertingFx, setConvertingFx] = useState(false);
  const [convertedFxInfo, setConvertedFxInfo] = useState<{
    from: string;
    to: string;
    rate: number;
    original: number;
    converted: number;
  } | null>(null);

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

  const selectedCountry = useMemo(() => {
    return countries.find((c) => c.name === values.country);
  }, [countries, values.country]);

  const currency = useMemo(() => {
    return (selectedCountry?.currency || "USD").toUpperCase();
  }, [selectedCountry]);

  const matchingCountryForInvoice = useMemo(() => {
    if (!parsedData?.currency) return null;
    const docCurr = parsedData.currency.toUpperCase();
    return (
      countries.find((c) => {
        if (docCurr === "USD") return c.name === "United States";
        if (docCurr === "INR") return c.name === "India";
        if (docCurr === "AED") return c.name === "United Arab Emirates";
        if (docCurr === "GBP") return c.name === "United Kingdom";
        if (docCurr === "EUR") return c.name === "Germany" || c.name === "France";
        return (c.currency || "").toUpperCase() === docCurr;
      }) ||
      countries.find((c) => (c.currency || "").toUpperCase() === docCurr) ||
      null
    );
  }, [countries, parsedData?.currency]);

  const currencyMismatch = useMemo(() => {
    if (!parsedData?.currency || !values.country) return false;
    return parsedData.currency.toUpperCase() !== currency;
  }, [parsedData?.currency, values.country, currency]);

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
    if (field === "country") {
      setConvertedFxInfo(null);
    }
    if (submitError) setSubmitError("");
    if (potentialDuplicateWarning) {
      setPotentialDuplicateWarning(null);
      setDuplicateConfirmed(false);
    }
  };

  const handleSwitchToInvoiceCountry = () => {
    if (!matchingCountryForInvoice) return;
    setValues((prev) => ({
      ...prev,
      country: matchingCountryForInvoice.name,
      amount: parsedData?.amount ? String(parsedData.amount) : prev.amount,
    }));
    setConvertedFxInfo(null);
    toast.success(`Country switched to ${matchingCountryForInvoice.name} (${parsedData?.currency}).`);
  };

  const handleConvertToLocalCurrency = async () => {
    if (!parsedData?.currency || !parsedData?.amount || !currency) return;
    setConvertingFx(true);
    try {
      const res = await apiFetch(
        `${API_URL}/fx/convert?from=${encodeURIComponent(parsedData.currency)}&to=${encodeURIComponent(currency)}&amount=${parsedData.amount}`,
        { headers: authTokenHeaders() },
      );
      if (res.ok) {
        const json = await res.json();
        const converted = json.convertedAmount;
        setValues((prev) => ({
          ...prev,
          amount: String(converted),
        }));
        setConvertedFxInfo({
          from: parsedData.currency,
          to: currency,
          rate: json.exchangeRate,
          original: parsedData.amount,
          converted,
        });
        toast.success(`Converted ${parsedData.currency} ${parsedData.amount} → ${currency} ${converted} at live rate ${json.exchangeRate}.`);
      } else {
        toast.error("Could not fetch live exchange rate.");
      }
    } catch {
      toast.error("FX conversion error. Please enter the local amount manually.");
    } finally {
      setConvertingFx(false);
    }
  };

  const handleInvoiceChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setInvoiceFile(file);
    const err = validateInvoiceFile(file);
    setInvoiceError(err);
    if (submitError) setSubmitError("");
    if (potentialDuplicateWarning) {
      setPotentialDuplicateWarning(null);
      setDuplicateConfirmed(false);
    }
    setParsedData(null);
    setConvertedFxInfo(null);

    if (IS_INVOICE_PARSE_ENABLED && file && !err) {
      setParsingInvoice(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await apiFetch(`${API_URL}/expenses/parse-invoice`, {
          method: "POST",
          headers: authTokenHeaders(),
          body: formData,
        });
        if (res.ok) {
          const json: ParsedInvoiceResponse = await res.json();
          if (json.success && json.data) {
            const d = json.data;
            setParsedData(d);
            let matchedCountryName = "";
            setValues((prev) => {
              const updated = { ...prev };
              // Always sync invoice number with newly parsed document
              updated.invoiceNumber = d.invoiceNumber || "";
              if (d.invoiceDate) {
                updated.invoiceDate = d.invoiceDate;
              }
              if (d.descriptionSuggestion) {
                updated.description = d.descriptionSuggestion;
              }
              if (d.categorySuggestion) {
                const matched = categories.find(
                  (c) =>
                    c.name.toLowerCase() === d.categorySuggestion?.toLowerCase() ||
                    c.label.toLowerCase() === d.categorySuggestion?.toLowerCase() ||
                    c.name.toLowerCase().includes(d.categorySuggestion?.toLowerCase() || "")
                );
                if (matched) {
                  updated.category = matched.name;
                }
              }

              // Auto-match country to invoice currency if available
              if (d.currency) {
                const docCurr = d.currency.toUpperCase();
                const matched =
                  countries.find((c) => {
                    if (docCurr === "USD") return c.name === "United States";
                    if (docCurr === "INR") return c.name === "India";
                    if (docCurr === "AED") return c.name === "United Arab Emirates";
                    if (docCurr === "GBP") return c.name === "United Kingdom";
                    if (docCurr === "EUR") return c.name === "Germany" || c.name === "France";
                    return (c.currency || "").toUpperCase() === docCurr;
                  }) ||
                  countries.find((c) => (c.currency || "").toUpperCase() === docCurr);

                if (matched) {
                  updated.country = matched.name;
                  matchedCountryName = matched.name;
                }
              }

              if (d.amount) {
                updated.amount = d.amount.toString();
              }
              return updated;
            });
            toast.success(
              `Document parsed via ${d.parseMethod === "pdf-parse" ? "PDF Parse" : "Tesseract OCR"}${
                matchedCountryName ? ` · Auto-selected ${matchedCountryName} (${d.currency})` : ""
              }.`
            );
          }
        }
      } catch (parseErr) {
        console.warn("Parse document error:", parseErr);
      } finally {
        setParsingInvoice(false);
      }
    }
  };

  const handleRemoveAttachment = () => {
    setInvoiceFile(null);
    setInvoiceError("");
    setParsedData(null);
    setConvertedFxInfo(null);
    const input = document.getElementById("invoice") as HTMLInputElement | null;
    if (input) input.value = "";
    if (potentialDuplicateWarning) {
      setPotentialDuplicateWarning(null);
      setDuplicateConfirmed(false);
    }
    if (/duplicate invoice file|file hash|attachment/i.test(submitError)) {
      setSubmitError("");
    }
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

  const confirmAndSubmit = async (overrideConfirmed?: boolean) => {
    if (!invoiceFile) return;

    const isConfirmed = overrideConfirmed ?? duplicateConfirmed;
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
      if (isConfirmed) {
        formData.append("duplicateConfirmed", "true");
      }
      if (idempotencyKey) {
        formData.append("idempotencyKey", idempotencyKey);
      }

      const response = await apiFetch(`${API_URL}/expenses`, {
        method: "POST",
        headers: authTokenHeaders(),
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Failed to submit expense request."));
      }

      const result = (await response.json()) as Expense;
      setConfirmOpen(false);
      setIsDuplicateModalOpen(false);
      setValues(emptyValues(currentUser));
      setInvoiceFile(null);
      setInvoiceError("");
      setPotentialDuplicateWarning(null);
      setDuplicateConfirmed(false);
      setIdempotencyKey(
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `sub-${Date.now()}-${Math.random()}`
      );
      form.clearAll();
      toast.success("Expense request submitted.", {
        sticky: true,
        center: true,
        detail: `Expense ID: ${result.id}`,
      });
      onSubmitted?.();
    } catch (err: any) {
      setConfirmOpen(false);
      const msg = err.message || "Failed to submit expense request.";
      if (msg.includes("POTENTIAL_DUPLICATE:")) {
        const cleanMsg = msg.replace("POTENTIAL_DUPLICATE:", "").trim();
        setPotentialDuplicateWarning(cleanMsg);
        setIsDuplicateModalOpen(true);
        setSubmitError("");
      } else {
        setIsDuplicateModalOpen(false);
        setSubmitError(msg);
        const isDuplicateError = /duplicate/i.test(msg);
        if (isDuplicateError) {
          const colonIndex = msg.indexOf(":");
          if (colonIndex > 0 && colonIndex < 60) {
            const title = msg.slice(0, colonIndex).trim();
            const detail = msg.slice(colonIndex + 1).trim();
            toast.error(title, {
              sticky: true,
              center: true,
              detail,
            });
          } else {
            toast.error(msg, {
              sticky: true,
              center: true,
            });
          }
        } else {
          toast.error(msg);
        }
      }
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
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_19rem] xl:items-stretch">
    <div className="portal-card flex h-full min-w-0 flex-col rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
      <div className="mb-5 pb-4 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <AppIcon name="document" size="md" /> New Expense Request
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
        <div className="mb-4 flex items-start justify-between gap-3 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 animate-[af-toast-in_0.2s_ease-out]">
          <div className="flex items-start gap-2.5 min-w-0">
            <span className="mt-0.5 shrink-0 text-rose-500 font-bold text-sm">⚠️</span>
            <span className="break-words font-medium leading-relaxed">{submitError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSubmitError("")}
            className="shrink-0 -mr-1 -mt-1 rounded-lg p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
            aria-label="Remove message"
            title="Remove this message"
          >
            <AppIcon name="close" size="xs" color="currentColor" />
          </button>
        </div>
      )}


      {IS_INVOICE_PARSE_ENABLED && parsingInvoice && (
        <div className="mb-4 rounded-xl bg-sky-50 border border-sky-200 p-3 text-xs text-sky-900 flex items-center gap-2.5">
          <span className="text-base animate-pulse">📄</span>
          <div>
            <strong className="font-semibold block">Analyzing document (Zero-AI: PDF Parse / OCR)...</strong>
            <span>Extracting text locally to auto-fill invoice number, dates, and amounts.</span>
          </div>
        </div>
      )}

      {IS_INVOICE_PARSE_ENABLED && parsedData && (
        <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-xs text-emerald-950 flex items-start gap-2.5">
          <span className="text-base">⚡</span>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <strong className="font-semibold text-emerald-900">
                Document Auto-Extracted ({parsedData.parseMethod === "pdf-parse" ? "PDF Parse" : "Tesseract OCR"})
              </strong>
              <button
                type="button"
                onClick={() => setParsedData(null)}
                className="text-slate-400 hover:text-slate-600 text-[11px] cursor-pointer"
              >
                Dismiss
              </button>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-2 text-[11px]">
              {parsedData.invoiceNumber && (
                <span className="bg-white/90 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                  Invoice #: <strong>{parsedData.invoiceNumber}</strong>
                </span>
              )}
              {parsedData.invoiceDate && (
                <span className="bg-white/90 px-2 py-0.5 rounded border border-emerald-200">
                  Date: <strong>{parsedData.invoiceDate}</strong>
                </span>
              )}
              {parsedData.amount && (
                <span className="bg-white/90 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                  Amount: <strong>{parsedData.currency || "$"} {parsedData.amount}</strong>
                </span>
              )}
              {parsedData.vendor && (
                <span className="bg-white/90 px-2 py-0.5 rounded border border-emerald-200">
                  Vendor: <strong>{parsedData.vendor}</strong>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {IS_INVOICE_PARSE_ENABLED && currencyMismatch && parsedData && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50/95 p-3.5 text-xs text-amber-950 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0">💱</span>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <strong className="text-amber-950 font-bold text-sm">
                  Currency Mismatch Detected
                </strong>
                <span className="text-[11px] font-semibold bg-amber-200/90 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                  Invoice: {parsedData.currency} · Selected Country: {currency}
                </span>
              </div>
              <p className="mt-1 text-amber-900 leading-relaxed">
                The invoice was billed in <strong>{parsedData.currency} ({parsedData.currency === "USD" ? "$" : ""}{parsedData.amount})</strong>, but the selected country ({values.country}) uses <strong>{currency}</strong>. If submitted as-is, the amount will be processed as {currency}.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {matchingCountryForInvoice && (
                  <button
                    type="button"
                    onClick={handleSwitchToInvoiceCountry}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
                  >
                    <span>🌐</span>
                    <span>Switch Country to {matchingCountryForInvoice.name} ({parsedData.currency})</span>
                  </button>
                )}
                <button
                  type="button"
                  disabled={convertingFx}
                  onClick={handleConvertToLocalCurrency}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-amber-100 text-amber-950 border border-amber-400 font-semibold text-xs shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span>🔄</span>
                  <span>
                    {convertingFx ? "Fetching Live FX Rate..." : `Convert to ${currency} (Live FX Rate)`}
                  </span>
                </button>
              </div>
              {convertedFxInfo && (
                <div className="mt-2.5 text-[11px] text-emerald-900 bg-emerald-50 border border-emerald-300 p-2.5 rounded-lg font-medium">
                  ✓ <strong>Converted successfully:</strong> {convertedFxInfo.from} {convertedFxInfo.original} × {convertedFxInfo.rate} = <strong>{convertedFxInfo.to} {convertedFxInfo.converted}</strong> (updated in Amount field).
                </div>
              )}
            </div>
          </div>
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
            onClick={(e) => {
              (e.target as HTMLInputElement).value = "";
            }}
            onChange={handleInvoiceChange}
            disabled={submitting || noAssignedProjects}
            className={`af-input${invoiceError ? " is-invalid" : ""} file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200`}
            aria-invalid={Boolean(invoiceError)}
          />
          {invoiceFile && !invoiceError && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-600 truncate">
                    Selected:{" "}
                    <span className="font-semibold text-slate-800 break-all">{invoiceFile.name}</span>
                    {" · "}
                    <span className="text-slate-500 font-medium">{formatBytes(invoiceFile.size)}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveAttachment}
                  disabled={submitting}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                  aria-label="Remove attachment"
                  title="Remove selected attachment"
                >
                  <AppIcon name="trash" size="xs" color="currentColor" />
                  <span>Remove Attachment</span>
                </button>
              </div>
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
            onClick={() => confirmAndSubmit()}
            disabled={submitting}
            className="h-10 rounded-xl bg-[var(--af-navy)] px-5 text-sm font-bold text-white hover:bg-[var(--af-navy-soft)] disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Submitting..." : "Confirm & Submit"}
          </button>
        </div>
      </Modal>

      {/* Potential Duplicate Warning Dialog Modal */}
      <Modal
        isOpen={isDuplicateModalOpen}
        onClose={() => {
          if (!submitting) {
            setIsDuplicateModalOpen(false);
            setDuplicateConfirmed(false);
          }
        }}
        title={
          <span className="flex items-center gap-2.5 text-amber-950 font-bold text-lg">
            <span className="text-2xl">⚠️</span>
            <span>Potential Duplicate Detected</span>
          </span>
        }
        maxWidthClass="max-w-xl"
      >
        <p className="text-xs text-slate-600 mb-3">
          Our system detected a similar expense recently submitted under this project:
        </p>

        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950 leading-relaxed shadow-sm">
          <strong className="block font-semibold text-amber-900 text-sm mb-1">
            Matching Expense Details
          </strong>
          <p className="text-amber-900 leading-relaxed mb-2 font-medium">
            {potentialDuplicateWarning ? (
              <DuplicateWarningMessage
                reason={potentialDuplicateWarning}
                expenses={expenses}
                onOpen={onViewExpense}
              />
            ) : null}
          </p>
          <p className="text-amber-800 text-[11px] border-t border-amber-200/80 pt-2">
            If this is a legitimate separate and distinct expense (such as a second taxi ride, separate team meal, or subsequent service on the same day), please check the confirmation box below to proceed with submission.
          </p>
        </div>

        <label className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-300 bg-white hover:bg-amber-50/50 cursor-pointer transition-colors mt-4 shadow-sm">
          <input
            type="checkbox"
            checked={duplicateConfirmed}
            onChange={(e) => setDuplicateConfirmed(e.target.checked)}
            className="mt-0.5 rounded border-amber-400 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
          />
          <span className="text-xs font-semibold text-slate-800 leading-normal">
            I confirm this is a separate and distinct expense (e.g. separate meal, ride, or service on the same day).
          </span>
        </label>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              setIsDuplicateModalOpen(false);
              setDuplicateConfirmed(false);
            }}
            className="h-10 rounded-xl border border-slate-300 bg-white px-5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Go Back & Review
          </button>
          <button
            type="button"
            disabled={!duplicateConfirmed || submitting}
            onClick={() => confirmAndSubmit(true)}
            className="h-10 rounded-xl bg-amber-600 hover:bg-amber-700 px-5 text-xs font-bold text-white shadow transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="animate-spin text-sm">⏳</span>
                <span>Submitting...</span>
              </>
            ) : (
              <span>Confirm & Submit Expense</span>
            )}
          </button>
        </div>
      </Modal>
    </div>

    <aside className="portal-card flex h-full min-h-0 flex-col rounded-2xl shadow-xl p-5 sm:p-6">
      <div className="shrink-0">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <AppIcon name="clipboard" size="sm" /> What happens next
        </h4>
        <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
          Your expense moves through this flow after you submit.
        </p>
        <ol className="mt-4 space-y-0">
          {SUBMIT_FLOW_STEPS.map((item, index) => (
            <li key={item.step} className="relative flex gap-3">
              <div className="flex w-9 shrink-0 flex-col items-center">
                <span
                  className={`z-[1] flex h-9 w-9 items-center justify-center rounded-xl border ${item.tone}`}
                >
                  <AppIcon name={item.icon} size="sm" color={item.iconColor} />
                </span>
                {index < SUBMIT_FLOW_STEPS.length - 1 && (
                  <span className={`mt-1 mb-1 w-0.5 flex-1 min-h-[14px] rounded-full ${item.line}`} />
                )}
              </div>
              <div className={`mb-3 min-w-0 flex-1 rounded-xl border px-3 py-2.5 ${item.tone}`}>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: item.iconColor }}
                  >
                    {item.step}
                  </span>
                  <p className="text-xs font-bold text-slate-900">{item.title}</p>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{item.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-5 flex min-h-0 flex-1 flex-col border-t border-slate-200 pt-5">
        <div className="flex shrink-0 items-center justify-between gap-2">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AppIcon name="clock" size="sm" /> Your recent requests
          </h4>
          <span className="text-[11px] font-semibold text-slate-500">
            {recentRequests.length === 0
              ? "No data"
              : recentRequests.length === 1
                ? "1 request"
                : `Latest ${recentRequests.length}`}
          </span>
        </div>

        {needsUpdateCount > 0 && (
          <div className="mt-3 shrink-0 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5">
            <p className="text-xs font-semibold text-orange-800">
              {needsUpdateCount} request{needsUpdateCount === 1 ? "" : "s"} need
              {needsUpdateCount === 1 ? "s" : ""} your update
            </p>
            <p className="mt-0.5 text-[11px] text-orange-700">
              Open the item below and use Edit, or go to My Requests.
            </p>
          </div>
        )}

        {recentRequests.length === 0 ? (
          <div className="mt-3 flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-8 text-center">
            <AppIcon name="inbox" size="lg" color="#94a3b8" />
            <p className="mt-3 text-sm font-semibold text-slate-700">No data</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              Submit an expense and it will show up here with live status.
            </p>
          </div>
        ) : (
          <ul className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
            {recentRequests.map((expense) => {
              const canEdit = canRequesterEditExpense(expense);
              return (
                <li key={expense.id}>
                  <button
                    type="button"
                    onClick={() => onViewExpense?.(expense)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-left hover:border-slate-300 hover:bg-white transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-mono text-[11px] font-bold text-[var(--af-accent)] truncate">
                        {expense.id}
                      </p>
                      <p className="shrink-0 text-xs font-bold text-slate-900">
                        ${Number(expense.amount).toFixed(2)}
                      </p>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-600 truncate">
                      {expense.project || "—"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={expense.status} className="text-[10px] py-0.5" />
                      {canEdit && onEditExpense && (
                        <span
                          role="link"
                          tabIndex={0}
                          onClick={(event) => {
                            event.stopPropagation();
                            onEditExpense(expense);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              event.stopPropagation();
                              onEditExpense(expense);
                            }
                          }}
                          className="text-[11px] font-semibold text-[var(--af-accent)] hover:underline cursor-pointer"
                        >
                          Edit
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <Link
          href={DASHBOARD_ROUTES.myRequests}
          className="mt-4 inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
        >
          <AppIcon name="clipboard" size="sm" color="currentColor" />
          Open My Requests
        </Link>
      </div>
    </aside>
    </div>
  );
}
