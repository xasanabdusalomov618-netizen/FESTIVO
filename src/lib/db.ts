// Minimal JSON-file database. Every call reads/writes the file so that all
// route handlers (which may run in separate module instances) stay consistent.
// Operations are synchronous, so read-modify-write sections cannot interleave.
import fs from "node:fs";
import path from "node:path";
import type { Database } from "./types";
import { createSeedDatabase } from "./seed";

const DB_VERSION = 1;

export function dbPath(): string {
  return process.env.FESTIVO_DB_PATH ?? path.join(process.cwd(), "data", "festivo-db.json");
}

function writeDb(db: Database): void {
  const file = dbPath();
  fs.mkdirSync(/*turbopackIgnore: true*/ path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(/*turbopackIgnore: true*/ tmp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(/*turbopackIgnore: true*/ tmp, /*turbopackIgnore: true*/ file);
}

export function readDb(): Database {
  const file = dbPath();
  if (!fs.existsSync(/*turbopackIgnore: true*/ file)) {
    const db = createSeedDatabase();
    writeDb(db);
    return db;
  }
  const parsed = JSON.parse(fs.readFileSync(/*turbopackIgnore: true*/ file, "utf8")) as Database;
  if (parsed.version !== DB_VERSION) {
    throw new Error(`Unsupported FESTIVO database version ${parsed.version} in ${file}`);
  }
  return parsed;
}

/** Runs fn against the latest database state and persists the result. */
export function updateDb<T>(fn: (db: Database) => T): T {
  const db = readDb();
  const result = fn(db);
  writeDb(db);
  return result;
}

export function nextId(db: Database, prefix: string): string {
  db.seq += 1;
  return `${prefix}-${Date.now().toString(36)}${db.seq.toString(36)}`;
}
