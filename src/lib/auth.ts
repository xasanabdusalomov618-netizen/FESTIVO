// Session handling for customers, vendors and admins (server-side only).
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { readDb, updateDb } from "./db";
import type { PublicUser, User } from "./types";

export const SESSION_COOKIE = "festivo_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function toPublicUser(u: User): PublicUser {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, vendorId: u.vendorId };
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = readDb();
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;
  const user = db.users.find((u) => u.id === session.userId);
  return user ? toPublicUser(user) : null;
}

export async function startSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  updateDb((db) => {
    db.sessions.push({ token, userId, createdAt: new Date().toISOString() });
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    updateDb((db) => {
      db.sessions = db.sessions.filter((s) => s.token !== token);
    });
  }
  store.delete(SESSION_COOKIE);
}
