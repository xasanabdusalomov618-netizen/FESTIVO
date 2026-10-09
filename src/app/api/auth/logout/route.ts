import { endSession } from "@/lib/auth";
import { ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST() {
  await endSession();
  return ok({ ok: true });
}
