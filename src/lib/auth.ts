import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { get, run } from "./db";
import { token } from "./util";
import type { Role, User } from "./types";

const COOKIE = "sn_session";
const MAX_AGE_DAYS = 30;

const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export async function createSession(userId: number) {
  const t = token(32);
  const expires = new Date(Date.now() + MAX_AGE_DAYS * 86400 * 1000);
  run("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", sha(t), userId, expires.toISOString());
  run("DELETE FROM sessions WHERE expires_at < ?", new Date().toISOString());
  const jar = await cookies();
  jar.set(COOKIE, t, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && (process.env.SITE_URL || "").startsWith("https"),
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const t = jar.get(COOKIE)?.value;
  if (t) run("DELETE FROM sessions WHERE id = ?", sha(t));
  jar.delete(COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  const t = jar.get(COOKIE)?.value;
  if (!t) return null;
  const u = get<User>(
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

export const can = {
  content: (u: User) => u.role === "admin" || u.role === "editor",
  admin: (u: User) => u.role === "admin",
  door: (u: User) => !!u,
};

export function userCount() {
  return (get<{ n: number }>("SELECT COUNT(*) n FROM users")?.n ?? 0) as number;
}
