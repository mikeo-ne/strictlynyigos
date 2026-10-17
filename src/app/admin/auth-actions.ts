"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession, userCount } from "@/lib/auth";
import { get, run } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { isEmail, str } from "@/lib/util";
import type { FormState } from "@/app/actions";

const attempts = new Map<string, { n: number; at: number }>();

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  const a = attempts.get(email);
  if (a && a.n >= 8 && Date.now() - a.at < 15 * 60 * 1000) return { error: "Too many attempts. Try again in 15 minutes." };
  const u = get<{ id: number; password_hash: string }>("SELECT id, password_hash FROM users WHERE email = ?", email);
  if (!u || !verifyPassword(password, u.password_hash)) {
    attempts.set(email, { n: (a?.n ?? 0) + 1, at: Date.now() });
    return { error: "Wrong email or password." };
  }
  attempts.delete(email);
  await createSession(u.id);
  redirect("/admin");
}

export async function setupAction(_: FormState, fd: FormData): Promise<FormState> {
  if (userCount() > 0) redirect("/admin/login");
  const name = str(fd, "name");
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  if (!name) return { error: "Enter your name." };
  if (!isEmail(email)) return { error: "Enter a valid email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  const info = run("INSERT INTO users (email, name, password_hash, role) VALUES (?,?,?, 'admin')", email, name, hashPassword(password));
  await createSession(Number(info.lastInsertRowid));
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}
