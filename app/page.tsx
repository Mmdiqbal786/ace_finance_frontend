"use client";

import React, { useState, useEffect } from "react";
import StatusBadge from "../components/StatusBadge";
import TimelineView from "../components/TimelineView";
import { API_URL } from "../lib/api";
import { getUser, isAuthenticated } from "../lib/auth";
import { getDefaultDashboardRoute } from "../lib/dashboard/routes";

const CATEGORIES = [
  { id: "Travel", label: "Travel & Lodging", icon: "✈️" },
  { id: "Meals", label: "Meals & Entertainment", icon: "🍔" },
  { id: "Office", label: "Office Supplies", icon: "📎" },
  { id: "Software", label: "Software & SaaS", icon: "💻" },
  { id: "Other", label: "Other Expenses", icon: "📦" },
];

interface HistoryLog {
  action: string;
  timestamp: string;
  user: string;
  notes?: string;
}

interface Expense {
  id: string;
  requesterName: string;
  requesterEmail: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  status: string;
  submittedAt: string;
  approverNotes?: string;
  approvedAt?: string;
  processorNotes?: string;
  processedAt?: string;
  history: HistoryLog[];
}

type ExpenseFormFields = "requesterName" | "requesterEmail" | "amount" | "date" | "category" | "description";
type FieldErrors = Partial<Record<ExpenseFormFields, string>>;

