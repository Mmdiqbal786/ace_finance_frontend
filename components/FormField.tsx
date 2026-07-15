"use client";

import React from "react";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export default function FormField({
  label,
  required,
  error,
  hint,
  htmlFor,
  className = "",
  children,
}: FormFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="af-label">
        {label}
        {required && (
          <span className="af-required" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p className="af-field-error">{error}</p>
      ) : hint ? (
        <p className="af-field-hint">{hint}</p>
      ) : null}
    </div>
  );
}

export function RequiredFieldsNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-slate-600 ${className}`}>
      Fields marked with <span className="af-required">*</span> are required
    </p>
  );
}

export function FormActionButtons({
  onCancel,
  submitLabel,
  cancelLabel = "Cancel",
  submitting,
}: {
  onCancel: () => void;
  submitLabel: string;
  cancelLabel?: string;
  submitting?: boolean;
}) {
  return (
    <div className="flex gap-3 justify-end pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 rounded-lg bg-[var(--af-navy)] hover:bg-[var(--af-navy-soft)] text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </div>
  );
}
