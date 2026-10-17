import { CampaignForm } from "@/components/admin/CampaignForm";
import { PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { emailEnabled } from "@/lib/mail";
import type { EventRow } from "@/lib/types";

// Sending a campaign runs inside this page's server action; allow up to 5 minutes on Vercel.
export const maxDuration = 300;

export const metadata = { title: "New campaign" };

export default async function NewCampaign() {
  await requireUser(["admin", "editor"]);
  const events = await all<EventRow>("SELECT * FROM events WHERE status != 'draft' ORDER BY starts_at DESC");
  const n = (await get<{ n: number }>("SELECT COUNT(*) AS n FROM subscribers WHERE status='subscribed'"))?.n ?? 0;
  return (
    <>
      <PageHeader title="New campaign" />
      <CampaignForm events={events} subscriberCount={n} emailOn={emailEnabled()} />
    </>
  );
}
