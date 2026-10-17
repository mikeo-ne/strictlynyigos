"use server";
import { all } from "@/lib/db";
import { sendOrderEmail } from "@/lib/orders";
import type { Order } from "@/lib/types";
import { isEmail, str } from "@/lib/util";
import type { FormState } from "@/app/actions";

export async function resendOrdersAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").toLowerCase();
  if (!isEmail(email)) return { error: "Enter a valid email." };
  const orders = all<Order>("SELECT * FROM orders WHERE email = ? AND status = 'paid' ORDER BY id DESC LIMIT 10", email);
  for (const o of orders) await sendOrderEmail(o);
  // Same message either way, so emails can't be probed.
  return { ok: true, message: "If we have tickets for that email, they're on their way to your inbox." };
}
