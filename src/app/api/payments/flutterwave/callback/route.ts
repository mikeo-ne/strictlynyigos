import { NextResponse } from "next/server";
import { markOrderFailed, markOrderPaid, orderByRef, orderUrl } from "@/lib/orders";
import { isValidPayment, verifyFlutterwave } from "@/lib/payments";
import { siteUrl } from "@/lib/util";

// Flutterwave redirects the buyer here: ?status=successful&tx_ref=SN-XXXX&transaction_id=123
export async function GET(req: Request) {
  const url = new URL(req.url);
  const ref = url.searchParams.get("tx_ref") || "";
  const status = url.searchParams.get("status") || "";
  const txId = url.searchParams.get("transaction_id") || "";
  const order = orderByRef(ref);
  if (!order) return NextResponse.redirect(siteUrl() + "/");
  if (order.status === "pending") {
    if (status === "cancelled") markOrderFailed(ref, "cancelled");
    else if (txId) {
      const v = await verifyFlutterwave(txId);
      if (isValidPayment(order, v)) await markOrderPaid(ref, v.id!);
      else if (v.status === "failed") markOrderFailed(ref);
    }
  }
  return NextResponse.redirect(siteUrl() + orderUrl(order));
}
