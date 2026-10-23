import Link from "next/link";
import { Badge, Empty, PageHeader, Stat, Table } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { all, buildWhere, get } from "@/lib/db";
import type { EventRow, Order } from "@/lib/types";
import { fmtDateTime, formatUGX, shortUGX } from "@/lib/util";

export const metadata = { title: "Orders" };

export default async function Orders({ searchParams }: { searchParams: Promise<{ event?: string; status?: string; q?: string }> }) {
  await requireUser(["admin"]);
  const { event = "", status = "", q = "" } = await searchParams;
  const events = await all<EventRow>("SELECT * FROM events ORDER BY starts_at DESC");
  const like = `%${q.trim()}%`;
  const { where, params } = buildWhere([
    Number(event) > 0 && ["o.event_id = ?", Number(event)],
    !!status && ["o.status = ?", status],
    !!q.trim() && ["o.ref ILIKE ? OR o.email ILIKE ? OR o.buyer_name ILIKE ? OR o.phone ILIKE ?", like, like, like, like],
  ]);
  const rows = await all<Order & { title: string; tickets: number }>(
    `SELECT o.*, e.title, (SELECT COUNT(*) FROM tickets t WHERE t.order_id = o.id) AS tickets FROM orders o JOIN events e ON e.id = o.event_id ${where} ORDER BY o.id DESC LIMIT 300`,
    ...params,
  );
  const sums = (await get<{ revenue: number; paid: number; pending: number }>(
    `SELECT COALESCE(SUM(CASE WHEN o.status='paid' THEN total END),0) AS revenue, COUNT(CASE WHEN o.status='paid' THEN 1 END) AS paid, COUNT(CASE WHEN o.status='pending' THEN 1 END) AS pending FROM orders o ${where}`,
    ...params,
  ))!;
  const qs = new URLSearchParams({ event, status }).toString();
  return (
    <>
      <PageHeader title="Orders" subtitle="Every ticket purchase, paid or not." actions={<a href={`/api/admin/export/orders?${qs}`} className="btn btn-ghost">⬇ Export CSV</a>} />
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Stat label="Revenue" value={shortUGX(sums.revenue)} hint="UGX" />
        <Stat label="Paid orders" value={sums.paid} />
        <Stat label="Pending" value={sums.pending} hint="awaiting payment" />
      </div>
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Ref, name, email, phone…" className="input max-w-xs" />
        <select name="event" defaultValue={event} className="input max-w-xs">
          <option value="">All events</option>
          {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        <select name="status" defaultValue={status} className="input max-w-[10rem]">
          <option value="">Any status</option>
          {["paid", "pending", "failed", "cancelled", "refunded"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn btn-ghost">Filter</button>
      </form>
      {rows.length === 0 ? (
        <Empty>No orders match.</Empty>
      ) : (
        <Table>
          <thead><tr><th>Ref</th><th>Buyer</th><th>Event</th><th>Tickets</th><th>Total</th><th>Status</th><th>Created</th></tr></thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td><Link className="font-mono text-gold hover:underline" href={`/admin/orders/${o.ref}`}>{o.ref}</Link><div className="text-xs text-white/35">{o.provider}</div></td>
                <td>{o.buyer_name}<div className="text-xs text-white/40">{o.email} · {o.phone}</div></td>
                <td className="text-white/70">{o.title}</td>
                <td>{o.tickets}</td>
                <td>{formatUGX(o.total)}</td>
                <td><Badge s={o.status} /></td>
                <td className="text-white/50">{fmtDateTime(o.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
