// Database access. Postgres everywhere:
//  • Production / Vercel: set DATABASE_URL (Neon via Vercel Storage sets it automatically).
//  • Local dev without DATABASE_URL: an embedded Postgres (PGlite) stored in ./data/pg — zero setup.
// SQL is written with `?` placeholders; they're converted to $1, $2… for Postgres.
// NOTE: no "server-only" import here so the seed script (tsx) can use this module too.
import path from "node:path";
import { SCHEMA, SCHEMA_VERSION } from "./schema";
import type { Pool as PgPool } from "pg";

export type Row = Record<string, unknown>;
type Exec = (sql: string, params: unknown[]) => Promise<{ rows: Row[]; count: number }>;
interface Driver {
  exec: Exec;
  script: (sql: string) => Promise<void>;
  transaction: <T>(fn: (exec: Exec) => Promise<T>) => Promise<T>;
  kind: "postgres" | "pglite";
}

export const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
export const DATA_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR || "./data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

const toPg = (sql: string) => {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
};

async function pgDriver(): Promise<Driver> {
  const pg = (await import("pg")).default;
  pg.types.setTypeParser(20, (v: string) => Number(v)); // int8 (COUNT) -> number
  pg.types.setTypeParser(1700, (v: string) => Number(v)); // numeric (SUM) -> number
  const local = /@(localhost|127\.0\.0\.1)(:|\/)/.test(DATABASE_URL);
  const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    max: Number(process.env.DB_POOL_MAX || 5),
    idleTimeoutMillis: 5000,
    ssl: local ? undefined : { rejectUnauthorized: false },
  });
  try {
    // Lets Vercel Fluid compute close idle connections before suspending a function.
    const { attachDatabasePool } = await import("@vercel/functions");
    attachDatabasePool(pool);
  } catch {}
  const run = async (q: { query: PgPool["query"] }, sql: string, params: unknown[]) => {
    const r = await q.query(toPg(sql), params as unknown[]);
    return { rows: r.rows as Row[], count: r.rowCount ?? 0 };
  };
  return {
    kind: "postgres",
    exec: (sql, params) => run(pool, sql, params),
    script: async (sql) => {
      await pool.query(sql);
    },
    transaction: async (fn) => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const out = await fn((sql, params) => run(client as unknown as PgPool, sql, params));
        await client.query("COMMIT");
        return out;
      } catch (e) {
        await client.query("ROLLBACK").catch(() => {});
        throw e;
      } finally {
        client.release();
      }
    },
  };
}

async function pgliteDriver(): Promise<Driver> {
  if (process.env.VERCEL)
    throw new Error("DATABASE_URL is not set. In Vercel open Storage → Create Database → Neon (Postgres), connect it to this project, then redeploy.");
  const { PGlite } = await import("@electric-sql/pglite");
  const fs = await import("node:fs");
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = await PGlite.create(path.join(DATA_DIR, "pg"), { parsers: { 20: Number, 1700: Number } });
  type Q = { query: typeof db.query };
  const run = async (q: Q, sql: string, params: unknown[]) => {
    const r = await q.query<Row>(toPg(sql), params as unknown[]);
    return { rows: r.rows, count: r.affectedRows ?? 0 };
  };
  return {
    kind: "pglite",
    exec: (sql, params) => run(db, sql, params),
    script: async (sql) => {
      await db.exec(sql);
    },
    transaction: (fn) => db.transaction((t) => fn((sql, params) => run(t as unknown as Q, sql, params))),
  };
}

const g = globalThis as unknown as { __sndb?: Promise<Driver> };

function driver(): Promise<Driver> {
  if (!g.__sndb) {
    g.__sndb = (async () => {
      const d = DATABASE_URL ? await pgDriver() : await pgliteDriver();
      // Skip DDL when the schema is current (fast cold starts, no table locks during busy sales).
      const v = await d.exec("SELECT version FROM schema_meta WHERE id = 1", []).catch(() => null);
      if (!v || Number(v.rows[0]?.version ?? 0) < SCHEMA_VERSION) {
        // One implicit transaction + advisory lock, so parallel cold starts can't race each other.
        await d.script(`SELECT pg_advisory_xact_lock(727274);\n${SCHEMA}`);
      }
      return d;
    })();
    g.__sndb.catch(() => (g.__sndb = undefined)); // retry on next request if init failed
  }
  return g.__sndb;
}

export interface Q {
  all<T = Row>(sql: string, ...params: unknown[]): Promise<T[]>;
  get<T = Row>(sql: string, ...params: unknown[]): Promise<T | undefined>;
  /** Returns number of affected rows. */
  run(sql: string, ...params: unknown[]): Promise<number>;
  /** INSERT … — returns the new row id. */
  insert(sql: string, ...params: unknown[]): Promise<number>;
}

function makeQ(exec: () => Promise<Exec>): Q {
  return {
    all: async <T,>(sql: string, ...p: unknown[]) => (await (await exec())(sql, p)).rows as T[],
    get: async <T,>(sql: string, ...p: unknown[]) => (await (await exec())(sql, p)).rows[0] as T | undefined,
    run: async (sql: string, ...p: unknown[]) => (await (await exec())(sql, p)).count,
    insert: async (sql: string, ...p: unknown[]) => Number((await (await exec())(`${sql} RETURNING id`, p)).rows[0].id),
  };
}

const root = makeQ(async () => (await driver()).exec);
export const all = root.all;
export const get = root.get;
export const run = root.run;
export const insert = root.insert;

/** Runs fn in a single transaction. Use the passed `q` for every query inside. */
export async function tx<T>(fn: (q: Q) => Promise<T>): Promise<T> {
  const d = await driver();
  return d.transaction((exec) => fn(makeQ(async () => exec)));
}

export async function dbKind() {
  return (await driver()).kind;
}

/** Builds a WHERE clause from optional filters: buildWhere([q && ["title ILIKE ?", `%${q}%`], ...]). */
export function buildWhere(parts: (false | null | undefined | "" | 0 | [string, ...unknown[]])[]) {
  const used = parts.filter(Boolean) as [string, ...unknown[]][];
  return {
    where: used.length ? "WHERE " + used.map((p) => `(${p[0]})`).join(" AND ") : "",
    params: used.flatMap((p) => p.slice(1)),
  };
}
