import { hashPassword } from "@/lib/password";
import { readDb, updateDb } from "@/lib/db";
import { startSession, toPublicUser } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/http";
import { formatPhone, isValidEmail, normalizePhone, trimmed } from "@/lib/validation";
import type { User } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return fail("invalid_json");

  const name = trimmed(body.name, 80);
  if (name.length < 2) return fail("name_required", 400, "name");
  const email = trimmed(body.email, 120).toLowerCase();
  if (!isValidEmail(email)) return fail("email_invalid", 400, "email");
  const phone = normalizePhone(trimmed(body.phone, 30));
  if (!phone) return fail("phone_invalid", 400, "phone");
  const password = typeof body.password === "string" ? body.password : "";
  if (password.length < 6 || password.length > 128) return fail("password_short", 400, "password");

  const exists = readDb().users.some((u) => u.email === email);
  if (exists) return fail("email_taken", 409, "email");

  const { hash, salt } = hashPassword(password);
  const user = updateDb((db) => {
    if (db.users.some((u) => u.email === email)) return null;
    const created: User = {
      id: `u-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      name,
      email,
      phone: formatPhone(phone),
      role: "customer",
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: new Date().toISOString(),
    };
    db.users.push(created);
    return created;
  });
  if (!user) return fail("email_taken", 409, "email");

  await startSession(user.id);
  return ok({ user: toPublicUser(user) }, 201);
}
