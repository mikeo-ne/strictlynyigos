import "server-only";
import type { Order } from "./types";
import { orderUrl } from "./orders";
import { siteUrl } from "./util";

export type Provider = "demo" | "flutterwave";

export function paymentProvider(): Provider {
  const p = (process.env.PAYMENTS_PROVIDER || "demo").toLowerCase();
  if (p === "flutterwave" && process.env.FLW_SECRET_KEY) return "flutterwave";
  return "demo";
}

const FLW = "https://api.flutterwave.com/v3";

/** Returns the URL the buyer should be sent to in order to pay. */
export async function startPayment(order: Order, eventTitle: string): Promise<string> {
  if (order.provider === "flutterwave") {
    const res = await fetch(`${FLW}/payments`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        tx_ref: order.ref,
        amount: order.total,
        currency: "UGX",
        redirect_url: `${siteUrl()}/api/payments/flutterwave/callback`,
        payment_options: "mobilemoneyuganda,card",
        customer: { email: order.email, phonenumber: order.phone, name: order.buyer_name },
        customizations: { title: "Strictly Nyigos Tickets", description: eventTitle },
        meta: { order_ref: order.ref },
      }),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as { status?: string; data?: { link?: string }; message?: string };
    if (!res.ok || data.status !== "success" || !data.data?.link) {
      throw new Error(data.message || "Could not start payment. Please try again.");
    }
    return data.data.link;
  }
  return `/pay/demo/${order.ref}?t=${order.access_token}`;
}

export interface VerifiedTx {
  ok: boolean;
  txRef?: string;
  id?: string;
  amount?: number;
  currency?: string;
  status?: string;
}

/** Always verify server-to-server; never trust redirect query params alone. */
export async function verifyFlutterwave(transactionId: string): Promise<VerifiedTx> {
  if (!/^\d+$/.test(transactionId)) return { ok: false };
  const res = await fetch(`${FLW}/transactions/${transactionId}/verify`, {
    headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` },
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as {
    status?: string;
    data?: { id: number; tx_ref: string; amount: number; charged_amount: number; currency: string; status: string };
  };
  if (!res.ok || data.status !== "success" || !data.data) return { ok: false };
  const d = data.data;
  return { ok: d.status === "successful", txRef: d.tx_ref, id: String(d.id), amount: d.amount, currency: d.currency, status: d.status };
}

export function isValidPayment(order: Order, v: VerifiedTx) {
  return v.ok && v.txRef === order.ref && v.currency === order.currency && (v.amount ?? 0) >= order.total;
}

export { orderUrl };
