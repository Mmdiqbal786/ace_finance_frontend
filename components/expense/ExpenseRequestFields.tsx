"use client";

import React from "react";
import FormField, { RequiredFieldsNote } from "../FormField";
import {
  MAX_DESCRIPTION,
  MIN_DESCRIPTION,
  daysAgoIso,
  daysFromNowIso,
  todayIso,
  validateAmount,
  validateDescription,
  validateDueDate,
  validateEmail,
  validateExpenseDate,
  validatePersonName,
  validateRequiredSelect,
} from "../../lib/validation";

export type ExpenseRequestField =
  | "requesterName"
  | "requesterEmail"
  | "country"
  | "amount"
  | "date"
  | "dueDate"
  | "project"
  | "category"
  | "description";

export interface ExpenseCatalogOption {
  _id: string;
  name: string;
  label?: string;
  code?: string;
  currency?: string;
}

export interface ExpenseRequestValues {
  requesterName: string;
  requesterEmail: string;
  country: string;
  amount: string;
  date: string;
  dueDate: string;
  project: string;
  category: string;
  description: string;
}

interface ExpenseRequestFieldsProps {
  values: ExpenseRequestValues;
  onChange: <K extends keyof ExpenseRequestValues>(field: K, value: ExpenseRequestValues[K]) => void;
  errors: Partial<Record<ExpenseRequestField, string>>;
  clearError: (field: ExpenseRequestField) => void;
  onBlurField: (field: ExpenseRequestField, message: string) => void;
  fieldClass: (base: string, field: ExpenseRequestField) => string;
  categories: ExpenseCatalogOption[];
  projects: ExpenseCatalogOption[];
  countries: ExpenseCatalogOption[];
  catalogLoading?: boolean;
  compact?: boolean;
  allowInactiveSelected?: boolean;
  showRequiredNote?: boolean;
  descriptionRows?: number;
}

export function validatorsForExpenseRequest(
  values: ExpenseRequestValues,
  catalogs: {
    categories: ExpenseCatalogOption[];
    projects: ExpenseCatalogOption[];
    countries: ExpenseCatalogOption[];
  }
): Record<ExpenseRequestField, () => string> {
  return {
    requesterName: () => validatePersonName(values.requesterName, "Name"),
    requesterEmail: () => validateEmail(values.requesterEmail),
    country: () => {
      const base = validateRequiredSelect(values.country, "country");
      if (base) return base;
      if (
        catalogs.countries.length > 0 &&
        !catalogs.countries.some((c) => c.name === values.country)
      ) {
        return "Please select a valid country.";
      }
      return "";
    },
    amount: () => validateAmount(values.amount),
    date: () => validateExpenseDate(values.date),
    dueDate: () => validateDueDate(values.dueDate, values.date),
    project: () => {
      const base = validateRequiredSelect(values.project, "project");
      if (base) return base;
      if (
        catalogs.projects.length > 0 &&
        !catalogs.projects.some((p) => p.name === values.project)
      ) {
        return "Please select a valid project.";
      }
      return "";
    },
    category: () => {
      const base = validateRequiredSelect(values.category, "category");
      if (base) return base;
      if (
        catalogs.categories.length > 0 &&
        !catalogs.categories.some((c) => c.name === values.category)
      ) {
        return "Please select a valid category.";
      }
      return "";
    },
    description: () => validateDescription(values.description),
  };
}

