import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { Badge, PageHeader, Stat, Table } from "@/components/admin/ui";
import { addSubscribersAction, subscriberStatusAction } from "@/app/admin/actions";
import { requireUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import type { Subscriber } from "@/lib/types";
import { fmtDate } from "@/lib/util";

export const metadata = { title: "Mailing list" };

export default async function Subscribers({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  await requireUser(["admin", "editor"]);
  const { q = "", status = "subscribed", page = "1" } = await searchParams;
  const p = Math.max(1, Number(page) || 1);
  const per = 50;
  const where = "(? = 'all' OR status = ?) AND (? = '' OR email LIKE ? OR name LIKE ?)";
  const args = [status, status, q, `%${q}%`, `%${q}%`];
  const total = get<{ n: number }>(`SELECT COUNT(*) n FROM subscribers WHERE ${where}`, ...args)?.n ?? 0;
  const rows = all<Subscriber>(`SELECT * FROM subscribers WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`, ...args, per, (p - 1) * per);
  const n = (sql: string, ...a: unknown[]) => get<{ n: number }>(sql, ...a)?.n ?? 0;
  const active = n("SELECT COUNT(*) n FROM subscribers WHERE status='subscribed'");
  const month = n("SELECT COUNT(*) n FROM subscribers WHERE status='subscribed' AND created_at > ?", new Date(Date.now() - 30 * 86400e3).toISOString());
  const unsub = n("SELECT COUNT(*) n FROM subscribers WHERE status='unsubscribed'");
  const sources = all<{ source: string; n: number }>("SELECT source, COUNT(*) n FROM subscribers WHERE status='subscribed' GROUP BY source ORDER BY n DESC LIMIT 5");
  const pages = Math.ceil(total / per);
  const link = (pg: number) => `?${new URLSearchParams({ q, status, page: String(pg) })}`;

  return (
    <>
      <PageHeader
        title="Mailing list"
        subtitle="Fans who signed up on the site or opted in at checkout."
        actions={
          <>
            <a href={`/api/admin/export/subscribers?status=${status}`} className="btn btn-ghost">⬇ Export CSV</a>
            <Link href="/admin/campaigns/new" className="btn btn-gold">✉ Email the list</Link>
          </>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Subscribed" value={active.toLocaleString()} />
        <Stat label="New (30 days)" value={`+${month}`} />
        <Stat label="Unsubscribed" value={unsub} />
        <div className="card p-5 text-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-white/45">Top sources</p>
          <ul className="mt-2 space-y-0.5">{sources.map((s) => <li key={s.source} className="flex justify-between"><span className="truncate text-white/70">{s.source}</span><span>{s.n}</span></li>)}</ul>
        </div>
      </div>

      <details className="card mb-6">
        <summary className="cursor-pointer list-none p-4 font-bold text-gold [&::-webkit-details-marker]:hidden">+ Add or import subscribers</summary>
        <ActionForm action={addSubscribersAction} className="space-y-3 border-t border-white/10 p-4" resetOnSuccess>
          <label className="label" htmlFor="emails">One per line — “email”, “email, Name” or “Name &lt;email&gt;”. You can paste a column from Excel / Google Sheets.</label>
          <textarea id="emails" name="emails" rows={5} required className="input font-mono text-sm" placeholder={"sarah@example.com, Sarah\nJohn Mukasa <john@example.com>"} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" name="welcome" className="h-4 w-4 accent-[#fed100]" /> Send welcome email</label>
              <input name="source" placeholder="Source (e.g. door sign-up)" className="input !w-56 !py-1.5" />
            </div>
            <SubmitButton>Add subscribers</SubmitButton>
          </div>
          <p className="text-xs text-white/40">Only add people who agreed to hear from you.</p>
        </ActionForm>
      </details>

      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Search email or name…" className="input max-w-xs" />
        <select name="status" defaultValue={status} className="input max-w-[11rem]">
          <option value="subscribed">Subscribed</option>
          <option value="unsubscribed">Unsubscribed</option>
          <option value="all">All</option>
        </select>
        <button className="btn btn-ghost">Filter</button>
      </form>
      <Table>
        <thead><tr><th>Email</th><th>Name</th><th>Source</th><th>Status</th><th>Joined</th><th></th></tr></thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id}>
              <td className="font-medium">{s.email}</td>
              <td className="text-white/70">{s.name || "—"}</td>
              <td className="text-white/50">{s.source}</td>
              <td><Badge s={s.status} /></td>
              <td className="text-white/50">{fmtDate(s.created_at, { weekday: undefined })}</td>
              <td className="text-right">
                <form action={subscriberStatusAction} className="inline-flex gap-3 text-xs">
                  <input type="hidden" name="id" value={s.id} />
                  {s.status === "subscribed" ? (
                    <SubmitButton name="op" value="unsubscribe" className="text-white/50 hover:text-white">Unsubscribe</SubmitButton>
                  ) : (
                    <SubmitButton name="op" value="resubscribe" className="text-white/50 hover:text-white">Resubscribe</SubmitButton>
                  )}
                  <SubmitButton name="op" value="delete" className="text-red-400 hover:underline" confirm={`Delete ${s.email} permanently?`}>Delete</SubmitButton>
                </form>
              </td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={6} className="text-center text-white/50">No subscribers found.</td></tr>}
        </tbody>
      </Table>
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-white/60">
          <span>{total.toLocaleString()} total · page {p} of {pages}</span>
          <div className="flex gap-2">
            {p > 1 && <Link className="btn btn-ghost !py-1" href={link(p - 1)}>← Prev</Link>}
            {p < pages && <Link className="btn btn-ghost !py-1" href={link(p + 1)}>Next →</Link>}
          </div>
        </div>
      )}
    </>
  );
}
