import crypto from "node:crypto";
import { markOrderPaid, orderByRef } from "@/lib/orders";
import { isValidPayment, verifyFlutterwave } from "@/lib/payments";

// Configure this URL + a secret hash in the Flutterwave dashboard (Settings → Webhooks).
export async function POST(req: Request) {
  const expected = process.env.FLW_WEBHOOK_HASH || "";
  const got = req.headers.get("verif-hash") || "";
  if (!expected || got.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected)))
    return new Response("unauthorized", { status: 401 });
  const body = (await req.json().catch(() => null)) as { data?: { id?: number; tx_ref?: string } } | null;
  const id = body?.data?.id;
  const ref = body?.data?.tx_ref;
  if (!id || !ref) return new Response("ignored", { status: 200 });
  const order = await orderByRef(ref);
  if (order && order.status !== "paid") {
    const v = await verifyFlutterwave(String(id));
    if (isValidPayment(order, v)) await markOrderPaid(ref, v.id!);
  }
  return new Response("ok", { status: 200 });
}
