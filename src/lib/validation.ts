// Input normalisation and validation shared by API routes.
import type { ErrorCode } from "./errors";

export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[\s\-()]/g, "");
  let national: string | null = null;
  if (/^\+998\d{9}$/.test(digits)) national = digits.slice(4);
  else if (/^998\d{9}$/.test(digits)) national = digits.slice(3);
  else if (/^\d{9}$/.test(digits)) national = digits;
  if (!national) return null;
  return `+998${national}`;
}

export function formatPhone(e164: string): string {
  // +998901234567 -> +998 90 123 45 67
  const m = /^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(e164);
  return m ? `+998 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : e164;
}

export function isValidEmail(email: string): boolean {
  return email.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function trimmed(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export type FieldError = { error: ErrorCode; field: string };

export function firstError(...checks: Array<FieldError | null>): FieldError | null {
  for (const c of checks) if (c) return c;
  return null;
}
