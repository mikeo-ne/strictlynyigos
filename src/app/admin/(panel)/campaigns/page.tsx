import Link from "next/link";
import { Badge, Empty, PageHeader, Table } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import type { Campaign } from "@/lib/types";
import { fmtDateTime } from "@/lib/util";

export const metadata = { title: "Email campaigns" };

export default async function Campaigns() {
  await requireUser(["admin", "editor"]);
  const rows = await all<Campaign>("SELECT * FROM campaigns ORDER BY id DESC");
  return (
    <>
      <PageHeader title="Email campaigns" subtitle="Announce dates, line-ups and early-bird drops to your list." actions={<Link href="/admin/campaigns/new" className="btn btn-gold">+ New campaign</Link>} />
      {rows.length === 0 ? (
        <Empty>No campaigns yet. <Link href="/admin/campaigns/new" className="text-gold underline">Write your first email</Link>.</Empty>
      ) : (
        <Table>
          <thead><tr><th>Subject</th><th>Audience</th><th>Status</th><th>Recipients</th><th>Date</th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td><Link href={`/admin/campaigns/${c.id}`} className="font-semibold text-white hover:text-gold">{c.subject}</Link></td>
                <td className="text-white/60">{c.audience === "subscribers" ? "Mailing list" : "Ticket buyers"}</td>
                <td><Badge s={c.status} /></td>
                <td>{c.status === "sent" ? c.recipients : "—"}</td>
                <td className="text-white/50">{fmtDateTime(c.sent_at || c.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
