import { currentUser } from "@/lib/auth";
import { csvResponse, toCSV } from "@/lib/csv";
import { all, buildWhere } from "@/lib/db";

export async function GET(req: Request) {
  const u = await currentUser();
  if (!u || u.role !== "admin") return new Response("Forbidden", { status: 403 });
  const url = new URL(req.url);
  const event = url.searchParams.get("event") || "";
  const status = url.searchParams.get("status") || "";
  const { where, params } = buildWhere([Number(event) > 0 && ["o.event_id = ?", Number(event)], !!status && ["o.status = ?", status]]);
  const rows = await all(
    `SELECT o.ref, e.title AS event, o.buyer_name, o.email, o.phone, o.total, o.currency, o.status, o.provider, o.provider_ref,
       (SELECT string_agg(oi.qty || ' x ' || t.name, '; ' ORDER BY oi.id) FROM order_items oi JOIN ticket_types t ON t.id = oi.ticket_type_id WHERE oi.order_id = o.id) AS items,
       (SELECT string_agg(tk.code, ' ' ORDER BY tk.id) FROM tickets tk WHERE tk.order_id = o.id) AS ticket_codes,
       o.created_at, o.paid_at
     FROM orders o JOIN events e ON e.id = o.event_id
     ${where} ORDER BY o.id`,
    ...params,
  );
  const headers = ["ref", "event", "buyer_name", "email", "phone", "items", "total", "currency", "status", "provider", "provider_ref", "ticket_codes", "created_at", "paid_at"];
  return csvResponse(toCSV(rows, headers), `strictlynyigos-orders-${new Date().toISOString().slice(0, 10)}.csv`);
}
