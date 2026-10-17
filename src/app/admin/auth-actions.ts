"use server";

import { redirect } from "next/navigation";
import { clearLoginAttempts, createSession, destroySession, recordFailedLogin, tooManyAttempts, userCount } from "@/lib/auth";
import { get, insert } from "@/lib/db";
import { seedStarterContent } from "@/lib/seed";
import { hashPassword, verifyPassword } from "@/lib/password";
import { isEmail, str } from "@/lib/util";
import type { FormState } from "@/app/actions";

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  if (await tooManyAttempts(email)) return { error: "Too many attempts. Try again in 15 minutes." };
  const u = await get<{ id: number; password_hash: string }>("SELECT id, password_hash FROM users WHERE email = ?", email);
  if (!u || !verifyPassword(password, u.password_hash)) {
    await recordFailedLogin(email);
    return { error: "Wrong email or password." };
  }
  await clearLoginAttempts(email);
  await createSession(u.id);
  redirect("/admin");
}

export async function setupAction(_: FormState, fd: FormData): Promise<FormState> {
  if (await userCount() > 0) redirect("/admin/login");
  const name = str(fd, "name");
  const email = str(fd, "email").toLowerCase();
  const password = str(fd, "password");
  if (!name) return { error: "Enter your name." };
  if (!isEmail(email)) return { error: "Enter a valid email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  const userId = await insert("INSERT INTO users (email, name, password_hash, role) VALUES (?,?,?, 'admin')", email, name, hashPassword(password));
  if (fd.get("starter") === "on") await seedStarterContent({ authorId: userId, authorName: name });
  await createSession(userId);
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}
