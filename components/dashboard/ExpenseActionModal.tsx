"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Modal from "../Modal";
import TimelineView from "../TimelineView";
import FormField, { FormActionButtons } from "../FormField";
import ExpenseRequestFields, {
  ExpenseRequestField,
  ExpenseRequestValues,
  validatorsForExpenseRequest,
} from "../expense/ExpenseRequestFields";
import { useFormValidation } from "../../hooks/useFormValidation";
import { API_URL } from "../../lib/api";
import { authHeaders, getToken } from "../../lib/auth";
import { readApiError } from "../../lib/apiError";
import { toast } from "../../lib/toast";
import {
  CategoryItem,
  CountryItem,
  Expense,
  ExpenseActionType,
  ProjectItem,
} from "../../lib/dashboard/types";
import { canRequesterEditExpense, getPaidAmount, getRemainingAmount } from "../../lib/dashboard/payment";
import { getChangeRequestLogs } from "../../lib/dashboard/changeRequestHistory";
import { validatePartialPaymentAmount, validateRejectionNotes, validateChangeRequestNotes } from "../../lib/validation";

type ActionNotesField = "notes";
type PartialPayField = "paymentAmount" | "notes";

type AttachmentPreview = {
  url: string;
  fileName: string;
  mimeType: string;
};

async function fetchExpenseInvoice(expenseId: string): Promise<Blob> {
  const token = getToken();
  const res = await fetch(`${API_URL}/expenses/${expenseId}/invoice`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error(await readApiError(res, "Failed to open invoice."));
  }
  return res.blob();
}

