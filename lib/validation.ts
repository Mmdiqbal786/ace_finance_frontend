export const NAME_PATTERN = /^[A-Za-z][A-Za-z .'-]{1,79}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;
export const CATALOG_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 &_().,-]{0,59}$/;
export const PROJECT_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,19}$/;
export const CURRENCY_CODE_PATTERN = /^[A-Za-z]{3}$/;

export const MAX_AMOUNT = 100_000;
export const MIN_DESCRIPTION = 1;
export const MAX_DESCRIPTION = 500;
export const MIN_PASSWORD = 8;

export function daysAgoIso(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

export function daysFromNowIso(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

export function validatePersonName(value: string, label = "Name"): string {
  const name = value.trim();
  if (!name) return `${label} is required.`;
  if (name.length < 2) return `${label} must be at least 2 characters.`;
  if (name.length > 80) return `${label} must be 80 characters or fewer.`;
  if (!NAME_PATTERN.test(name)) {
    return "Use letters only (spaces, hyphens, and apostrophes allowed).";
  }
  return "";
}

export function validateEmail(value: string): string {
  const email = value.trim().toLowerCase();
  if (!email) return "Email address is required.";
  if (email.length > 120) return "Email must be 120 characters or fewer.";
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email like name@company.com.";
  if (email.endsWith("@example.com") || email.endsWith("@test.com")) {
    return "Please use a real work email address.";
  }
  return "";
}

export function validateAmount(value: string): string {
  const raw = value.trim();
  if (!raw) return "Amount is required.";
  if (!AMOUNT_PATTERN.test(raw)) return "Use a valid amount with up to 2 decimal places.";
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return "Amount must be greater than $0.00.";
  if (parsed < 1) return "Minimum expense amount is $1.00.";
  if (parsed > MAX_AMOUNT) return `Amount cannot exceed $${MAX_AMOUNT.toLocaleString()}.`;
  return "";
}

export function validateExpenseDate(value: string): string {
  if (!value) return "Expense date is required.";
  const today = todayIso();
  const oldest = daysAgoIso(365);
  if (value > today) return "Expense date cannot be in the future.";
  if (value < oldest) return "Expense date cannot be older than 1 year.";
  return "";
}

export function validateDueDate(value: string, expenseDate?: string): string {
  if (!value) return "Due date is required.";
  const farthest = daysFromNowIso(365 * 2);
  if (value > farthest) return "Due date cannot be more than 2 years ahead.";
  if (expenseDate && value < expenseDate) {
    return "Due date cannot be before the expense date.";
  }
  return "";
}

export function validateDescription(value: string): string {
  const text = value.trim();
  if (!text) return "Purpose / description is required.";
  if (text.length < MIN_DESCRIPTION) return "Purpose / description is required.";
  if (text.length > MAX_DESCRIPTION) {
    return `Description must be ${MAX_DESCRIPTION} characters or fewer.`;
  }
  return "";
}

export function validateRequiredSelect(value: string, label: string): string {
  if (!value.trim()) return `Please select a ${label.toLowerCase()}.`;
  return "";
}

export function validatePassword(
  value: string,
  opts?: { required?: boolean; label?: string }
): string {
  const required = opts?.required !== false;
  const label = opts?.label || "Password";
  if (!value) {
    return required ? `${label} is required.` : "";
  }
  if (value.length < MIN_PASSWORD) {
    return `${label} must be at least ${MIN_PASSWORD} characters.`;
  }
  if (value.length > 72) return `${label} must be 72 characters or fewer.`;
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return `${label} must include at least one letter and one number.`;
  }
  return "";
}

export function validateCatalogName(value: string, label = "Name"): string {
  const name = value.trim();
  if (!name) return `${label} is required.`;
  if (name.length < 2) return `${label} must be at least 2 characters.`;
  if (name.length > 60) return `${label} must be 60 characters or fewer.`;
  if (!CATALOG_NAME_PATTERN.test(name)) {
    return `${label} may only use letters, numbers, spaces, and &_().,-`;
  }
  return "";
}

export function validateCategoryLabel(value: string): string {
  const label = value.trim();
  if (!label) return "Label is required.";
  if (label.length < 2) return "Label must be at least 2 characters.";
  if (label.length > 80) return "Label must be 80 characters or fewer.";
  return "";
}

export function validateProjectCode(value: string): string {
  const code = value.trim();
  if (!code) return "";
  if (code.length > 20) return "Code must be 20 characters or fewer.";
  if (!PROJECT_CODE_PATTERN.test(code)) {
    return "Code may only use letters, numbers, hyphens, and underscores.";
  }
  return "";
}

export function validateCurrencyCode(value: string): string {
  const currency = value.trim().toUpperCase();
  if (!currency) return "Currency is required.";
  if (!CURRENCY_CODE_PATTERN.test(currency)) {
    return "Use a 3-letter currency code like USD, INR, or AED.";
  }
  return "";
}

export function validateRejectionNotes(value: string): string {
  const notes = value.trim();
  if (!notes) return "Reason for rejection is required.";
  if (notes.length < 5) return "Please provide at least 5 characters explaining the rejection.";
  if (notes.length > 500) return "Notes must be 500 characters or fewer.";
  return "";
}

export function validatePartialPaymentAmount(value: string, remaining: number): string {
  const raw = value.trim();
  if (!raw) return "Payment amount is required.";
  if (!AMOUNT_PATTERN.test(raw)) return "Use a valid amount with up to 2 decimal places.";
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return "Payment amount must be greater than $0.00.";
  if (parsed > remaining) {
    return `Cannot exceed remaining balance of $${remaining.toFixed(2)}.`;
  }
  return "";
}

/** Login-only: format check without blocking placeholder domains. */
export function validateLoginEmail(value: string): string {
  const email = value.trim().toLowerCase();
  if (!email) return "Email address is required.";
  if (email.length > 120) return "Email must be 120 characters or fewer.";
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email like name@company.com.";
  return "";
}

/** Login-only: require presence; strength is enforced at user-create time. */
export function validateLoginPassword(value: string): string {
  if (!value) return "Password is required.";
  if (value.length < 6) return "Password must be at least 6 characters.";
  return "";
}
