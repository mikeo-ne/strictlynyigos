import "server-only";
import { all, get, run, tx } from "./db";
import { eventById, ticketTypesWithStock } from "./events";
import { emailButton, emailLayout, escapeHtml, sendMail } from "./mail";
import { subscribe } from "./subscribers";
import type { Order, TicketType } from "./types";
import { code, fmtDateTime, formatUGX, siteUrl, token } from "./util";

export class OrderError extends Error {}

export interface CartLine {
  ticketTypeId: number;
  qty: number;
}

export async function createOrder(input: {
  eventId: number;
  lines: CartLine[];
  name: string;
  email: string;
  phone: string;
  optIn: boolean;
  provider: string;
  free?: boolean; // comp / guest-list tickets
}): Promise<Order> {
  return tx(async (q) => {
    const ev = await eventById(input.eventId, q);
    if (!ev || ev.status !== "published") throw new OrderError("This event is not on sale.");
    if (new Date(ev.ends_at || ev.starts_at).getTime() < Date.now()) throw new OrderError("This event has already happened.");
    // Lock this event's ticket rows so concurrent checkouts can't oversell.
    const stock = new Map((await ticketTypesWithStock(ev.id, true, q, true)).map((t) => [t.id, t]));
    const lines = input.lines.filter((l) => l.qty > 0);
    if (!lines.length) throw new OrderError("Pick at least one ticket.");
    let total = 0;
    for (const l of lines) {
      const t = stock.get(l.ticketTypeId);
      if (!t) throw new OrderError("That ticket type is no longer available.");
      if (l.qty > t.max_per_order && !input.free) throw new OrderError(`Max ${t.max_per_order} × ${t.name} per order.`);
      if (l.qty > t.remaining)
        throw new OrderError(t.remaining === 0 ? `${t.name} is sold out.` : `Only ${t.remaining} × ${t.name} left.`);
      total += input.free ? 0 : t.price * l.qty;
    }
    let ref = "";
    do ref = "SN-" + code(6);
    while (await q.get("SELECT 1 FROM orders WHERE ref = ?", ref));
    const orderId = await q.insert(
      `INSERT INTO orders (ref, access_token, event_id, buyer_name, email, phone, total, provider, marketing_opt_in, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      ref,
      token(18),
      ev.id,
      input.name,
      input.email,
      input.phone,
      total,
      input.provider,
      input.optIn ? 1 : 0,
    );
    for (const l of lines)
      await q.run(
        "INSERT INTO order_items (order_id, ticket_type_id, qty, unit_price) VALUES (?, ?, ?, ?)",
        orderId,
        l.ticketTypeId,
        l.qty,
        input.free ? 0 : stock.get(l.ticketTypeId)!.price,
      );
    return (await q.get<Order>("SELECT * FROM orders WHERE id = ?", orderId))!;
  });
}

export function orderByRef(ref: string) {
  return get<Order>("SELECT * FROM orders WHERE ref = ?", ref);
}

export function orderItems(orderId: number) {
  return all<{ qty: number; unit_price: number; name: string; admits: number; ticket_type_id: number }>(
    `SELECT oi.qty, oi.unit_price, oi.ticket_type_id, t.name, t.admits FROM order_items oi
     JOIN ticket_types t ON t.id = oi.ticket_type_id WHERE oi.order_id = ? ORDER BY oi.id`,
    orderId,
  );
}

export function orderTickets(orderId: number) {
  return all<{ id: number; code: string; checked_in_at: string | null; name: string; admits: number }>(
    `SELECT tk.id, tk.code, tk.checked_in_at, t.name, t.admits FROM tickets tk
     JOIN ticket_types t ON t.id = tk.ticket_type_id WHERE tk.order_id = ? ORDER BY tk.id`,
    orderId,
  );
}

export function orderUrl(o: Pick<Order, "ref" | "access_token">) {
  return `/orders/${o.ref}?t=${o.access_token}`;
}

/** Idempotent: safe to call from both the redirect callback and the webhook at the same time. */
export async function markOrderPaid(ref: string, providerRef: string | null) {
  const changed = await tx(async (q) => {
    const o = await q.get<Order>("SELECT * FROM orders WHERE ref = ? FOR UPDATE", ref);
    if (!o) throw new OrderError("Order not found");
    if (o.status === "paid") return false;
    await q.run(
      "UPDATE orders SET status = 'paid', paid_at = ?, provider_ref = COALESCE(?, provider_ref) WHERE id = ?",
      new Date().toISOString(),
      providerRef,
      o.id,
    );
    const items = await q.all<{ ticket_type_id: number; qty: number }>("SELECT ticket_type_id, qty FROM order_items WHERE order_id = ?", o.id);
    for (const item of items) {
      for (let i = 0; i < item.qty; i++) {
        // 10 chars from a 32-symbol alphabet: collisions are astronomically unlikely; UNIQUE constraint backs it up.
        await q.run("INSERT INTO tickets (code, order_id, ticket_type_id, event_id) VALUES (?, ?, ?, ?)", code(10), o.id, item.ticket_type_id, o.event_id);
      }
    }
    return true;
  });
  if (changed) {
    const o = (await orderByRef(ref))!;
    if (o.marketing_opt_in) await subscribe(o.email, { name: o.buyer_name, phone: o.phone, source: "ticket purchase", welcome: false });
    await sendOrderEmail(o);
  }
  return changed;
}

export async function markOrderFailed(ref: string, status: "failed" | "cancelled" = "failed") {
  await run("UPDATE orders SET status = ? WHERE ref = ? AND status = 'pending'", status, ref);
}

export async function sendOrderEmail(o: Order) {
  const ev = (await eventById(o.event_id))!;
  const items = await orderItems(o.id);
  const tickets = await orderTickets(o.id);
  const link = siteUrl() + orderUrl(o);
  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #2a2a2a">${i.qty} × ${escapeHtml(i.name)}${i.admits > 1 ? ` <span style="color:#9a9a9a">(admits ${i.admits})</span>` : ""}</td><td align="right" style="padding:8px 0;border-bottom:1px solid #2a2a2a">${formatUGX(i.qty * i.unit_price)}</td></tr>`,
    )
    .join("");
  await sendMail({
    to: o.email,
    subject: `Your tickets: ${ev.title} (${o.ref})`,
    html: await emailLayout({
      title: "Your tickets",
      preheader: `${tickets.length} ticket(s) for ${ev.title}`,
      bodyHtml: `<h1 style="margin:0 0 8px;color:#fff;font-size:24px">You're in, ${escapeHtml(o.buyer_name.split(" ")[0])}! 🎉</h1>
<p style="margin:0 0 16px">${o.total > 0 ? "Payment received for" : "You're on the guest list for"} <b>${escapeHtml(ev.title)}</b>.</p>
<p style="margin:0;color:#FED100;font-weight:bold">${escapeHtml(fmtDateTime(ev.starts_at))}</p>
<p style="margin:0 0 16px;color:#bdbdbd">${escapeHtml(ev.venue)}${ev.address ? " — " + escapeHtml(ev.address) : ""}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px">${rows}
<tr><td style="padding:10px 0;font-weight:bold">Total paid</td><td align="right" style="padding:10px 0;font-weight:bold">${formatUGX(o.total)}</td></tr></table>
<p style="margin:16px 0 4px">Your ticket codes:</p>
<p style="font-family:monospace;font-size:18px;letter-spacing:2px;color:#FED100;margin:0">${tickets.map((t) => t.code).join("<br>")}</p>
${emailButton(link, "Open my QR tickets")}
<p style="color:#9a9a9a;font-size:13px">Show the QR code at the gate. Each code can only be scanned once. Order ref: ${o.ref}. ${ev.age_limit ? `Strictly ${ev.age_limit}+ — carry ID.` : ""}</p>`,
    }),
  });
}

export function ticketTypeById(id: number) {
  return get<TicketType>("SELECT * FROM ticket_types WHERE id = ?", id);
}
