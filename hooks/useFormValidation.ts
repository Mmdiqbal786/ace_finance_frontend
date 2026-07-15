"use client";

import { useCallback, useState } from "react";

export type FieldErrors<F extends string> = Partial<Record<F, string>>;

export function useFormValidation<F extends string>() {
  const [errors, setErrors] = useState<FieldErrors<F>>({});

  const clearError = useCallback((field: F) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => setErrors({}), []);

  const setError = useCallback((field: F, message: string) => {
    setErrors((prev) => {
      if (!message) {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return { ...prev, [field]: message };
    });
  }, []);

  const validateAll = useCallback((validators: Partial<Record<F, () => string>>): boolean => {
    const next: FieldErrors<F> = {};
    let ok = true;
    (Object.keys(validators) as F[]).forEach((field) => {
      const fn = validators[field];
      if (!fn) return;
      const message = fn();
      if (message) {
        next[field] = message;
        ok = false;
      }
    });
    setErrors(next);
    return ok;
  }, []);

  const onBlur = useCallback((field: F, message: string) => {
    setError(field, message);
  }, [setError]);

  const fieldClass = useCallback(
    (base: string, field: F) => `${base}${errors[field] ? " is-invalid" : ""}`,
    [errors]
  );

  const focusFirstInvalid = useCallback(() => {
    window.setTimeout(() => {
      document
        .querySelector<HTMLElement>(".af-input.is-invalid, .af-select.is-invalid, .af-textarea.is-invalid, .login-input.is-invalid")
        ?.focus();
    }, 0);
  }, []);

  return {
    errors,
    setErrors,
    clearError,
    clearAll,
    setError,
    validateAll,
    onBlur,
    fieldClass,
    focusFirstInvalid,
  };
}