async function fetchPaymentReceipt(expenseId: string, fileName: string): Promise<Blob> {
  const token = getToken();
  const res = await fetch(
    `${API_URL}/expenses/${expenseId}/payment-receipt/${encodeURIComponent(fileName)}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
  if (!res.ok) {
    throw new Error(await readApiError(res, "Failed to open payment receipt."));
  }
  return res.blob();
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName || "download";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function isImageMime(mimeType: string, fileName = "") {
  if (mimeType.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileName);
}

function isPdfMime(mimeType: string, fileName = "") {
  if (mimeType === "application/pdf" || mimeType.includes("pdf")) return true;
  return /\.pdf$/i.test(fileName);
}

const ALLOWED_RECEIPT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

function validateReceiptFile(file: File | null): string {
  if (!file) return "Please attach a payment receipt.";
  if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
    return "Receipt must be a PDF or image (JPG, PNG, WEBP, GIF).";
  }
  if (file.size > MAX_RECEIPT_BYTES) {
    return "Receipt file must be 5 MB or smaller.";
  }
  return "";
}

const emptyEditValues = (): ExpenseRequestValues => ({
  requesterName: "",
  requesterEmail: "",
  country: "",
  amount: "",
  date: "",
  dueDate: "",
  project: "",
  category: "",
  invoiceNumber: "",
  invoiceDate: "",
  description: "",
});

interface ExpenseActionModalProps {
  expense: Expense | null;
  actionType: ExpenseActionType;
  onClose: () => void;
  onCompleted: () => void;
  activeCategories: CategoryItem[];
  activeProjects: ProjectItem[];
  activeCountries: CountryItem[];
  lockRequesterEmail?: boolean;
}

export default function ExpenseActionModal({
  expense,
  actionType,
  onClose,
  onCompleted,
  activeCategories,
  activeProjects,
  activeCountries,
  lockRequesterEmail = false,
}: ExpenseActionModalProps) {
  const [actionNotes, setActionNotes] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptError, setReceiptError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editValues, setEditValues] = useState<ExpenseRequestValues>(emptyEditValues);
  const [attachmentPreview, setAttachmentPreview] = useState<AttachmentPreview | null>(null);
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const [changeTarget, setChangeTarget] = useState<"requester" | "approver">("requester");

  const editForm = useFormValidation<ExpenseRequestField>();
  const actionNotesForm = useFormValidation<ActionNotesField>();
  const partialPayForm = useFormValidation<PartialPayField>();

  const closeAttachmentPreview = () => {
    setAttachmentPreview((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
  };

  useEffect(() => {
    if (!attachmentPreview) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        closeAttachmentPreview();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [attachmentPreview]);

  const showAttachmentPreview = async (blob: Blob, fileName: string, fallbackMime?: string) => {
    const mimeType = blob.type || fallbackMime || "application/octet-stream";
    const url = URL.createObjectURL(blob);
    setAttachmentPreview((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return { url, fileName, mimeType };
    });
  };

  const handleViewInvoice = async () => {
    if (!expense) return;
    setAttachmentBusy(true);
    try {
      const blob = await fetchExpenseInvoice(expense.id);
      await showAttachmentPreview(
        blob,
        expense.invoiceOriginalName || "invoice",
        expense.invoiceMimeType
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to open invoice.");
    } finally {
      setAttachmentBusy(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!expense) return;
    setAttachmentBusy(true);
    try {
      const blob = await fetchExpenseInvoice(expense.id);
      triggerBlobDownload(blob, expense.invoiceOriginalName || "invoice");
    } catch (err: any) {
      toast.error(err.message || "Failed to download invoice.");
    } finally {
      setAttachmentBusy(false);
    }
  };

  const handleViewReceipt = async (fileName: string, originalName: string, mimeType?: string) => {
    if (!expense) return;
    setAttachmentBusy(true);
    try {
      const blob = await fetchPaymentReceipt(expense.id, fileName);
      await showAttachmentPreview(blob, originalName || fileName, mimeType);
    } catch (err: any) {
      toast.error(err.message || "Failed to open receipt.");
    } finally {
      setAttachmentBusy(false);
    }
  };

  const handleDownloadReceipt = async (fileName: string, originalName: string) => {
    if (!expense) return;
    setAttachmentBusy(true);
    try {
      const blob = await fetchPaymentReceipt(expense.id, fileName);
      triggerBlobDownload(blob, originalName || fileName);
    } catch (err: any) {
      toast.error(err.message || "Failed to download receipt.");
    } finally {
      setAttachmentBusy(false);
    }
  };

  useEffect(() => {
    if (!expense) return;
    setActionNotes("");
    setPaymentAmount("");
    setReceiptFile(null);
    setReceiptError("");
    setChangeTarget(expense.status === "APPROVED_APPROVER" ? "approver" : "requester");
    actionNotesForm.clearAll();
    editForm.clearAll();
    partialPayForm.clearAll();
    closeAttachmentPreview();

    if (actionType === "edit") {
      setEditValues({
        requesterName: expense.requesterName,
        requesterEmail: expense.requesterEmail,
        country: expense.country || "",
        amount: String(expense.originalAmount ?? expense.amount),
        date: expense.date,
        dueDate: expense.dueDate || "",
        project: expense.project || "",
        category: expense.category,
        invoiceNumber: expense.invoiceNumber || "",
        invoiceDate: expense.invoiceDate || "",
        description: expense.description,
      });
    }
  }, [expense, actionType]);

  const handleClose = () => {
    setActionNotes("");
    setPaymentAmount("");
    setReceiptFile(null);
    setReceiptError("");
    actionNotesForm.clearAll();
    editForm.clearAll();
    partialPayForm.clearAll();
    closeAttachmentPreview();
    onClose();
  };

  const handleEditChange = <K extends keyof ExpenseRequestValues>(
    field: K,
    value: ExpenseRequestValues[K]
  ) => {
    if (lockRequesterEmail && field === "requesterEmail") return;
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expense) return;

    if (actionType === "edit") {
      if (lockRequesterEmail && !canRequesterEditExpense(expense)) {
        toast.error(
          "You can only edit a request after Approver/Processor has requested changes."
        );
        return;
      }

      const ok = editForm.validateAll(
        validatorsForExpenseRequest(editValues, {
          categories: activeCategories,
          projects: activeProjects,
          countries: activeCountries,
        })
      );
      if (!ok) {
        editForm.focusFirstInvalid();
        return;
      }

      setSubmitting(true);
      try {
        const response = await fetch(`${API_URL}/expenses/${expense.id}`, {
          method: "PUT",
          headers: authHeaders() as HeadersInit,
          body: JSON.stringify({
            requesterName: editValues.requesterName.trim(),
            requesterEmail: lockRequesterEmail
              ? expense.requesterEmail.trim().toLowerCase()
              : editValues.requesterEmail.trim().toLowerCase(),
            originalAmount: parseFloat(editValues.amount),
            country: editValues.country,
            category: editValues.category,
            project: editValues.project,
            description: editValues.description.trim(),
            date: editValues.date,
            dueDate: editValues.dueDate,
            invoiceNumber: editValues.invoiceNumber.trim() || "",
            invoiceDate: editValues.invoiceDate || "",
          }),
        });

        if (!response.ok) {
          throw new Error(await readApiError(response, "Failed to update expense."));
        }

        handleClose();
        toast.success(
          expense.status === "CHANGES_REQUESTED"
            ? "Changes saved — request resubmitted for approval."
            : "Expense updated successfully!"
        );
        onCompleted();
      } catch (err: any) {
        toast.error(err.message || "Failed to update expense");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (actionType === "partial-pay") {
      const remaining = getRemainingAmount(expense);
      const ok = partialPayForm.validateAll({
        paymentAmount: () => validatePartialPaymentAmount(paymentAmount, remaining),
        notes: () => "",
      });
      const receiptMsg = validateReceiptFile(receiptFile);
      setReceiptError(receiptMsg);
      if (!ok || receiptMsg) {
        partialPayForm.focusFirstInvalid();
        return;
      }

      setSubmitting(true);
      try {
        const token = getToken();
        const formData = new FormData();
        formData.append("amount", String(Number(paymentAmount)));
        if (actionNotes.trim()) formData.append("notes", actionNotes.trim());
        formData.append("receipt", receiptFile as File);

        const response = await fetch(`${API_URL}/expenses/${expense.id}/partial-pay`, {
          method: "PATCH",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        if (!response.ok) {
          throw new Error(await readApiError(response, "Failed to record partial payment."));
        }

        const result = (await response.json()) as Expense;
        handleClose();
        toast.success(
          result.status === "PROCESSED"
            ? "Final payment recorded — expense fully paid."
            : `Partial payment of $${Number(paymentAmount).toFixed(2)} recorded.`
        );
        onCompleted();
      } catch (err: any) {
        toast.error(err.message || "Partial payment failed");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (actionType === "request-changes") {
      const ok = actionNotesForm.validateAll({
        notes: () => validateChangeRequestNotes(actionNotes),
      });
      if (!ok) {
        actionNotesForm.focusFirstInvalid();
        return;
      }

      const target =
        expense.status === "APPROVED_APPROVER" ? changeTarget : "requester";

      setSubmitting(true);
      try {
        const response = await fetch(`${API_URL}/expenses/${expense.id}/request-changes`, {
          method: "PATCH",
          headers: authHeaders() as HeadersInit,
          body: JSON.stringify({ notes: actionNotes.trim(), target }),
        });

        if (!response.ok) {
          throw new Error(await readApiError(response, "Failed to request changes."));
        }

        handleClose();
        toast.success(
          target === "approver"
            ? "Expense returned to approver queue."
            : "Changes requested — requester can edit and resubmit."
        );
        onCompleted();
      } catch (err: any) {
        toast.error(err.message || "Request changes failed");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    let endpoint = "";
    if (actionType === "approve") {
      endpoint = "approve";
    } else if (actionType === "reject") {
      endpoint = "reject";
    } else if (actionType === "process") {
      endpoint = "process";
    } else if (actionType === "processor-reject") {
      endpoint = "processor-reject";
    } else {
      return;
    }

    if (actionType.includes("reject")) {
      const ok = actionNotesForm.validateAll({
        notes: () => validateRejectionNotes(actionNotes),
      });
      if (!ok) {
        actionNotesForm.focusFirstInvalid();
        return;
      }
    }

    if (actionType === "process") {
      const receiptMsg = validateReceiptFile(receiptFile);
      setReceiptError(receiptMsg);
      if (receiptMsg) return;
    }

    setSubmitting(true);
    try {
      const token = getToken();
      let response: Response;

      if (actionType === "process") {
        const formData = new FormData();
        if (actionNotes.trim()) formData.append("notes", actionNotes.trim());
        formData.append("receipt", receiptFile as File);
        response = await fetch(`${API_URL}/expenses/${expense.id}/process`, {
          method: "PATCH",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
      } else {
        response = await fetch(`${API_URL}/expenses/${expense.id}/${endpoint}`, {
          method: "PATCH",
          headers: authHeaders() as HeadersInit,
          body: JSON.stringify({ notes: actionNotes }),
        });
      }

      if (!response.ok) {
        throw new Error(
          await readApiError(response, `Failed to perform action: ${actionType}`)
        );
      }

      handleClose();
      toast.success(
        actionType.includes("reject")
          ? "Expense rejected."
          : actionType === "process"
            ? "Expense marked as fully paid."
            : "Expense approved."
      );
      onCompleted();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!expense) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/expenses/${expense.id}`, {
        method: "DELETE",
        headers: authHeaders() as HeadersInit,
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Failed to delete expense."));
      }

      handleClose();
      toast.success("Expense deleted.");
      onCompleted();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete expense");
    } finally {
      setSubmitting(false);
    }
  };

  const modalTitle =
    actionType === "approve" ? (
      <span className="text-emerald-600">✅ Approve Expense</span>
    ) : actionType === "reject" ? (
      <span className="text-rose-600">❌ Reject Expense</span>
    ) : actionType === "process" ? (
      <span className="text-emerald-600">💸 Mark as Processed (Paid)</span>
    ) : actionType === "partial-pay" ? (
      <span className="text-amber-700">🪙 Record Partial Payment</span>
    ) : actionType === "processor-reject" ? (
      <span className="text-rose-600">❌ Reject Disbursement Payout</span>
    ) : actionType === "request-changes" ? (
      <span className="text-amber-700">↩️ Request Changes</span>
    ) : actionType === "view" ? (
      <span className="text-slate-600">📄 Expense Details & Audit</span>
    ) : actionType === "edit" ? (
      <span className="text-[var(--af-accent)]">✏️ Edit Expense Request</span>
    ) : actionType === "delete" ? (
      <span className="text-rose-500">⚠️ Confirm Deletion</span>
    ) : null;

  return (
    <>
    <Modal isOpen={!!expense} onClose={handleClose} title={expense && modalTitle}>
      {expense && (
        <>
          {actionType !== "edit" && actionType !== "delete" && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-400 text-xs space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-700">Request ID:</span>
                <span className="font-mono text-[var(--af-accent)] font-bold">{expense.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700">Requester:</span>
                <span className="font-semibold text-slate-800">
                  {expense.requesterName} ({expense.requesterEmail})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700">Project:</span>
                <span className="font-semibold text-slate-800">{expense.project || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700">Category:</span>
                <span>{expense.category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700">Amount (USD):</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  ${expense.amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700">Total Paid:</span>
                <span className="font-semibold text-emerald-700 text-sm">
                  ${getPaidAmount(expense).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700">Remaining:</span>
                <span className="font-semibold text-amber-700 text-sm">
                  ${getRemainingAmount(expense).toFixed(2)}
                </span>
              </div>
              {(expense.originalAmount != null || expense.currency) && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-700">Local amount:</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {expense.originalAmount ?? "—"} {expense.currency || ""}
                    {expense.country ? ` (${expense.country})` : ""}
                  </span>
                </div>
              )}
              {expense.exchangeRate != null && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-700">FX rate:</span>
                  <span className="text-slate-700 text-xs">
                    1 {expense.currency} = {expense.exchangeRate} USD
                    {expense.exchangeRateDate ? ` · ${expense.exchangeRateDate}` : ""}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-700">Expense Date:</span>
                <span>{new Date(expense.date).toLocaleDateString()}</span>
              </div>
              {expense.invoiceNumber?.trim() && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-700">Invoice Number:</span>
                  <span className="font-semibold text-slate-800">
                    {expense.invoiceNumber.trim()}
                  </span>
                </div>
              )}
              {expense.invoiceDate && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-700">Invoice Date:</span>
                  <span>{new Date(expense.invoiceDate).toLocaleDateString()}</span>
                </div>
              )}
              {expense.dueDate && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-700">Due Date:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(expense.dueDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div>
                <span className="text-slate-700 block">Description:</span>
                <p className="text-slate-600 italic mt-0.5">&quot;{expense.description}&quot;</p>
              </div>

              <div className="flex justify-between items-center gap-3">
                <span className="text-slate-700 shrink-0">Attachment:</span>
                {expense.invoiceOriginalName || expense.invoiceFileName ? (
                  <div className="flex items-center justify-end gap-2 min-w-0 max-w-[70%]">
                    <button
                      type="button"
                      onClick={handleViewInvoice}
                      disabled={attachmentBusy}
                      className="text-right text-sm font-semibold text-[var(--af-accent)] hover:underline cursor-pointer truncate disabled:opacity-50"
                      title={expense.invoiceOriginalName || "View invoice"}
                    >
                      {expense.invoiceOriginalName || "View attached invoice"}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadInvoice}
                      disabled={attachmentBusy}
                      className="shrink-0 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer disabled:opacity-50"
                    >
                      Download
                    </button>
                  </div>
                ) : (
                  <span className="text-slate-500 text-sm">No invoice attached</span>
                )}
              </div>

              <div>
                <span className="text-slate-700 block mb-1">Payment receipts:</span>
                {expense.paymentReceipts && expense.paymentReceipts.length > 0 ? (
                  <ul className="space-y-1.5">
                    {expense.paymentReceipts.map((r) => (
                      <li
                        key={r.fileName}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {r.originalName}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {r.paymentAmount != null
                              ? `$${Number(r.paymentAmount).toFixed(2)} · `
                              : ""}
                            {new Date(r.uploadedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleViewReceipt(r.fileName, r.originalName, r.mimeType)
                            }
                            disabled={attachmentBusy}
                            className="text-xs font-semibold text-[var(--af-accent)] hover:underline cursor-pointer disabled:opacity-50"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadReceipt(r.fileName, r.originalName)}
                            disabled={attachmentBusy}
                            className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer disabled:opacity-50"
                          >
                            Download
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-slate-500 text-sm">No payment receipts yet</span>
                )}
              </div>

              {(() => {
                const changeLogs = getChangeRequestLogs(expense);
                if (changeLogs.length === 0) return null;
                return (
                  <div className="pt-2 mt-2 border-t border-slate-400">
                    <span className="text-amber-700 font-bold block">
                      Change Request History ({changeLogs.length})
                    </span>
                    <ul className="mt-2 space-y-2">
                      {changeLogs.map((log, idx) => (
                        <li
                          key={`${log.timestamp}-${idx}`}
                          className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <span className="font-semibold text-amber-900">
                              #{idx + 1} · {log.action}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="mt-1 italic text-slate-700">
                            &quot;{log.notes || "No notes"}&quot;
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">By {log.user}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}

              {expense.approverNotes && (
                <div className="pt-2 mt-2 border-t border-slate-400">
                  <span className="text-[var(--af-accent)] font-bold block">
                    Approver&apos;s Notes (User 1):
                  </span>
                  <p className="text-slate-600 bg-slate-50 p-2 rounded border border-slate-400 mt-1 italic">
                    &quot;{expense.approverNotes}&quot;
                  </p>
                </div>
              )}

              {expense.processorNotes && (
                <div className="pt-2 mt-1">
                  <span className="text-emerald-600 font-bold block">
                    Processor&apos;s Notes (User 2):
                  </span>
                  <p className="text-slate-600 bg-slate-50 p-2 rounded border border-slate-400 mt-1 italic">
                    &quot;{expense.processorNotes}&quot;
                  </p>
                </div>
              )}
            </div>
          )}

          {actionType === "edit" ? (
            <form onSubmit={handleActionSubmit} noValidate className="space-y-4">
              <ExpenseRequestFields
                values={editValues}
                onChange={handleEditChange}
                errors={editForm.errors}
                clearError={editForm.clearError}
                onBlurField={editForm.onBlur}
                fieldClass={editForm.fieldClass}
                categories={activeCategories}
                projects={activeProjects}
                countries={activeCountries}
                compact
                allowInactiveSelected
                descriptionRows={3}
                emailReadOnly={lockRequesterEmail}
              />

              {(expense.invoiceOriginalName || expense.invoiceFileName) && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Attached invoice
                  </span>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span className="truncate font-medium text-slate-800">
                      {expense.invoiceOriginalName || "Invoice file"}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={handleViewInvoice}
                        disabled={attachmentBusy}
                        className="text-xs font-semibold text-[var(--af-accent)] hover:underline cursor-pointer disabled:opacity-50"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadInvoice}
                        disabled={attachmentBusy}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer disabled:opacity-50"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <FormActionButtons
                onCancel={handleClose}
                submitLabel={submitting ? "Saving..." : "Save Changes"}
                submitting={submitting}
              />
            </form>
          ) : actionType === "delete" ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-slate-900 flex items-start gap-3">
                <span className="text-2xl mt-0.5">⚠️</span>
                <div>
                  <h4 className="text-sm font-bold text-rose-450">Warning: Permanent Deletion</h4>
                  <p className="text-xs text-slate-700 mt-1">
                    Are you sure you want to delete this expense request? This operation cannot be
                    undone and will permanently remove the record from the database.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-400 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Request ID:</span>
                  <span className="font-mono text-[var(--af-accent)] font-bold">{expense.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Requester:</span>
                  <span className="font-semibold text-slate-800">
                    {expense.requesterName} ({expense.requesterEmail})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Amount:</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    ${expense.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-700 font-medium">Purpose:</span>
                  <span
                    className="text-slate-700 max-w-[280px] text-right italic truncate"
                    title={expense.description}
                  >
                    &quot;{expense.description}&quot;
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
                >
                  Cancel, Keep Request
                </button>
                <button
                  type="button"
                  onClick={executeDelete}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-600/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Deleting..." : "Yes, Delete Permanently"}
                </button>
              </div>
            </div>
          ) : actionType === "request-changes" ? (
            <form onSubmit={handleActionSubmit} noValidate className="space-y-4">
              {expense.status === "APPROVED_APPROVER" ? (
                <fieldset className="space-y-2">
                  <legend className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Send back to
                  </legend>
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <input
                      type="radio"
                      name="changeTarget"
                      className="mt-0.5"
                      checked={changeTarget === "approver"}
                      onChange={() => setChangeTarget("approver")}
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">
                        Approver
                      </span>
                      <span className="block text-xs text-slate-600">
                        Undo approval and return to the approver queue for re-review.
                      </span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <input
                      type="radio"
                      name="changeTarget"
                      className="mt-0.5"
                      checked={changeTarget === "requester"}
                      onChange={() => setChangeTarget("requester")}
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">
                        Requester
                      </span>
                      <span className="block text-xs text-slate-600">
                        Ask the requester to edit details and resubmit.
                      </span>
                    </span>
                  </label>
                </fieldset>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
                  This will send the request back to the <strong>requester</strong> so they can
                  edit and resubmit.
                </div>
              )}

              <FormField
                label="What needs to change?"
                required
                error={actionNotesForm.errors.notes}
                htmlFor="changeNotes"
              >
                <textarea
                  id="changeNotes"
                  rows={3}
                  value={actionNotes}
                  onChange={(e) => {
                    setActionNotes(e.target.value);
                    actionNotesForm.clearError("notes");
                  }}
                  onBlur={() =>
                    actionNotesForm.onBlur("notes", validateChangeRequestNotes(actionNotes))
                  }
                  placeholder="Describe the updates needed..."
                  className={actionNotesForm.fieldClass("af-textarea text-xs resize-none", "notes")}
                  aria-invalid={Boolean(actionNotesForm.errors.notes)}
                />
              </FormField>

              <FormActionButtons
                onCancel={handleClose}
                submitLabel={submitting ? "Sending..." : "Send Request Changes"}
                submitting={submitting}
              />
            </form>
          ) : actionType === "partial-pay" ? (
            <form onSubmit={handleActionSubmit} noValidate className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total amount</span>
                  <span className="font-bold text-slate-900">${expense.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Already paid</span>
                  <span className="font-semibold text-emerald-700">
                    ${getPaidAmount(expense).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Remaining</span>
                  <span className="font-semibold text-amber-800">
                    ${getRemainingAmount(expense).toFixed(2)}
                  </span>
                </div>
              </div>

              <FormField
                label="Amount to Pay Now (USD)"
                htmlFor="paymentAmount"
                required
                error={partialPayForm.errors.paymentAmount}
                hint={`Max $${getRemainingAmount(expense).toFixed(2)}`}
              >
                <input
                  type="text"
                  inputMode="decimal"
                  id="paymentAmount"
                  value={paymentAmount}
                  onChange={(e) => {
                    setPaymentAmount(e.target.value);
                    partialPayForm.clearError("paymentAmount");
                  }}
                  onBlur={() =>
                    partialPayForm.onBlur(
                      "paymentAmount",
                      validatePartialPaymentAmount(paymentAmount, getRemainingAmount(expense))
                    )
                  }
                  placeholder="0.00"
                  className={partialPayForm.fieldClass("af-input af-input-sm", "paymentAmount")}
                  aria-invalid={Boolean(partialPayForm.errors.paymentAmount)}
                />
              </FormField>

              <FormField label="Payout Notes (Optional)" htmlFor="partialNotes">
                <textarea
                  id="partialNotes"
                  rows={3}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Enter transaction reference or payout notes..."
                  className="af-textarea text-xs resize-none"
                />
              </FormField>

              <FormField
                label="Payment Receipt"
                htmlFor="partialReceipt"
                required
                error={receiptError}
                hint="PDF or image (JPG, PNG, WEBP, GIF), max 5 MB"
              >
                <input
                  id="partialReceipt"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,application/pdf,image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setReceiptFile(file);
                    setReceiptError(validateReceiptFile(file));
                  }}
                  disabled={submitting}
                  className={`af-input af-input-sm${receiptError ? " is-invalid" : ""} file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700`}
                  aria-invalid={Boolean(receiptError)}
                />
              </FormField>

              <FormActionButtons
                onCancel={handleClose}
                submitLabel={submitting ? "Saving..." : "Record Partial Payment"}
                submitting={submitting}
              />
            </form>
          ) : actionType !== "view" ? (
            <form onSubmit={handleActionSubmit} noValidate className="space-y-4">
              <FormField
                label={
                  actionType.includes("reject")
                    ? "Reason for Rejection"
                    : "Add Review / Payout Notes (Optional)"
                }
                required={actionType.includes("reject")}
                error={actionNotesForm.errors.notes}
                htmlFor="notes"
              >
                <textarea
                  id="notes"
                  rows={3}
                  value={actionNotes}
                  onChange={(e) => {
                    setActionNotes(e.target.value);
                    actionNotesForm.clearError("notes");
                  }}
                  onBlur={() => {
                    if (actionType.includes("reject")) {
                      actionNotesForm.onBlur("notes", validateRejectionNotes(actionNotes));
                    }
                  }}
                  placeholder={
                    actionType.includes("reject")
                      ? "State the reason why this expense request is being rejected..."
                      : "Enter transaction details, wire references, or general comments..."
                  }
                  className={
                    actionType.includes("reject")
                      ? actionNotesForm.fieldClass("af-textarea text-xs resize-none", "notes")
                      : "af-textarea text-xs resize-none"
                  }
                  aria-invalid={Boolean(actionNotesForm.errors.notes)}
                />
              </FormField>

              {actionType === "process" && (
                <FormField
                  label="Payment Receipt"
                  htmlFor="processReceipt"
                  required
                  error={receiptError}
                  hint="PDF or image (JPG, PNG, WEBP, GIF), max 5 MB"
                >
                  <input
                    id="processReceipt"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,application/pdf,image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setReceiptFile(file);
                      setReceiptError(validateReceiptFile(file));
                    }}
                    disabled={submitting}
                    className={`af-input af-input-sm${receiptError ? " is-invalid" : ""} file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700`}
                    aria-invalid={Boolean(receiptError)}
                  />
                </FormField>
              )}

              {actionType.includes("reject") ? (
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-white shadow-lg transition-colors cursor-pointer disabled:opacity-50 bg-rose-600 hover:bg-rose-500 shadow-rose-600/10"
                  >
                    {submitting ? "Saving..." : "Confirm Action"}
                  </button>
                </div>
              ) : (
                <FormActionButtons
                  onCancel={handleClose}
                  submitLabel={submitting ? "Saving..." : "Confirm Action"}
                  submitting={submitting}
                />
              )}
            </form>
          ) : (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Workflow Timeline History
              </h4>
              <TimelineView history={expense.history} />
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Modal>

    {attachmentPreview &&
      createPortal(
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/70 p-3 sm:p-6"
          onClick={closeAttachmentPreview}
          role="dialog"
          aria-modal="true"
          aria-label="Attachment preview"
        >
          <div
            className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <p className="min-w-0 truncate text-sm font-semibold text-slate-900">
                {attachmentPreview.fileName}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={attachmentPreview.url}
                  download={attachmentPreview.fileName}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Download
                </a>
                <button
                  type="button"
                  onClick={closeAttachmentPreview}
                  className="rounded-lg px-2 py-1 text-sm font-bold text-slate-400 hover:text-slate-900 cursor-pointer"
                  aria-label="Close preview"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex min-h-[280px] flex-1 items-center justify-center overflow-auto bg-slate-50 p-3 sm:p-4">
              {isImageMime(attachmentPreview.mimeType, attachmentPreview.fileName) ? (
                <img
                  src={attachmentPreview.url}
                  alt={attachmentPreview.fileName}
                  className="max-h-[75vh] max-w-full object-contain"
                />
              ) : isPdfMime(attachmentPreview.mimeType, attachmentPreview.fileName) ? (
                <iframe
                  src={attachmentPreview.url}
                  title={attachmentPreview.fileName}
                  className="h-[75vh] w-full rounded-lg border border-slate-200 bg-white"
                />
              ) : (
                <div className="space-y-3 text-center">
                  <p className="text-sm text-slate-600">
                    Preview is not available for this file type.
                  </p>
                  <a
                    href={attachmentPreview.url}
                    download={attachmentPreview.fileName}
                    className="inline-flex rounded-lg bg-[var(--af-accent)] px-4 py-2 text-xs font-bold text-white"
                  >
                    Download file
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