const NAME_PATTERN = /^[A-Za-z][A-Za-z .'-]{1,79}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;
const MAX_AMOUNT = 100_000;
const MIN_DESCRIPTION = 1;
const MAX_DESCRIPTION = 500;

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

export default function PublicPortal() {
  const [mounted, setMounted] = useState(false);

  // Form states
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Software");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<ExpenseFormFields, boolean>>>({});

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<Expense | null>(null);
  const [submitError, setSubmitError] = useState("");

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Expense[]>([]);
  const [searchError, setSearchError] = useState("");
  
  // Tracked recently submitted IDs in this browser
  const [recentRequests, setRecentRequests] = useState<string[]>([]);
  const [lastSearch, setLastSearch] = useState("");

  const clearFieldError = (field: ExpenseFormFields) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const markTouched = (field: ExpenseFormFields) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validateField = (field: ExpenseFormFields, values?: {
    requesterName?: string;
    requesterEmail?: string;
    amount?: string;
    date?: string;
    category?: string;
    description?: string;
  }): string => {
    const v = {
      requesterName,
      requesterEmail,
      amount,
      date,
      category,
      description,
      ...values,
    };

    switch (field) {
      case "requesterName": {
        const name = v.requesterName.trim();
        if (!name) return "Name is required.";
        if (name.length < 2) return "Name must be at least 2 characters.";
        if (name.length > 80) return "Name must be 80 characters or fewer.";
        if (!NAME_PATTERN.test(name)) return "Use letters only (spaces, hyphens, and apostrophes allowed).";
        return "";
      }
      case "requesterEmail": {
        const email = v.requesterEmail.trim().toLowerCase();
        if (!email) return "Email address is required.";
        if (email.length > 120) return "Email must be 120 characters or fewer.";
        if (!EMAIL_PATTERN.test(email)) return "Enter a valid email like name@company.com.";
        if (email.endsWith("@example.com") || email.endsWith("@test.com")) {
          return "Please use a real work email address.";
        }
        return "";
      }
      case "amount": {
        const raw = v.amount.trim();
        if (!raw) return "Amount is required.";
        if (!AMOUNT_PATTERN.test(raw)) return "Use a valid amount with up to 2 decimal places.";
        const parsed = Number(raw);
        if (!Number.isFinite(parsed) || parsed <= 0) return "Amount must be greater than $0.00.";
        if (parsed < 1) return "Minimum expense amount is $1.00.";
        if (parsed > MAX_AMOUNT) return `Amount cannot exceed $${MAX_AMOUNT.toLocaleString()}.`;
        return "";
      }
      case "date": {
        if (!v.date) return "Expense date is required.";
        const today = todayIso();
        const oldest = daysAgoIso(365);
        if (v.date > today) return "Expense date cannot be in the future.";
        if (v.date < oldest) return "Expense date cannot be older than 1 year.";
        return "";
      }
      case "category": {
        if (!CATEGORIES.some((c) => c.id === v.category)) return "Please select a valid category.";
        return "";
      }
      case "description": {
        const text = v.description.trim();
        if (!text) return "Purpose / description is required.";
        if (text.length < MIN_DESCRIPTION) {
          return "Purpose / description is required.";
        }
        if (text.length > MAX_DESCRIPTION) {
          return `Description must be ${MAX_DESCRIPTION} characters or fewer.`;
        }
        return "";
      }
      default:
        return "";
    }
  };

  const validateForm = (): FieldErrors => {
    const fields: ExpenseFormFields[] = [
      "requesterName",
      "requesterEmail",
      "amount",
      "date",
      "category",
      "description",
    ];
    const errors: FieldErrors = {};
    for (const field of fields) {
      const message = validateField(field);
      if (message) errors[field] = message;
    }
    return errors;
  };

  const onFieldBlur = (field: ExpenseFormFields) => {
    markTouched(field);
    const message = validateField(field);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
  };
  const persistRecentRequests = (ids: string[]) => {
    setRecentRequests(ids);
    if (ids.length > 0) {
      localStorage.setItem("ace_finance_my_requests", JSON.stringify(ids));
    } else {
      localStorage.removeItem("ace_finance_my_requests");
    }
  };

  const persistLastSearch = (query: string) => {
    setLastSearch(query);
    localStorage.setItem("ace_finance_last_search", query);
  };

  const saveToRecent = (id: string) => {
    setRecentRequests((prev) => {
      const updated = [id, ...prev.filter((r) => r !== id)].slice(0, 5);
      localStorage.setItem("ace_finance_my_requests", JSON.stringify(updated));
      return updated;
    });
  };

  const validateRecentRequests = async (ids: string[]) => {
    const validIds: string[] = [];

    for (const id of ids) {
      try {
        const response = await fetch(`${API_URL}/expenses/${id}`);
        if (response.ok) {
          validIds.push(id);
        }
      } catch {
        // Ignore failed lookups while cleaning stale IDs
      }
    }

    persistRecentRequests(validIds);
    return validIds;
  };

  useEffect(() => {
    if (isAuthenticated()) {
      const user = getUser();
      window.location.href = user ? getDefaultDashboardRoute(user.role) : "/dashboard/";
      return;
    }

    setMounted(true);
    setDate(new Date().toISOString().split("T")[0]);

    const savedLastSearch = localStorage.getItem("ace_finance_last_search");
    if (savedLastSearch) {
      setLastSearch(savedLastSearch);
    }

    const saved = localStorage.getItem("ace_finance_my_requests");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as string[];
      if (!Array.isArray(parsed) || parsed.length === 0) return;

      void validateRecentRequests(parsed);
    } catch {
      localStorage.removeItem("ace_finance_my_requests");
    }
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    setFieldErrors(errors);
    setTouched({
      requesterName: true,
      requesterEmail: true,
      amount: true,
      date: true,
      category: true,
      description: true,
    });

    const errorCount = Object.keys(errors).length;
    if (errorCount > 0) {
      setSubmitError(
        `Please fix ${errorCount} field${errorCount > 1 ? "s" : ""} highlighted below before submitting.`
      );
      window.setTimeout(() => {
        document.querySelector<HTMLElement>(".af-input.is-invalid, .af-textarea.is-invalid")?.focus();
      }, 0);
      return;
    }

    const trimmedName = requesterName.trim();
    const trimmedEmail = requesterEmail.trim().toLowerCase();
    const trimmedDescription = description.trim();
    const parsedAmount = Number(amount);

    setSubmitError("");
    setSubmitting(true);
    setSubmitSuccess(null);

    try {
      const response = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterName: trimmedName,
          requesterEmail: trimmedEmail,
          amount: parsedAmount,
          category,
          description: trimmedDescription,
          date,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit request.");
      }

      const result = (await response.json()) as Expense;
      setSubmitSuccess(result);
      saveToRecent(result.id);
      
      // Reset form
      setRequesterName("");
      setRequesterEmail("");
      setAmount("");
      setDescription("");
      setCategory("Software");
      setFieldErrors({});
      setTouched({});
      setSubmitError("");
    } catch (err: any) {
      setSubmitError(err.message || "An error occurred during submission.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearch = async (queryParam?: string) => {
    const query = queryParam || searchQuery;
    if (!query) {
      setSearchError("Please enter a Request ID or Email.");
      return;
    }
    setSearchError("");
    setSearching(true);
    setSearchResults([]);

    try {
      if (query.trim().startsWith("EXP-")) {
        // Query is a Request ID
        const response = await fetch(`${API_URL}/expenses/${query.trim()}`);
        if (!response.ok) {
          throw new Error("Request ID not found.");
        }
        const item = (await response.json()) as Expense;
        setSearchResults([item]);
        persistLastSearch(query.trim());
      } else if (query.includes("@")) {
        // Query is an Email
        const response = await fetch(
          `${API_URL}/expenses?email=${encodeURIComponent(query.trim())}`
        );
        if (!response.ok) {
          throw new Error("Error fetching requests for email.");
        }
        const list = (await response.json()) as Expense[];
        if (list.length === 0) {
          setSearchError("No requests found for this email.");
        } else {
          setSearchResults(list);
          persistLastSearch(query.trim());
        }
      } else {
        setSearchError("Please enter a valid Request ID (EXP-xxx) or Email.");
      }
    } catch (err: any) {
      setSearchError(err.message || "No records found.");

      if (query.trim().startsWith("EXP-")) {
        const cleaned = recentRequests.filter((id) => id !== query.trim());
        if (cleaned.length !== recentRequests.length) {
          persistRecentRequests(cleaned);
        }
      }
    } finally {
      setSearching(false);
    }
  };



  return (
    <div className="portal-page relative flex flex-1 flex-col overflow-hidden">
      <div className="portal-bg" aria-hidden="true">
        <div className="portal-orb portal-orb--violet" />
        <div className="portal-orb portal-orb--indigo" />
        <div className="portal-orb portal-orb--cyan" />
        <div className="portal-grid" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl flex flex-1 flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Header */}
      <div className="text-center md:text-left mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Public Expense <span className="af-title-accent">Portal</span>
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-500">
          Submit reimbursement requests directly to management and track your payments in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form */}
        <div className="portal-card lg:col-span-7 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-50 text-[var(--af-accent)] text-sm">📝</span>
            New Expense Request
          </h2>

          {submitSuccess && (
            <div className="relative mb-6 rounded-xl bg-sky-50 border border-sky-200 p-5 pr-12 text-slate-900">
              <button
                type="button"
                onClick={() => setSubmitSuccess(null)}
                className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-sky-100 hover:text-slate-900 transition-colors cursor-pointer"
                aria-label="Dismiss success message"
              >
                ✕
              </button>
              <div className="flex items-center gap-3 mb-2 text-[var(--af-accent)] font-bold">
                <span className="text-xl">🎉</span> Request Submitted Successfully!
              </div>
              <p className="text-sm text-slate-600 mb-3">
                Your request has been logged and forwarded to User 1 (Approver) for review. Use the ID below to track updates.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-sm">
                <div>
                  <span className="text-slate-500">Request ID:</span>{" "}
                  <span className="text-[var(--af-accent)] font-semibold">{submitSuccess.id}</span>
                </div>
                <button
                  onClick={() => {
                    setSearchQuery(submitSuccess.id);
                    handleSearch(submitSuccess.id);
                  }}
                  className="text-xs font-semibold text-[var(--af-accent)] hover:text-[var(--af-accent-soft)] underline"
                >
                  Track in right panel
                </button>
              </div>
            </div>
          )}

          {submitError && (
            <div className="mb-6 rounded-xl bg-rose-50 border border-rose-300 p-4 text-sm font-semibold text-rose-800">
              ⚠️ {submitError}
              {Object.keys(fieldErrors).length > 0 && (
                <ul className="mt-2 space-y-1 text-xs font-medium list-disc pl-5">
                  {Object.values(fieldErrors).map((msg) => (
                    <li key={msg}>{msg}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {mounted ? (
          <form onSubmit={handleFormSubmit} noValidate className="space-y-5" suppressHydrationWarning>
            <p className="text-xs font-medium text-slate-600 -mt-1">
              Fields marked with <span className="af-required">*</span> are required
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="requesterName" className="af-label">
                  Name <span className="af-required" aria-hidden="true">*</span>
                </label>
                <input
                  type="text"
                  id="requesterName"
                  value={requesterName}
                  onChange={(e) => {
                    setRequesterName(e.target.value);
                    clearFieldError("requesterName");
                    if (submitError) setSubmitError("");
                  }}
                  onBlur={() => onFieldBlur("requesterName")}
                  placeholder="John"
                  autoComplete="name"
                  maxLength={80}
                  aria-invalid={Boolean(fieldErrors.requesterName)}
                  aria-describedby={fieldErrors.requesterName ? "requesterName-error" : undefined}
                  className={`af-input${fieldErrors.requesterName ? " is-invalid" : ""}`}
                />
                {fieldErrors.requesterName ? (
                  <p id="requesterName-error" className="af-field-error">{fieldErrors.requesterName}</p>
                ) : (
                  <p className="af-field-hint">Enter your name</p>
                )}
              </div>

              <div>
                <label htmlFor="requesterEmail" className="af-label">
                  Email Address <span className="af-required" aria-hidden="true">*</span>
                </label>
                <input
                  type="email"
                  id="requesterEmail"
                  value={requesterEmail}
                  onChange={(e) => {
                    setRequesterEmail(e.target.value);
                    clearFieldError("requesterEmail");
                    if (submitError) setSubmitError("");
                  }}
                  onBlur={() => onFieldBlur("requesterEmail")}
                  placeholder="john.doe@company.com"
                  autoComplete="email"
                  maxLength={120}
                  aria-invalid={Boolean(fieldErrors.requesterEmail)}
                  aria-describedby={fieldErrors.requesterEmail ? "requesterEmail-error" : undefined}
                  className={`af-input${fieldErrors.requesterEmail ? " is-invalid" : ""}`}
                />
                {fieldErrors.requesterEmail ? (
                  <p id="requesterEmail-error" className="af-field-error">{fieldErrors.requesterEmail}</p>
                ) : (
                  <p className="af-field-hint">Work email preferred for updates</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className="af-label">
                  Amount (USD) <span className="af-required" aria-hidden="true">*</span>
                </label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    clearFieldError("amount");
                    if (submitError) setSubmitError("");
                  }}
                  onBlur={() => onFieldBlur("amount")}
                  placeholder="0.00"
                  step="0.01"
                  min="1"
                  max={MAX_AMOUNT}
                  inputMode="decimal"
                  aria-invalid={Boolean(fieldErrors.amount)}
                  aria-describedby={fieldErrors.amount ? "amount-error" : "amount-hint"}
                  className={`af-input${fieldErrors.amount ? " is-invalid" : ""}`}
                />
                {fieldErrors.amount ? (
                  <p id="amount-error" className="af-field-error">{fieldErrors.amount}</p>
                ) : (
                  <p id="amount-hint" className="af-field-hint">Min $1.00 · Max ${MAX_AMOUNT.toLocaleString()} · 2 decimals</p>
                )}
              </div>

              <div>
                <label htmlFor="date" className="af-label">
                  Expense Date <span className="af-required" aria-hidden="true">*</span>
                </label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    clearFieldError("date");
                    if (submitError) setSubmitError("");
                  }}
                  onBlur={() => onFieldBlur("date")}
                  max={todayIso()}
                  min={daysAgoIso(365)}
                  aria-invalid={Boolean(fieldErrors.date)}
                  aria-describedby={fieldErrors.date ? "date-error" : "date-hint"}
                  className={`af-input${fieldErrors.date ? " is-invalid" : ""}`}
                />
                {fieldErrors.date ? (
                  <p id="date-error" className="af-field-error">{fieldErrors.date}</p>
                ) : (
                  <p id="date-hint" className="af-field-hint">Must be within the last 12 months</p>
                )}
              </div>
            </div>

            <div>
              <label className="af-label">
                Category <span className="af-required" aria-hidden="true">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id);
                      clearFieldError("category");
                      if (submitError) setSubmitError("");
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      category === cat.id
                        ? "bg-gradient-to-br from-sky-50 to-sky-100/80 border-sky-400 text-[var(--af-accent)] shadow-sm shadow-sky-500/10"
                        : "bg-white border-slate-500 text-slate-700 hover:border-[var(--af-navy)] hover:text-[var(--af-navy)]"
                    }`}
                  >
                    <span className="text-xl mb-1">{cat.icon}</span>
                    <span className="text-xs font-medium">{cat.label.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
              {fieldErrors.category && (
                <p className="af-field-error">{fieldErrors.category}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="af-label">
                Purpose / Description <span className="af-required" aria-hidden="true">*</span>
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  clearFieldError("description");
                  if (submitError) setSubmitError("");
                }}
                onBlur={() => onFieldBlur("description")}
                placeholder="Please state the business purpose for this expense request..."
                maxLength={MAX_DESCRIPTION}
                aria-invalid={Boolean(fieldErrors.description)}
                aria-describedby={fieldErrors.description ? "description-error" : "description-hint"}
                className={`af-textarea resize-none${fieldErrors.description ? " is-invalid" : ""}`}
              />
              <div className="mt-1 flex items-start justify-between gap-3">
                {fieldErrors.description ? (
                  <p id="description-error" className="af-field-error !mt-0">{fieldErrors.description}</p>
                ) : (
                  <p id="description-hint" className="af-field-hint !mt-0">
                    At least {MIN_DESCRIPTION} character, up to {MAX_DESCRIPTION}
                  </p>
                )}
                <span className={`text-xs font-semibold shrink-0 ${description.trim().length < MIN_DESCRIPTION ? "text-slate-500" : "text-slate-700"}`}>
                  {description.trim().length}/{MAX_DESCRIPTION}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-[var(--af-navy)] to-[var(--af-navy-soft)] text-sm font-semibold text-white shadow-lg shadow-[var(--af-navy)]/15 hover:from-[var(--af-navy-soft)] hover:to-[var(--af-navy-muted)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting Request...
                </span>
              ) : (
                "Submit Expense Request"
              )}
            </button>
          </form>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center text-sm text-slate-500">
              Loading form...
            </div>
          )}
        </div>

        {/* Right Column: Status Tracker */}
        <div className="lg:col-span-5 space-y-6">
          <div className="portal-card portal-card--track rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-50 text-[var(--af-accent)] text-sm">🔍</span>
              Track Status
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Enter your unique Request ID (e.g. EXP-17...) or your email to track approvals.
            </p>

            {mounted ? (
            <div className="flex gap-2" suppressHydrationWarning>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Request ID or Email"
                className="af-input flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
              />
              <button
                onClick={() => handleSearch()}
                disabled={searching}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--af-navy)] hover:bg-[var(--af-navy-soft)] px-5 text-sm font-semibold text-white shadow-lg shadow-[var(--af-navy)]/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {searching ? "Searching..." : "Track"}
              </button>
            </div>
            ) : (
              <div className="h-10 rounded-xl bg-white border border-slate-200 animate-pulse" />
            )}

            {searchError && (
              <div className="mt-4 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400 font-medium">
                ⚠️ {searchError}
              </div>
            )}

            {/* Recent submissions, or last successful search as fallback */}
            {(recentRequests.length > 0 || lastSearch) && (
              <div className="mt-4 pt-3 border-t border-slate-200">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">
                  {recentRequests.length > 0 ? "Your Recent Requests" : "Last Tracked"}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {recentRequests.length > 0 ? (
                    recentRequests.map((rId) => (
                      <button
                        key={rId}
                        onClick={() => {
                          setSearchQuery(rId);
                          handleSearch(rId);
                        }}
                        className="text-xs bg-slate-100 hover:bg-slate-200 border border-slate-400 text-slate-800 font-mono py-1 px-2.5 rounded-lg transition-colors cursor-pointer"
                      >
                        {rId.substring(0, 14)}...
                      </button>
                    ))
                  ) : (
                    <button
                      onClick={() => {
                        setSearchQuery(lastSearch);
                        handleSearch(lastSearch);
                      }}
                      className="text-xs bg-slate-100 hover:bg-slate-200 border border-slate-400 text-slate-800 font-mono py-1 px-2.5 rounded-lg transition-colors cursor-pointer"
                    >
                      {lastSearch.startsWith("EXP-")
                        ? `${lastSearch.substring(0, 14)}...`
                        : lastSearch}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Search Result Timeline */}
          {searchResults.length > 0 && (
            <div className="portal-card relative rounded-2xl p-6 sm:p-8 pr-12 space-y-6">
              <button
                type="button"
                onClick={() => setSearchResults([])}
                className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                aria-label="Close tracking details"
              >
                ✕
              </button>
              <div className="flex justify-between items-start border-b border-slate-200 pb-4 pr-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 font-mono">{searchResults[0].id}</h3>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{searchResults[0].category}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold text-slate-900">${searchResults[0].amount.toFixed(2)}</div>
                  <div className="mt-1">
                    <StatusBadge status={searchResults[0].status} />
                  </div>
                </div>
              </div>

              {/* Multiple results matching email switcher */}
              {searchResults.length > 1 && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1 max-h-48 overflow-y-auto">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block px-1.5 py-0.5">
                    Found {searchResults.length} Requests
                  </span>
                  {searchResults.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        // Put selected item at front of array
                        const reordered = [item, ...searchResults.filter((x) => x.id !== item.id)];
                        setSearchResults(reordered);
                      }}
                      className={`w-full text-left rounded-lg p-2 text-xs font-medium transition-colors flex items-center justify-between ${
                        idx === 0
                          ? "bg-sky-50 text-[var(--af-accent)] border border-sky-200"
                          : "text-slate-500 hover:bg-white border border-transparent"
                      }`}
                    >
                      <div>
                        <div className="font-mono text-xs">{item.id}</div>
                        <div className="mt-0.5 truncate max-w-44 text-slate-600 font-bold">{item.description}</div>
                      </div>
                      <div className="text-right">
                        <div>${item.amount.toFixed(2)}</div>
                        <div className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString()}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Expense Information */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
                <div>
                  <span className="text-slate-500 block text-xs uppercase font-bold tracking-wider">Purpose</span>
                  <p className="text-slate-800 mt-0.5 text-xs italic">"{searchResults[0].description}"</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 block text-xs uppercase font-bold tracking-wider">Requester</span>
                    <p className="text-slate-600 text-xs mt-0.5">{searchResults[0].requesterName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs uppercase font-bold tracking-wider">Date Logged</span>
                    <p className="text-slate-600 text-xs mt-0.5">{new Date(searchResults[0].date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Timeline Graphic */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <span>⏱️</span> Workflow History & Logs
                </h4>
                
                <TimelineView history={searchResults[0].history} />
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
