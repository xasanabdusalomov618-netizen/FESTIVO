import { updateDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized", 401);
  updateDb((db) => {
    for (const n of db.notifications) if (n.userId === user.id) n.read = true;
  });
  return ok({ ok: true });
}
