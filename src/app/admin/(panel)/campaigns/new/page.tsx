import { CampaignForm } from "@/components/admin/CampaignForm";
import { PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { emailEnabled } from "@/lib/mail";
import type { EventRow } from "@/lib/types";

export const metadata = { title: "New campaign" };

export default async function NewCampaign() {
  await requireUser(["admin", "editor"]);
  const events = all<EventRow>("SELECT * FROM events WHERE status != 'draft' ORDER BY starts_at DESC");
  const n = get<{ n: number }>("SELECT COUNT(*) n FROM subscribers WHERE status='subscribed'")?.n ?? 0;
  return (
    <>
      <PageHeader title="New campaign" />
      <CampaignForm events={events} subscriberCount={n} emailOn={emailEnabled()} />
    </>
  );
}
