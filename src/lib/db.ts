import "server-only";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export const DATA_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR || "./data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

function open() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const db = new Database(path.join(DATA_DIR, "strictlynyigos.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  const schema = fs.readFileSync(path.join(/*turbopackIgnore: true*/ process.cwd(), "src/lib/schema.sql"), "utf8");
  db.exec(schema);
  return db;
}

const g = globalThis as unknown as { __sndb?: Database.Database };
export const db: Database.Database = g.__sndb ?? (g.__sndb = open());

export type Row = Record<string, unknown>;

export function all<T = Row>(sql: string, ...params: unknown[]): T[] {
  return db.prepare(sql).all(...params) as T[];
}
export function get<T = Row>(sql: string, ...params: unknown[]): T | undefined {
  return db.prepare(sql).get(...params) as T | undefined;
}
export function run(sql: string, ...params: unknown[]) {
  return db.prepare(sql).run(...params);
}
export const tx = <T>(fn: () => T): T => db.transaction(fn)();
