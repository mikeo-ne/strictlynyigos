import { notFound } from "next/navigation";
import { CampaignForm } from "@/components/admin/CampaignForm";
import { SubmitButton } from "@/components/admin/ActionForm";
import { Badge, Flash, PageHeader } from "@/components/admin/ui";
import { deleteCampaignAction } from "@/app/admin/actions";
import { requireUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { emailEnabled } from "@/lib/mail";
import { renderMarkdown } from "@/lib/markdown";
import type { Campaign, EventRow } from "@/lib/types";
import { fmtDateTime } from "@/lib/util";

export const metadata = { title: "Campaign" };

export default async function CampaignPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> }) {
  await requireUser(["admin", "editor"]);
  const c = get<Campaign>("SELECT * FROM campaigns WHERE id = ?", Number((await params).id));
  if (!c) notFound();
  const { msg } = await searchParams;
  if (c.status === "sent") {
    const stats = all<{ status: string; n: number }>("SELECT status, COUNT(*) n FROM email_outbox WHERE campaign_id = ? AND subject NOT LIKE '[TEST]%' GROUP BY status", c.id);
    return (
      <>
        <PageHeader title={c.subject} subtitle={<><Badge s="sent" /> · {fmtDateTime(c.sent_at)} · {c.recipients} recipients</>} />
        <Flash msg={msg} />
        <div className="mb-6 flex gap-3">{stats.map((s) => <div key={s.status} className="card px-4 py-2 text-sm"><Badge s={s.status} /> {s.n}</div>)}</div>
        <div className="card max-w-2xl p-8"><div className="prose-sn" dangerouslySetInnerHTML={{ __html: renderMarkdown(c.body_md) }} /></div>
      </>
    );
  }
  const events = all<EventRow>("SELECT * FROM events WHERE status != 'draft' ORDER BY starts_at DESC");
  const n = get<{ n: number }>("SELECT COUNT(*) n FROM subscribers WHERE status='subscribed'")?.n ?? 0;
  return (
    <>
      <PageHeader title="Edit campaign" subtitle={<Badge s="draft" />} />
      <Flash msg={msg} />
      <CampaignForm c={c} events={events} subscriberCount={n} emailOn={emailEnabled()} />
      <form action={deleteCampaignAction} className="mt-10 border-t border-white/10 pt-6">
        <input type="hidden" name="id" value={c.id} />
        <SubmitButton className="btn btn-danger" confirm="Delete this draft?">Delete draft</SubmitButton>
      </form>
    </>
  );
}
