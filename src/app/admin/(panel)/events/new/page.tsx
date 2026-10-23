import { EventForm } from "@/components/admin/EventForm";
import { PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "New event" };

export default async function NewEvent() {
  await requireUser(["admin"]);
  return (
    <>
      <PageHeader title="New event" subtitle="You can add ticket types after creating the event." />
      <EventForm />
    </>
  );
}
