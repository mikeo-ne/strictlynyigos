import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { get, run } from "./db";
import { siteUrl, token } from "./util";
import type { Role, User } from "./types";

const COOKIE = "sn_session";
const MAX_AGE_DAYS = 30;

const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export async function createSession(userId: number) {
  const t = token(32);
  const expires = new Date(Date.now() + MAX_AGE_DAYS * 86400 * 1000);
  await run("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", sha(t), userId, expires.toISOString());
  await run("DELETE FROM sessions WHERE expires_at < ?", new Date().toISOString());
  const jar = await cookies();
  jar.set(COOKIE, t, {
    httpOnly: true,
    sameSite: "lax",
    secure: siteUrl().startsWith("https"),
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const t = jar.get(COOKIE)?.value;
  if (t) await run("DELETE FROM sessions WHERE id = ?", sha(t));
  jar.delete(COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  const t = jar.get(COOKIE)?.value;
  if (!t) return null;
  const u = await get<User>(
    `SELECT u.id, u.email, u.name, u.role, u.created_at FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > ?`,
    sha(t),
    new Date().toISOString(),
  );
  return u ?? null;
}

/** Use in every admin page AND server action. Redirects to login if not allowed. */
export async function requireUser(roles?: Role[]): Promise<User> {
  const u = await currentUser();
  if (!u) redirect("/admin/login");
  if (roles && !roles.includes(u.role)) redirect("/admin?denied=1");
  return u;
}

export async function userCount() {
  return (await get<{ n: number }>("SELECT COUNT(*) AS n FROM users"))?.n ?? 0;
}

/* Login throttling, stored in the DB so it works across serverless instances. */
const WINDOW_MS = 15 * 60 * 1000;
export async function tooManyAttempts(email: string) {
  const a = await get<{ n: number; last_at: string }>("SELECT n, last_at FROM login_attempts WHERE email = ?", email);
  return !!a && a.n >= 8 && Date.now() - new Date(a.last_at).getTime() < WINDOW_MS;
}
export async function recordFailedLogin(email: string) {
  const now = new Date().toISOString();
  const cutoff = new Date(Date.now() - WINDOW_MS).toISOString();
  await run(
    `INSERT INTO login_attempts (email, n, last_at) VALUES (?, 1, ?)
     ON CONFLICT (email) DO UPDATE SET n = CASE WHEN login_attempts.last_at < ? THEN 1 ELSE login_attempts.n + 1 END, last_at = EXCLUDED.last_at`,
    email, now, cutoff,
  );
}
export async function clearLoginAttempts(email: string) {
  await run("DELETE FROM login_attempts WHERE email = ?", email);
}
