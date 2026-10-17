import { CheckInScanner } from "@/components/admin/CheckInScanner";
import { PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { upcomingEvents } from "@/lib/events";
import type { EventRow } from "@/lib/types";

export const metadata = { title: "Door check-in" };

export default async function CheckIn({ searchParams }: { searchParams: Promise<{ event?: string }> }) {
  await requireUser(["admin", "door"]);
  const { event } = await searchParams;
  const events = all<EventRow & { issued: number; checked: number; people: number; people_in: number }>(
    `SELECT e.*, COUNT(t.id) issued, COUNT(t.checked_in_at) checked,
       COALESCE(SUM(tt.admits),0) people, COALESCE(SUM(CASE WHEN t.checked_in_at IS NOT NULL THEN tt.admits END),0) people_in
     FROM events e LEFT JOIN tickets t ON t.event_id = e.id LEFT JOIN ticket_types tt ON tt.id = t.ticket_type_id
     WHERE e.status != 'draft' GROUP BY e.id ORDER BY e.starts_at DESC LIMIT 20`,
  );
  const defaultId = Number(event) || upcomingEvents()[0]?.id || events[0]?.id || null;
  return (
    <>
      <PageHeader title="Door check-in" subtitle="Scan QR codes or type ticket codes. Each ticket only works once." />
      <CheckInScanner
        events={events.map((e) => ({ id: e.id, title: e.title, issued: e.issued, checked: e.checked, people: e.people, peopleIn: e.people_in }))}
        defaultEventId={defaultId}
      />
    </>
  );
}
