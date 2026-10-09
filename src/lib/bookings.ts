// Booking business rules. All money is recalculated here from the database,
// never trusted from the browser.
import type { Database, Booking, BookingLine, BookingStatus, PaymentMethod, PublicUser, Product, BookingCustomer } from "./types";
import { BOOKING_STATUSES } from "./types";
import type { ErrorCode } from "./errors";
import { availableQty } from "./availability";
import { MAX_DAYS, MAX_QTY, MIN_DAYS, priceLine, sumTotals } from "./pricing";
import { todayIso } from "./dates";
import { formatPhone, normalizePhone, trimmed } from "./validation";

export const MAX_LINES = 30;

export interface CartLineInput {
  productId: string;
  qty: number;
  eventDate: string;
  days: number;
  delivery: boolean;
  installation: boolean;
}

export interface BookingInput {
  customer: { fullName: unknown; phone: unknown; address: unknown; notes: unknown };
  paymentMethod: unknown;
  lines: unknown;
}

type Result<T> = { ok: true; value: T } | { ok: false; error: ErrorCode; field?: string };

const fail = <T = never>(error: ErrorCode, field?: string): Result<T> => ({ ok: false, error, field });

function isInt(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v);
}

function parseLine(raw: unknown): Result<CartLineInput> {
  if (!raw || typeof raw !== "object") return fail("cart_empty");
  const r = raw as Record<string, unknown>;
  if (typeof r.productId !== "string" || !r.productId) return fail("product_unavailable", "productId");
  if (!isInt(r.qty) || r.qty < 1 || r.qty > MAX_QTY) return fail("qty_invalid", "qty");
  if (typeof r.eventDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(r.eventDate)) return fail("date_invalid", "eventDate");
  const d = new Date(`${r.eventDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== r.eventDate) return fail("date_invalid", "eventDate");
  if (r.eventDate < todayIso()) return fail("date_past", "eventDate");
  if (!isInt(r.days) || r.days < MIN_DAYS || r.days > MAX_DAYS) return fail("days_invalid", "days");
  return {
    ok: true,
    value: {
      productId: r.productId,
      qty: r.qty,
      eventDate: r.eventDate,
      days: r.days,
      delivery: r.delivery === true,
      installation: r.installation === true,
    },
  };
}

/**
 * Validates and prices a set of lines against the live catalogue and stock.
 * Shared by checkout creation; returns priced BookingLine objects.
 */
export function buildLines(db: Database, rawLines: unknown): Result<BookingLine[]> {
  if (!Array.isArray(rawLines) || rawLines.length === 0) return fail("cart_empty", "lines");
  if (rawLines.length > MAX_LINES) return fail("cart_too_many", "lines");

  const parsed: CartLineInput[] = [];
  for (const raw of rawLines) {
    const p = parseLine(raw);
    if (!p.ok) return p;
    parsed.push(p.value);
  }

  // Track stock consumed by earlier lines in the same request.
  const scratch: Booking = {
    id: "__scratch__",
    code: "",
    userId: "",
    status: "pending",
    paymentMethod: "cash",
    customer: { fullName: "", phone: "", address: "", notes: "" },
    lines: [],
    subtotal: 0,
    deliveryTotal: 0,
    installationTotal: 0,
    total: 0,
    history: [],
    createdAt: "",
    updatedAt: "",
  };

  const lines: BookingLine[] = [];
  for (const input of parsed) {
    const product: Product | undefined = db.products.find((p) => p.id === input.productId);
    if (!product || !product.active) return fail("product_unavailable", "productId");
    const available = availableQty(product, [...db.bookings, scratch], input.eventDate, input.days);
    if (input.qty > available) return fail("insufficient_stock", "qty");
    const priced = priceLine(product, input);
    const line: BookingLine = {
      productId: product.id,
      nameSnapshot: product.name,
      vendorId: product.vendorId,
      qty: input.qty,
      eventDate: input.eventDate,
      days: input.days,
      delivery: input.delivery,
      installation: input.installation && product.installable,
      pricePerDay: product.pricePerDay,
      ...priced,
    };
    lines.push(line);
    scratch.lines.push(line);
  }
  return { ok: true, value: lines };
}

export function nextBookingCode(db: Database): string {
  const max = db.bookings.reduce((m, b) => {
    const n = Number(b.code.replace(/^FV-/, ""));
    return Number.isFinite(n) && n > m ? n : m;
  }, 1000);
  return `FV-${max + 1}`;
}

export function validateCustomer(raw: BookingInput["customer"]): Result<BookingCustomer> {
  const fullName = trimmed(raw.fullName, 80);
  if (fullName.length < 2) return fail("name_required", "fullName");
  const phone = normalizePhone(trimmed(raw.phone, 30));
  if (!phone) return fail("phone_invalid", "phone");
  const address = trimmed(raw.address, 200);
  if (address.length < 5) return fail("address_required", "address");
  const notes = trimmed(raw.notes, 500);
  if (typeof raw.notes === "string" && raw.notes.trim().length > 500) return fail("notes_long", "notes");
  return { ok: true, value: { fullName, phone: formatPhone(phone), address, notes } };
}

export function createBooking(db: Database, user: PublicUser, input: BookingInput): Result<Booking> {
  const customer = validateCustomer(input.customer);
  if (!customer.ok) return customer;

  const payment = input.paymentMethod as PaymentMethod;
  if (payment !== "cash" && payment !== "transfer") return fail("payment_invalid", "paymentMethod");

  const lines = buildLines(db, input.lines);
  if (!lines.ok) return lines;

  const totals = sumTotals(lines.value);
  const now = new Date().toISOString();
  const booking: Booking = {
    id: `b-${Date.now().toString(36)}${(db.seq + 1).toString(36)}`,
    code: nextBookingCode(db),
    userId: user.id,
    status: "pending",
    paymentMethod: payment,
    customer: customer.value,
    lines: lines.value,
    subtotal: totals.subtotal,
    deliveryTotal: totals.deliveryTotal,
    installationTotal: totals.installationTotal,
    total: totals.total,
    history: [{ status: "pending", at: now }],
    createdAt: now,
    updatedAt: now,
  };
  db.seq += 1;
  db.bookings.push(booking);
  db.notifications.push({
    id: `n-${Date.now().toString(36)}${db.seq.toString(36)}`,
    userId: user.id,
    bookingId: booking.id,
    bookingCode: booking.code,
    kind: "booking_created",
    status: "pending",
    read: false,
    createdAt: now,
  });
  return { ok: true, value: booking };
}

export function isBookingStatus(v: unknown): v is BookingStatus {
  return typeof v === "string" && (BOOKING_STATUSES as readonly string[]).includes(v);
}

const VENDOR_STATUSES: BookingStatus[] = ["confirmed", "delivering", "installed", "completed", "cancelled"];

/** Changes a booking's status if the acting user is allowed to do so. */
export function changeBookingStatus(
  db: Database,
  user: PublicUser,
  bookingId: string,
  nextStatus: unknown,
): Result<Booking> {
  const booking = db.bookings.find((b) => b.id === bookingId);
  if (!booking) return fail("not_found");
  if (!isBookingStatus(nextStatus)) return fail("status_invalid", "status");

  if (user.role === "customer") {
    if (booking.userId !== user.id) return fail("forbidden");
    if (nextStatus !== "cancelled" || booking.status !== "pending") return fail("cancel_not_allowed", "status");
  } else if (user.role === "vendor") {
    const owns = booking.lines.some((l) => l.vendorId === user.vendorId);
    if (!owns) return fail("forbidden");
    if (!VENDOR_STATUSES.includes(nextStatus)) return fail("status_forbidden", "status");
    if (booking.status === "cancelled" || booking.status === "completed") return fail("status_forbidden", "status");
  }

  if (booking.status === nextStatus) return { ok: true, value: booking };

  const now = new Date().toISOString();
  booking.status = nextStatus;
  booking.updatedAt = now;
  booking.history.push({ status: nextStatus, at: now });
  db.seq += 1;
  db.notifications.push({
    id: `n-${Date.now().toString(36)}${db.seq.toString(36)}`,
    userId: booking.userId,
    bookingId: booking.id,
    bookingCode: booking.code,
    kind: "status_changed",
    status: nextStatus,
    read: false,
    createdAt: now,
  });
  return { ok: true, value: booking };
}
