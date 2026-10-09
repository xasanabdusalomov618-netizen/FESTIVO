// Error codes returned by the API. The UI translates each code through the
// dictionary (`err.<code>`), so every code must exist in all three languages.
export const ERROR_CODES = [
  "generic",
  "unauthorized",
  "forbidden",
  "not_found",
  "invalid_json",
  "invalid_credentials",
  "email_invalid",
  "email_taken",
  "password_short",
  "name_required",
  "phone_invalid",
  "address_required",
  "notes_long",
  "payment_invalid",
  "cart_empty",
  "cart_too_many",
  "product_unavailable",
  "qty_invalid",
  "date_invalid",
  "date_past",
  "days_invalid",
  "insufficient_stock",
  "status_invalid",
  "status_forbidden",
  "cancel_not_allowed",
  "price_invalid",
  "stock_invalid",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    public status: number = 400,
    public field?: string,
  ) {
    super(code);
  }
}

export type ActionResult<T> = { ok: true; value: T } | { ok: false; error: ErrorCode; field?: string };
