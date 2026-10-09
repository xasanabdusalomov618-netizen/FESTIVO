import { readDb } from "@/lib/db";
import { availableQty } from "@/lib/availability";
import { fail, ok } from "@/lib/http";
import { MAX_DAYS, MIN_DAYS } from "@/lib/pricing";
import { isIsoDate } from "@/lib/pricing";
import { todayIso } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const productId = url.searchParams.get("productId") ?? "";
  const date = url.searchParams.get("date") ?? "";
  const days = Number(url.searchParams.get("days") ?? "1");
  const db = readDb();
  const product = db.products.find((p) => p.id === productId && p.active);
  if (!product) return fail("product_unavailable", 404, "productId");
  if (!isIsoDate(date)) return fail("date_invalid", 400, "eventDate");
  if (date < todayIso()) return fail("date_past", 400, "eventDate");
  if (!Number.isInteger(days) || days < MIN_DAYS || days > MAX_DAYS) return fail("days_invalid", 400, "days");
  return ok({ productId, date, days, available: availableQty(product, db.bookings, date, days), stock: product.stock });
}
