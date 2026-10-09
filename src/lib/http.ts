import { NextResponse } from "next/server";
import type { ErrorCode } from "./errors";

export function ok<T>(body: T, status = 200) {
  return NextResponse.json(body, { status });
}

export function fail(error: ErrorCode, status = 400, field?: string) {
  return NextResponse.json({ error, field }, { status });
}

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const data = (await req.json()) as unknown;
    return data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