export default function ExpenseRequestFields({
  values,
  onChange,
  errors,
  clearError,
  onBlurField,
  fieldClass,
  categories,
  projects,
  countries,
  catalogLoading = false,
  compact = false,
  allowInactiveSelected = false,
  showRequiredNote = true,
  descriptionRows = 4,
}: ExpenseRequestFieldsProps) {
  const inputCls = compact ? "af-input af-input-sm" : "af-input";
  const selectCls = compact
    ? "af-select af-select-sm cursor-pointer"
    : "af-select cursor-pointer";
  const textareaCls = compact
    ? "af-textarea text-xs resize-none"
    : "af-textarea resize-none";

  const selectedCountry = countries.find((c) => c.name === values.country);
  const currency = (selectedCountry?.currency || "USD").toUpperCase();

  const set =
    (field: ExpenseRequestField) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      onChange(field, e.target.value);
      clearError(field);
    };

  return (
    <>
      {showRequiredNote && <RequiredFieldsNote className="-mt-1" />}

      <div className={`grid grid-cols-1 ${compact ? "sm:grid-cols-2 gap-3" : "sm:grid-cols-2 gap-4"}`}>
        <FormField
          label={compact ? "Full Name" : "Name"}
          htmlFor="requesterName"
          required
          error={errors.requesterName}
          hint={compact ? undefined : "Enter your name"}
        >
          <input
            type="text"
            id="requesterName"
            value={values.requesterName}
            onChange={set("requesterName")}
            onBlur={() =>
              onBlurField(
                "requesterName",
                validatePersonName(values.requesterName, compact ? "Full name" : "Name")
              )
            }
            placeholder={compact ? undefined : "John"}
            autoComplete="name"
            maxLength={80}
            className={fieldClass(inputCls, "requesterName")}
            aria-invalid={Boolean(errors.requesterName)}
          />
        </FormField>

        <FormField
          label="Email Address"
          htmlFor="requesterEmail"
          required
          error={errors.requesterEmail}
          hint={compact ? undefined : "Work email preferred for updates"}
        >
          <input
            type="email"
            id="requesterEmail"
            value={values.requesterEmail}
            onChange={set("requesterEmail")}
            onBlur={() => onBlurField("requesterEmail", validateEmail(values.requesterEmail))}
            placeholder={compact ? undefined : "john.doe@company.com"}
            autoComplete="email"
            maxLength={120}
            className={fieldClass(inputCls, "requesterEmail")}
            aria-invalid={Boolean(errors.requesterEmail)}
          />
        </FormField>
      </div>

      <div className={`grid grid-cols-1 ${compact ? "sm:grid-cols-2 gap-3" : "sm:grid-cols-2 gap-4"}`}>
        <FormField label="Country" htmlFor="country" required error={errors.country}>
          <select
            id="country"
            value={values.country}
            onChange={set("country")}
            onBlur={() =>
              onBlurField("country", validateRequiredSelect(values.country, "country"))
            }
            className={fieldClass(selectCls, "country")}
            disabled={catalogLoading || (!allowInactiveSelected && countries.length === 0)}
            aria-invalid={Boolean(errors.country)}
          >
            <option value="" disabled>
              {catalogLoading ? "Loading countries..." : "Select a country"}
            </option>
            {allowInactiveSelected &&
              values.country &&
              !countries.some((c) => c.name === values.country) && (
                <option value={values.country}>{values.country} (inactive)</option>
              )}
            {countries.map((c) => (
              <option key={c._id} value={c.name}>
                {c.name} ({(c.currency || "").toUpperCase()})
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Project" htmlFor="project" required error={errors.project}>
          <select
            id="project"
            value={values.project}
            onChange={set("project")}
            onBlur={() =>
              onBlurField("project", validateRequiredSelect(values.project, "project"))
            }
            className={fieldClass(selectCls, "project")}
            disabled={catalogLoading || (!allowInactiveSelected && projects.length === 0)}
            aria-invalid={Boolean(errors.project)}
          >
            <option value="" disabled>
              {catalogLoading ? "Loading projects..." : "Select a project"}
            </option>
            {allowInactiveSelected &&
              values.project &&
              !projects.some((p) => p.name === values.project) && (
                <option value={values.project}>{values.project} (inactive)</option>
              )}
            {projects.map((p) => (
              <option key={p._id} value={p.name}>
                {p.code ? `${p.name} (${p.code})` : p.name}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className={`grid grid-cols-1 ${compact ? "sm:grid-cols-2 gap-3" : "sm:grid-cols-2 gap-4"}`}>
        <FormField label="Category" htmlFor="category" required error={errors.category}>
          <select
            id="category"
            value={values.category}
            onChange={set("category")}
            onBlur={() =>
              onBlurField("category", validateRequiredSelect(values.category, "category"))
            }
            className={fieldClass(selectCls, "category")}
            disabled={catalogLoading || (!allowInactiveSelected && categories.length === 0)}
            aria-invalid={Boolean(errors.category)}
          >
            <option value="" disabled>
              {catalogLoading ? "Loading categories..." : "Select a category"}
            </option>
            {allowInactiveSelected &&
              values.category &&
              !categories.some((c) => c.name === values.category) && (
                <option value={values.category}>{values.category} (inactive)</option>
              )}
            {categories.map((c) => (
              <option key={c._id} value={c.name}>
                {c.label || c.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label={`Amount (${currency})`}
          htmlFor="amount"
          required
          error={errors.amount}
          hint={compact ? undefined : `Enter amount in ${currency}`}
        >
          <input
            type="text"
            inputMode="decimal"
            id="amount"
            value={values.amount}
            onChange={set("amount")}
            onBlur={() => onBlurField("amount", validateAmount(values.amount))}
            placeholder={compact ? undefined : "0.00"}
            className={fieldClass(inputCls, "amount")}
            aria-invalid={Boolean(errors.amount)}
            disabled={!values.country}
          />
        </FormField>
      </div>

      <div className={`grid grid-cols-1 ${compact ? "sm:grid-cols-2 gap-3" : "sm:grid-cols-2 gap-4"}`}>
        <FormField label="Expense Date" htmlFor="date" required error={errors.date}>
          <input
            type="date"
            id="date"
            value={values.date}
            onChange={set("date")}
            onBlur={() => onBlurField("date", validateExpenseDate(values.date))}
            max={todayIso()}
            min={daysAgoIso(365)}
            className={fieldClass(inputCls, "date")}
            aria-invalid={Boolean(errors.date)}
          />
        </FormField>

        <FormField
          label="Due Date"
          htmlFor="dueDate"
          required
          error={errors.dueDate}
          hint={compact ? undefined : "When payment is due"}
        >
          <input
            type="date"
            id="dueDate"
            value={values.dueDate}
            onChange={set("dueDate")}
            onBlur={() =>
              onBlurField("dueDate", validateDueDate(values.dueDate, values.date))
            }
            min={values.date || daysAgoIso(365)}
            max={daysFromNowIso(365 * 2)}
            className={fieldClass(inputCls, "dueDate")}
            aria-invalid={Boolean(errors.dueDate)}
          />
        </FormField>
      </div>

      <FormField
        label="Purpose / Description"
        htmlFor="description"
        required
        error={errors.description}
        hint={
          errors.description
            ? undefined
            : compact
              ? `${values.description.trim().length}/${MAX_DESCRIPTION}`
              : `At least ${MIN_DESCRIPTION} character, up to ${MAX_DESCRIPTION}`
        }
      >
        <textarea
          id="description"
          rows={descriptionRows}
          value={values.description}
          onChange={set("description")}
          onBlur={() => onBlurField("description", validateDescription(values.description))}
          placeholder={
            compact ? undefined : "Please state the business purpose for this expense request..."
          }
          maxLength={MAX_DESCRIPTION}
          className={fieldClass(textareaCls, "description")}
          aria-invalid={Boolean(errors.description)}
        />
      </FormField>
    </>
  );
}
