import { updateDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { changeBookingStatus } from "@/lib/bookings";
import { fail, ok, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized", 401);
  const body = await readJson(req);
  if (!body) return fail("invalid_json");

  const result = updateDb((db) => changeBookingStatus(db, user, id, body.status));
  if (!result.ok) return fail(result.error, result.error === "not_found" ? 404 : result.error === "forbidden" ? 403 : 400, result.field);
  return ok({ id: result.value.id, status: result.value.status });
}
