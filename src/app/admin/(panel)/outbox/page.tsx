import Link from "next/link";
import { Badge, Empty, PageHeader, Table } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { emailEnabled } from "@/lib/mail";
import { fmtDateTime } from "@/lib/util";

export const metadata = { title: "Email outbox" };

type Mail = { id: number; to_email: string; subject: string; html: string; kind: string; status: string; error: string | null; created_at: string };

export default async function Outbox({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  await requireUser(["admin", "editor"]);
  const { view } = await searchParams;
  const rows = all<Mail>("SELECT id, to_email, subject, kind, status, error, created_at FROM email_outbox ORDER BY id DESC LIMIT 200");
  const m = view ? get<Mail>("SELECT * FROM email_outbox WHERE id = ?", Number(view)) : undefined;
  return (
    <>
      <PageHeader
        title="Email outbox"
        subtitle={emailEnabled() ? "Every email the site has sent." : "SMTP isn't configured, so emails are logged here instead of delivered. Add SMTP settings to start sending."}
      />
      {m && (
        <div className="card mb-6 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 p-4 text-sm">
            <div><b>{m.subject}</b><div className="text-white/50">To {m.to_email} · {fmtDateTime(m.created_at)}</div></div>
            <Link href="/admin/outbox" className="btn btn-ghost !py-1 text-xs">Close</Link>
          </div>
          <iframe title="Email preview" sandbox="" srcDoc={m.html} className="h-[640px] w-full bg-[#0b0b0b]" />
        </div>
      )}
      {rows.length === 0 ? (
        <Empty>No emails yet.</Empty>
      ) : (
        <Table>
          <thead><tr><th>To</th><th>Subject</th><th>Type</th><th>Status</th><th>When</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.to_email}</td>
                <td><Link href={`/admin/outbox?view=${r.id}`} className="text-white hover:text-gold">{r.subject}</Link>{r.error && <div className="text-xs text-red-400">{r.error}</div>}</td>
                <td className="text-white/50">{r.kind}</td>
                <td><Badge s={r.status} /></td>
                <td className="text-white/50">{fmtDateTime(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
