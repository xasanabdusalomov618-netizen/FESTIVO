// Role helpers that are safe to import from both server and client code.
import type { Role } from "./types";

export function homeForRole(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "vendor") return "/vendor";
  return "/bookings";
}

/** Only allow same-site relative redirects such as "/bookings". */
export function safeNext(value: string | null | undefined, fallback = "/"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
