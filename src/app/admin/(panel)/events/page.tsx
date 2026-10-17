import Link from "next/link";
import { Badge, Empty, Flash, PageHeader, Table } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import type { EventRow } from "@/lib/types";
import { fmtDateTime, shortUGX } from "@/lib/util";

export const metadata = { title: "Events" };

export default async function Events({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  await requireUser(["admin"]);
  const { deleted } = await searchParams;
  const rows = await all<EventRow & { sold: number; revenue: number }>(
    `SELECT e.*, (SELECT COUNT(*) FROM tickets t WHERE t.event_id = e.id) AS sold,
       (SELECT COALESCE(SUM(total),0) FROM orders o WHERE o.event_id = e.id AND o.status='paid') AS revenue
     FROM events e ORDER BY starts_at DESC`,
  );
  const now = new Date().toISOString();
  return (
    <>
      <PageHeader title="Events & tickets" subtitle="Create editions, set ticket tiers and track sales." actions={<Link href="/admin/events/new" className="btn btn-gold">+ New event</Link>} />
      <Flash msg={deleted ? "Event deleted." : undefined} />
      {rows.length === 0 ? (
        <Empty>No events yet.</Empty>
      ) : (
        <Table>
          <thead><tr><th>Event</th><th>When</th><th>Status</th><th>Tickets</th><th>Revenue</th></tr></thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id}>
                <td><Link href={`/admin/events/${e.id}`} className="font-semibold text-white hover:text-gold">{e.title}</Link><div className="text-xs text-white/40">{e.venue}</div></td>
                <td className="text-white/60">{fmtDateTime(e.starts_at)}{(e.ends_at || e.starts_at) < now && <span className="ml-2 text-xs text-white/35">(past)</span>}</td>
                <td><Badge s={e.status} /></td>
                <td>{e.sold}</td>
                <td>UGX {shortUGX(e.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
