/** Form validation helpers. Messages must be human readable. */

export interface FieldErrors {
  [field: string]: string;
}

export function validateRequired(value: string, label: string, errors: FieldErrors, field: string): void {
  if (!value || !value.trim()) {
    errors[field] = `${label} is required.`;
  }
}

export function validateEmail(value: string, errors: FieldErrors, field = "email"): void {
  if (!value.trim()) {
    errors[field] = "Email is required.";
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    errors[field] = "Enter a valid email address, for example name@example.com.";
  }
}

export function validatePhone(value: string, errors: FieldErrors, field = "phone"): void {
  if (!value.trim()) {
    errors[field] = "Phone number is required.";
    return;
  }
  const cleaned = value.replace(/[\s\-()]/g, "");
  if (!/^(\+234|0)\d{10}$/.test(cleaned)) {
    errors[field] = "Enter a valid Nigerian phone number, for example 0803 123 4567.";
  }
}

export function validateNumber(
  value: string | number,
  label: string,
  errors: FieldErrors,
  field: string,
  options: { min?: number; max?: number; integer?: boolean } = {},
): void {
  const num = typeof value === "number" ? value : Number(value);
  if (value === "" || value === null || value === undefined || Number.isNaN(num)) {
    errors[field] = `${label} must be a number.`;
    return;
  }
  if (options.integer && !Number.isInteger(num)) {
    errors[field] = `${label} must be a whole number.`;
    return;
  }
  if (options.min !== undefined && num < options.min) {
    errors[field] = `${label} must be at least ${options.min}.`;
    return;
  }
  if (options.max !== undefined && num > options.max) {
    errors[field] = `${label} must be no more than ${options.max}.`;
  }
}

export function validateDate(value: string, label: string, errors: FieldErrors, field: string): void {
  if (!value) {
    errors[field] = `${label} is required.`;
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    errors[field] = `${label} must be a valid date.`;
    return;
  }
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    errors[field] = `${label} must be a valid date.`;
  }
}

export function validatePassword(value: string, errors: FieldErrors, field = "password"): void {
  if (!value) {
    errors[field] = "Password is required.";
    return;
  }
  if (value.length < 6) {
    errors[field] = "Password must be at least 6 characters.";
  }
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
