"use server";

import { redirect } from "next/navigation";
import { isEmail, str } from "@/lib/util";
import { subscribe } from "@/lib/subscribers";
import { createOrder, markOrderFailed, markOrderPaid, orderByRef, orderUrl, OrderError } from "@/lib/orders";
import { paymentProvider, startPayment } from "@/lib/payments";
import { eventById } from "@/lib/events";
import { get, run } from "@/lib/db";

export type FormState = { ok?: boolean; error?: string; message?: string } | null;

export async function subscribeAction(_: FormState, fd: FormData): Promise<FormState> {
  // Honeypot for bots
  if (str(fd, "website")) return { ok: true, message: "You're on the list!" };
  const email = str(fd, "email").toLowerCase();
  const name = str(fd, "name").slice(0, 80);
  if (!isEmail(email)) return { error: "Enter a valid email address." };
  const added = await subscribe(email, { name, source: str(fd, "source") || "website" });
  return { ok: true, message: added ? "You're on the list! Check your inbox 🔥" : "You're already on the list — see you on the floor." };
}

export async function buyTicketsAction(_: FormState, fd: FormData): Promise<FormState> {
  const eventId = Number(str(fd, "event_id"));
  const name = str(fd, "name").slice(0, 100);
  const email = str(fd, "email").toLowerCase();
  const phone = str(fd, "phone").replace(/[^\d+]/g, "").slice(0, 16);
  if (name.length < 2) return { error: "Enter your full name." };
  if (!isEmail(email)) return { error: "Enter a valid email — your tickets are sent there." };
  if (phone.replace(/\D/g, "").length < 9) return { error: "Enter your Mobile Money phone number." };
  const lines: { ticketTypeId: number; qty: number }[] = [];
  for (const [k, v] of fd.entries()) {
    const m = /^qty_(\d+)$/.exec(k);
    if (m && typeof v === "string") lines.push({ ticketTypeId: Number(m[1]), qty: Math.max(0, Math.min(50, parseInt(v, 10) || 0)) });
  }
  let target: string;
  try {
    const order = await createOrder({ eventId, lines, name, email, phone, optIn: fd.get("opt_in") === "on", provider: paymentProvider() });
    const ev = (await eventById(eventId))!;
    target = await startPayment(order, ev.title);
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    console.error(e);
    return { error: e instanceof Error ? e.message : "Something went wrong. Please try again." };
  }
  redirect(target);
}

/** Demo-mode checkout only: simulates the buyer approving the Mobile Money prompt. */
export async function demoPayAction(fd: FormData) {
  const ref = str(fd, "ref");
  const t = str(fd, "t");
  const decision = str(fd, "decision");
  const order = await orderByRef(ref);
  if (!order || order.access_token !== t || order.provider !== "demo") redirect("/");
  if (order.status === "pending") {
    if (decision === "approve") await markOrderPaid(ref, "DEMO-" + Date.now());
    else await markOrderFailed(ref, "cancelled");
  }
  redirect(orderUrl(order));
}

export async function unsubscribeAction(fd: FormData) {
  const t = str(fd, "token");
  const sub = await get<{ id: number }>("SELECT id FROM subscribers WHERE token = ?", t);
  if (sub) await run("UPDATE subscribers SET status='unsubscribed', unsubscribed_at=? WHERE id = ?", new Date().toISOString(), sub.id);
  redirect(`/unsubscribe?token=${encodeURIComponent(t)}&done=1`);
}
