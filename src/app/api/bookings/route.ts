import { updateDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createBooking } from "@/lib/bookings";
import { fail, ok, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized", 401);
  const body = await readJson(req);
  if (!body) return fail("invalid_json");

  const result = updateDb((db) => createBooking(db, user, {
    customer: (body.customer ?? {}) as { fullName: unknown; phone: unknown; address: unknown; notes: unknown },
    paymentMethod: body.paymentMethod,
    lines: body.lines,
  }));
  if (!result.ok) return fail(result.error, 400, result.field);
  return ok({ booking: { id: result.value.id, code: result.value.code, total: result.value.total } }, 201);
}
