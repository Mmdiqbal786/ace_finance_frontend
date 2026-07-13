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

export default function PublicPortal() {
  const [mounted, setMounted] = useState(false);

  // Form states
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Software");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

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
    if (!requesterName || !requesterEmail || !amount || !description || !date) {
      setSubmitError("Please fill out all fields.");
      return;
    }
    setSubmitError("");
    setSubmitting(true);
    setSubmitSuccess(null);

    try {
      const response = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterName,
          requesterEmail,
          amount: parseFloat(amount),
          category,
          description,
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
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Public Expense <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400">Portal</span>
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-zinc-400">
          Submit reimbursement requests directly to management and track your payments in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form */}
        <div className="portal-card lg:col-span-7 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-400 text-sm">📝</span>
            New Expense Request
          </h2>

          {submitSuccess && (
            <div className="relative mb-6 rounded-xl bg-indigo-500/10 border border-indigo-500/30 p-5 pr-12 text-zinc-100">
              <button
                type="button"
                onClick={() => setSubmitSuccess(null)}
                className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-indigo-500/10 hover:text-white transition-colors cursor-pointer"
                aria-label="Dismiss success message"
              >
                ✕
              </button>
              <div className="flex items-center gap-3 mb-2 text-indigo-400 font-bold">
                <span className="text-xl">🎉</span> Request Submitted Successfully!
              </div>
              <p className="text-sm text-zinc-300 mb-3">
                Your request has been logged and forwarded to User 1 (Approver) for review. Use the ID below to track updates.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-950 p-3 rounded-lg border border-zinc-800 font-mono text-sm">
                <div>
                  <span className="text-zinc-500">Request ID:</span>{" "}
                  <span className="text-indigo-400 font-semibold">{submitSuccess.id}</span>
                </div>
                <button
                  onClick={() => {
                    setSearchQuery(submitSuccess.id);
                    handleSearch(submitSuccess.id);
                  }}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline"
                >
                  Track in right panel
                </button>
              </div>
            </div>
          )}

          {submitError && (
            <div className="mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-xs font-medium text-rose-400">
              ⚠️ {submitError}
            </div>
          )}

          {mounted ? (
          <form onSubmit={handleFormSubmit} className="space-y-5" suppressHydrationWarning>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="requesterName" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="requesterName"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-indigo-500 focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="requesterEmail" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="requesterEmail"
                  value={requesterEmail}
                  onChange={(e) => setRequesterEmail(e.target.value)}
                  placeholder="john.doe@example.com"
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-indigo-500 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Amount (USD)
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="text-zinc-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 pl-8 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-indigo-500 focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="date" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Expense Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      category === cat.id
                        ? "bg-gradient-to-br from-indigo-600/20 to-violet-600/10 border-indigo-400/60 text-indigo-300 shadow-lg shadow-indigo-500/10"
                        : "bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
                    }`}
                  >
                    <span className="text-xl mb-1">{cat.icon}</span>
                    <span className="text-xs font-medium">{cat.label.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Purpose / Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please state the business purpose for this expense request..."
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-indigo-500 focus:outline-none transition-colors resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:from-indigo-500 hover:to-violet-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
            <div className="flex min-h-[420px] items-center justify-center text-sm text-zinc-500">
              Loading form...
            </div>
          )}
        </div>

        {/* Right Column: Status Tracker */}
        <div className="lg:col-span-5 space-y-6">
          <div className="portal-card portal-card--track rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/10 text-violet-400 text-sm">🔍</span>
              Track Status
            </h2>
            <p className="text-xs text-zinc-400 mb-6">
              Enter your unique Request ID (e.g. EXP-17...) or your email to track approvals.
            </p>

            {mounted ? (
            <div className="flex gap-2" suppressHydrationWarning>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Request ID or Email"
                className="flex-1 rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none transition-colors"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
              />
              <button
                onClick={() => handleSearch()}
                disabled={searching}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {searching ? "Searching..." : "Track"}
              </button>
            </div>
            ) : (
              <div className="h-10 rounded-xl bg-zinc-950 border border-zinc-800 animate-pulse" />
            )}

            {searchError && (
              <div className="mt-4 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400 font-medium">
                ⚠️ {searchError}
              </div>
            )}

            {/* Recent submissions, or last successful search as fallback */}
            {(recentRequests.length > 0 || lastSearch) && (
              <div className="mt-4 pt-3 border-t border-zinc-800/60">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
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
                        className="text-xs bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono py-1 px-2.5 rounded-lg transition-colors cursor-pointer"
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
                      className="text-xs bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono py-1 px-2.5 rounded-lg transition-colors cursor-pointer"
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
                className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                aria-label="Close tracking details"
              >
                ✕
              </button>
              <div className="flex justify-between items-start border-b border-zinc-800 pb-4 pr-2">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-500 font-mono">{searchResults[0].id}</h3>
                  <p className="text-lg font-bold text-white mt-0.5">{searchResults[0].category}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold text-white">${searchResults[0].amount.toFixed(2)}</div>
                  <div className="mt-1">
                    <StatusBadge status={searchResults[0].status} />
                  </div>
                </div>
              </div>

              {/* Multiple results matching email switcher */}
              {searchResults.length > 1 && (
                <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 space-y-1 max-h-48 overflow-y-auto">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block px-1.5 py-0.5">
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
                          ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/20"
                          : "text-zinc-400 hover:bg-zinc-900 border border-transparent"
                      }`}
                    >
                      <div>
                        <div className="font-mono text-[10px]">{item.id}</div>
                        <div className="mt-0.5 truncate max-w-44 text-zinc-300 font-bold">{item.description}</div>
                      </div>
                      <div className="text-right">
                        <div>${item.amount.toFixed(2)}</div>
                        <div className="text-[9px] text-zinc-500">{new Date(item.date).toLocaleDateString()}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Expense Information */}
              <div className="space-y-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-sm">
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">Purpose</span>
                  <p className="text-zinc-200 mt-0.5 text-xs italic">"{searchResults[0].description}"</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">Requester</span>
                    <p className="text-zinc-300 text-xs mt-0.5">{searchResults[0].requesterName}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">Date Logged</span>
                    <p className="text-zinc-300 text-xs mt-0.5">{new Date(searchResults[0].date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Timeline Graphic */}
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
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
