import { readDb } from "@/lib/db";
import { startSession, toPublicUser } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/http";
import { verifyPassword } from "@/lib/password";
import { trimmed } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return fail("invalid_json");
  const email = trimmed(body.email, 120).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  const user = readDb().users.find((u) => u.email === email);
  if (!user || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
    return fail("invalid_credentials", 401);
  }
  await startSession(user.id);
  return ok({ user: toPublicUser(user) });
}
