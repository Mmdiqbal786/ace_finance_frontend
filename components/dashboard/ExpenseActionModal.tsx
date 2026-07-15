"use client";

import React, { useEffect, useState } from "react";
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
import { authHeaders } from "../../lib/auth";
import { readApiError } from "../../lib/apiError";
import { toast } from "../../lib/toast";
import {
  CategoryItem,
  CountryItem,
  Expense,
  ExpenseActionType,
  ProjectItem,
} from "../../lib/dashboard/types";
import { validateRejectionNotes } from "../../lib/validation";

type ActionNotesField = "notes";

const emptyEditValues = (): ExpenseRequestValues => ({
  requesterName: "",
  requesterEmail: "",
  country: "",
  amount: "",
  date: "",
  project: "",
  category: "",
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
}

export default function ExpenseActionModal({
  expense,
  actionType,
  onClose,
  onCompleted,
  activeCategories,
  activeProjects,
  activeCountries,
}: ExpenseActionModalProps) {
  const [actionNotes, setActionNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editValues, setEditValues] = useState<ExpenseRequestValues>(emptyEditValues);

  const editForm = useFormValidation<ExpenseRequestField>();
  const actionNotesForm = useFormValidation<ActionNotesField>();

  useEffect(() => {
    if (!expense) return;
    setActionNotes("");
    actionNotesForm.clearAll();
    editForm.clearAll();

    if (actionType === "edit") {
      setEditValues({
        requesterName: expense.requesterName,
        requesterEmail: expense.requesterEmail,
        country: expense.country || "",
        amount: String(expense.originalAmount ?? expense.amount),
        date: expense.date,
        project: expense.project || "",
        category: expense.category,
        description: expense.description,
      });
    }
  }, [expense, actionType]);

  const handleClose = () => {
    setActionNotes("");
    actionNotesForm.clearAll();
    editForm.clearAll();
    onClose();
  };

  const handleEditChange = <K extends keyof ExpenseRequestValues>(
    field: K,
    value: ExpenseRequestValues[K]
  ) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expense) return;

    if (actionType === "edit") {
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
            requesterEmail: editValues.requesterEmail.trim().toLowerCase(),
            originalAmount: parseFloat(editValues.amount),
            country: editValues.country,
            category: editValues.category,
            project: editValues.project,
            description: editValues.description.trim(),
            date: editValues.date,
          }),
        });

        if (!response.ok) {
          throw new Error(await readApiError(response, "Failed to update expense."));
        }

        handleClose();
        toast.success("Expense updated successfully!");
        onCompleted();
      } catch (err: any) {
        toast.error(err.message || "Failed to update expense");
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

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/expenses/${expense.id}/${endpoint}`, {
        method: "PATCH",
        headers: authHeaders() as HeadersInit,
        body: JSON.stringify({ notes: actionNotes }),
      });

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
            ? "Expense marked as processed."
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
    ) : actionType === "processor-reject" ? (
      <span className="text-rose-600">❌ Reject Disbursement Payout</span>
    ) : actionType === "view" ? (
      <span className="text-slate-600">📄 Expense Details & Audit</span>
    ) : actionType === "edit" ? (
      <span className="text-[var(--af-accent)]">✏️ Edit Expense Request</span>
    ) : actionType === "delete" ? (
      <span className="text-rose-500">⚠️ Confirm Deletion</span>
    ) : null;

  return (
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
                <span className="text-slate-700">Amount (USD):</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  ${expense.amount.toFixed(2)}
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
                <span className="text-slate-700">Category:</span>
                <span>{expense.category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700">Project:</span>
                <span className="font-semibold text-slate-800">{expense.project || "—"}</span>
              </div>
              <div>
                <span className="text-slate-700 block">Description:</span>
                <p className="text-slate-600 italic mt-0.5">&quot;{expense.description}&quot;</p>
              </div>

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
              />

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
  );
}
