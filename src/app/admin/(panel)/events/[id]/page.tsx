import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { EventForm } from "@/components/admin/EventForm";
import { Badge, Flash, PageHeader } from "@/components/admin/ui";
import { compTicketsAction, deleteEventAction, deleteTicketTypeAction, saveTicketTypeAction } from "@/app/admin/actions";
import { requireUser } from "@/lib/auth";
import { get } from "@/lib/db";
import { eventById, ticketTypesWithStock } from "@/lib/events";
import { formatUGX } from "@/lib/util";

export const metadata = { title: "Edit event" };

function TierFields({ t }: { t?: { name: string; description: string; price: number; admits: number; quantity: number; max_per_order: number; sort: number } }) {
  return (
    <div className="grid gap-3 sm:grid-cols-6">
      <div className="sm:col-span-2"><label className="label">Name</label><input name="name" required defaultValue={t?.name} placeholder="Early Bird Single" className="input" /></div>
      <div className="sm:col-span-4"><label className="label">Description</label><input name="description" defaultValue={t?.description} placeholder="Admits 1 · limited early-bird batch" className="input" /></div>
      <div><label className="label">Price (UGX)</label><input name="price" type="number" min={0} step={500} required defaultValue={t?.price} className="input" /></div>
      <div><label className="label">Admits</label><input name="admits" type="number" min={1} defaultValue={t?.admits ?? 1} className="input" /></div>
      <div><label className="label">Quantity</label><input name="quantity" type="number" min={0} required defaultValue={t?.quantity} className="input" /></div>
      <div><label className="label">Max / order</label><input name="max_per_order" type="number" min={1} defaultValue={t?.max_per_order ?? 10} className="input" /></div>
      <div><label className="label">Sort</label><input name="sort" type="number" defaultValue={t?.sort ?? 0} className="input" /></div>
    </div>
  );
}

export default async function EditEvent({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireUser(["admin"]);
  const e = eventById(Number((await params).id));
  if (!e) notFound();
  const { saved, error } = await searchParams;
  const tiers = ticketTypesWithStock(e.id);
  const checkins = get<{ n: number }>("SELECT COUNT(*) n FROM tickets WHERE event_id = ? AND checked_in_at IS NOT NULL", e.id)?.n ?? 0;
  const issued = get<{ n: number }>("SELECT COUNT(*) n FROM tickets WHERE event_id = ?", e.id)?.n ?? 0;
  const msg = saved === "hidden" ? "That ticket type has sales, so it was hidden instead of deleted." : saved ? "Saved." : undefined;

  return (
    <>
      <PageHeader
        title={e.title}
        subtitle={<><Badge s={e.status} /> · {issued} tickets issued · {checkins} checked in</>}
        actions={
          <>
            <Link href={`/events/${e.slug}`} target="_blank" className="btn btn-ghost">View page ↗</Link>
            <Link href={`/admin/orders?event=${e.id}`} className="btn btn-ghost">Orders</Link>
            <Link href={`/admin/checkin?event=${e.id}`} className="btn btn-ghost">Door check-in</Link>
          </>
        }
      />
      <Flash msg={msg} error={error} />

      <section id="tickets" className="mb-12 scroll-mt-8">
        <h2 className="font-display text-2xl text-white">Ticket types</h2>
        <p className="mb-4 text-sm text-white/50">Use “Admits” for group passes — e.g. a Squad of 3 is one QR code that lets 3 people in.</p>
        <div className="space-y-3">
          {tiers.map((t) => (
            <details key={t.id} className="card group">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
                <div>
                  <span className="font-bold text-white">{t.name}</span> {!t.active && <Badge s="draft" label="hidden" />}
                  <div className="text-sm text-white/50">{formatUGX(t.price)} · admits {t.admits}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-40">
                    <div className="flex justify-between text-xs text-white/60"><span>{t.sold} sold/held</span><span>{t.remaining} left</span></div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-gold" style={{ width: `${Math.min(100, (t.sold / Math.max(1, t.quantity)) * 100)}%` }} /></div>
                  </div>
                  <span className="text-xs font-bold text-gold group-open:hidden">Edit</span>
                </div>
              </summary>
              <div className="border-t border-white/10 p-4">
                <form action={saveTicketTypeAction} className="space-y-3">
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="event_id" value={e.id} />
                  <TierFields t={t} />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={!!t.active} className="h-4 w-4 accent-[#fed100]" /> On sale (visible)</label>
                    <SubmitButton>Save ticket type</SubmitButton>
                  </div>
                </form>
                <form action={deleteTicketTypeAction} className="mt-3 text-right">
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="event_id" value={e.id} />
                  <SubmitButton className="text-xs text-red-400 hover:underline" confirm="Remove this ticket type?">Remove</SubmitButton>
                </form>
              </div>
            </details>
          ))}
        </div>
        <details className="card mt-3" open={tiers.length === 0}>
          <summary className="cursor-pointer list-none p-4 font-bold text-gold [&::-webkit-details-marker]:hidden">+ Add ticket type</summary>
          <form action={saveTicketTypeAction} className="space-y-3 border-t border-white/10 p-4">
            <input type="hidden" name="event_id" value={e.id} />
            <TierFields />
            <div className="text-right"><SubmitButton>Add ticket type</SubmitButton></div>
          </form>
        </details>
      </section>

      {tiers.length > 0 && (
        <section className="mb-12">
          <h2 className="font-display text-2xl text-white">Guest list / comp tickets</h2>
          <p className="mb-4 text-sm text-white/50">Issue free tickets to artists, press or VIPs. They get the same QR tickets by email.</p>
          <ActionForm action={compTicketsAction} className="card grid gap-3 p-4 sm:grid-cols-6">
            <input type="hidden" name="event_id" value={e.id} />
            <div className="sm:col-span-2"><label className="label">Guest name</label><input name="name" required className="input" /></div>
            <div className="sm:col-span-2"><label className="label">Email</label><input name="email" type="email" required className="input" /></div>
            <div><label className="label">Type</label><select name="ticket_type_id" className="input">{tiers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
            <div><label className="label">Qty</label><input name="qty" type="number" min={1} max={20} defaultValue={1} className="input" /></div>
            <div className="sm:col-span-6 text-right"><SubmitButton>Issue comp tickets</SubmitButton></div>
          </ActionForm>
        </section>
      )}

      <h2 className="mb-4 font-display text-2xl text-white">Event details</h2>
      <EventForm e={e} />

      <form action={deleteEventAction} className="mt-10 border-t border-white/10 pt-6">
        <input type="hidden" name="id" value={e.id} />
        <SubmitButton className="btn btn-danger" confirm="Delete this event permanently?">Delete event</SubmitButton>
      </form>
    </>
  );
}
