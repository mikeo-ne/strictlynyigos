import Link from "next/link";
import { Badge, PageHeader, Stat, Table } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { nextEvent, ticketTypesWithStock } from "@/lib/events";
import type { Order } from "@/lib/types";
import { fmtDate, fmtDateTime, formatUGX, shortUGX } from "@/lib/util";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const u = await requireUser();
  const { denied } = await searchParams;
  const n = (sql: string, ...p: unknown[]) => (get<{ n: number }>(sql, ...p)?.n ?? 0) as number;
  const weekAgo = new Date(Date.now() - 7 * 86400e3).toISOString();
  const revenue = n("SELECT COALESCE(SUM(total),0) n FROM orders WHERE status='paid'");
  const tickets = n("SELECT COUNT(*) n FROM tickets");
  const subs = n("SELECT COUNT(*) n FROM subscribers WHERE status='subscribed'");
  const subsWeek = n("SELECT COUNT(*) n FROM subscribers WHERE status='subscribed' AND created_at > ?", weekAgo);
  const articles = n("SELECT COUNT(*) n FROM articles WHERE status='published'");
  const drafts = n("SELECT COUNT(*) n FROM articles WHERE status='draft'");
  const ev = nextEvent();
  const tiers = ev ? ticketTypesWithStock(ev.id) : [];
  const evRevenue = ev ? n("SELECT COALESCE(SUM(total),0) n FROM orders WHERE status='paid' AND event_id = ?", ev.id) : 0;
  const evCheckins = ev ? n("SELECT COUNT(*) n FROM tickets WHERE event_id = ? AND checked_in_at IS NOT NULL", ev.id) : 0;
  const evTickets = ev ? n("SELECT COUNT(*) n FROM tickets WHERE event_id = ?", ev.id) : 0;
  const recent = all<Order & { title: string }>("SELECT o.*, e.title FROM orders o JOIN events e ON e.id = o.event_id ORDER BY o.id DESC LIMIT 6");
  // Sales per day, last 14 days (Kampala time = UTC+3)
  const days = all<{ d: string; total: number }>(
    "SELECT date(paid_at, '+3 hours') d, SUM(total) total FROM orders WHERE status='paid' AND paid_at > ? GROUP BY d",
    new Date(Date.now() - 14 * 86400e3).toISOString(),
  );
  const series = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() + 3 * 3600e3 - (13 - i) * 86400e3).toISOString().slice(0, 10);
    return { d, total: days.find((x) => x.d === d)?.total ?? 0 };
  });
  const max = Math.max(1, ...series.map((s) => s.total));

  return (
    <>
      {denied && <div className="mb-6 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400">Your role doesn&apos;t have access to that page.</div>}
      <PageHeader
        title={`Hey ${u.name.split(" ")[0]} 👋`}
        subtitle="Here's how Strictly Nyigos is doing."
        actions={
          u.role !== "door" && (
            <>
              <Link href="/admin/articles/new" className="btn btn-gold">+ New article</Link>
              <Link href="/admin/campaigns/new" className="btn btn-ghost">✉ Email the list</Link>
            </>
          )
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Revenue (all time)" value={shortUGX(revenue)} hint="UGX, paid orders" href={u.role === "admin" ? "/admin/orders" : undefined} />
        <Stat label="Tickets issued" value={tickets.toLocaleString()} />
        <Stat label="Mailing list" value={subs.toLocaleString()} hint={`+${subsWeek} this week`} href={u.role !== "door" ? "/admin/subscribers" : undefined} />
        <Stat label="Articles" value={articles} hint={`${drafts} draft${drafts === 1 ? "" : "s"}`} href={u.role !== "door" ? "/admin/articles" : undefined} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card p-6">
          {ev ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-jam">Next event</p>
                  <h2 className="font-display text-2xl text-white">{ev.title}</h2>
                  <p className="text-sm text-white/55">{fmtDate(ev.starts_at)} · {ev.venue}</p>
                </div>
                {u.role === "admin" && <Link href={`/admin/events/${ev.id}`} className="btn btn-ghost !py-1.5 text-xs">Manage</Link>}
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-black/40 p-3"><p className="font-display text-2xl">{shortUGX(evRevenue)}</p><p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Revenue</p></div>
                <div className="rounded-xl bg-black/40 p-3"><p className="font-display text-2xl">{evTickets}</p><p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Tickets</p></div>
                <div className="rounded-xl bg-black/40 p-3"><p className="font-display text-2xl">{evCheckins}</p><p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Checked in</p></div>
              </div>
              <div className="mt-5 space-y-3">
                {tiers.map((t) => (
                  <div key={t.id}>
                    <div className="flex justify-between text-sm"><span className="font-semibold">{t.name} <span className="text-white/40">· {formatUGX(t.price)}</span></span><span className="text-white/60">{t.sold}/{t.quantity}</span></div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(100, (t.sold / Math.max(1, t.quantity)) * 100)}%` }} /></div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-white/60">No upcoming events. {u.role === "admin" && <Link className="text-gold underline" href="/admin/events/new">Create one</Link>}</p>
          )}
        </div>
        <div className="card p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-white/45">Sales · last 14 days</p>
          <div className="mt-4 flex h-40 items-end gap-1.5">
            {series.map((s) => (
              <div key={s.d} className="group relative flex-1">
                <div className="w-full rounded-t bg-gold/80 transition group-hover:bg-gold" style={{ height: `${Math.max(2, (s.total / max) * 150)}px` }} />
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs group-hover:block">{s.d.slice(5)} · {shortUGX(s.total)}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-white/40"><span>{series[0].d.slice(5)}</span><span>today</span></div>
        </div>
      </div>

      {u.role === "admin" && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-bold text-white">Recent orders</h2><Link href="/admin/orders" className="text-sm text-gold">View all →</Link></div>
          <Table>
            <thead><tr><th>Ref</th><th>Buyer</th><th>Event</th><th>Total</th><th>Status</th><th>When</th></tr></thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id}>
                  <td><Link className="font-mono text-gold" href={`/admin/orders/${o.ref}`}>{o.ref}</Link></td>
                  <td>{o.buyer_name}<div className="text-xs text-white/40">{o.email}</div></td>
                  <td className="text-white/70">{o.title}</td>
                  <td>{formatUGX(o.total)}</td>
                  <td><Badge s={o.status} /></td>
                  <td className="text-white/50">{fmtDateTime(o.created_at)}</td>
                </tr>
              ))}
              {!recent.length && <tr><td colSpan={6} className="text-center text-white/50">No orders yet.</td></tr>}
            </tbody>
          </Table>
        </div>
      )}
    </>
  );
}
