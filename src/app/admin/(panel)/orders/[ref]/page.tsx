import Link from "next/link";
import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/admin/ActionForm";
import { Badge, Flash, PageHeader, Table } from "@/components/admin/ui";
import { markPaidAction, resendOrderAction, setOrderStatusAction } from "@/app/admin/actions";
import { requireUser } from "@/lib/auth";
import { eventById } from "@/lib/events";
import { orderByRef, orderItems, orderTickets, orderUrl } from "@/lib/orders";
import { fmtDateTime, formatUGX } from "@/lib/util";

export const metadata = { title: "Order" };

export default async function OrderDetail({ params, searchParams }: { params: Promise<{ ref: string }>; searchParams: Promise<{ msg?: string }> }) {
  await requireUser(["admin"]);
  const o = orderByRef((await params).ref);
  if (!o) notFound();
  const { msg } = await searchParams;
  const ev = eventById(o.event_id)!;
  const items = orderItems(o.id);
  const tickets = orderTickets(o.id);
  const Hidden = () => <input type="hidden" name="ref" value={o.ref} />;
  return (
    <>
      <PageHeader title={`Order ${o.ref}`} subtitle={<><Badge s={o.status} /> · {ev.title}</>} actions={<Link href="/admin/orders" className="btn btn-ghost">← Orders</Link>} />
      <Flash msg={msg} />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="font-bold text-white">Items</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {items.map((i) => <li key={i.ticket_type_id} className="flex justify-between"><span>{i.qty} × {i.name} {i.admits > 1 && <span className="text-white/40">(admits {i.admits})</span>}</span><span>{formatUGX(i.qty * i.unit_price)}</span></li>)}
            </ul>
            <div className="mt-3 flex justify-between border-t border-white/10 pt-3 font-bold"><span>Total</span><span>{formatUGX(o.total)}</span></div>
          </div>
          <div>
            <h2 className="mb-3 font-bold text-white">Tickets</h2>
            {tickets.length ? (
              <Table>
                <thead><tr><th>Code</th><th>Type</th><th>Admits</th><th>Check-in</th></tr></thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id}><td className="font-mono">{t.code}</td><td>{t.name}</td><td>{t.admits}</td><td>{t.checked_in_at ? <span className="text-jam">✓ {fmtDateTime(t.checked_in_at)}</span> : <span className="text-white/40">Not yet</span>}</td></tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <p className="text-sm text-white/50">No tickets issued — tickets are created when payment is confirmed.</p>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div className="card space-y-2 p-5 text-sm">
            <p><span className="text-white/45">Buyer:</span> <b>{o.buyer_name}</b></p>
            <p><span className="text-white/45">Email:</span> <a className="text-gold" href={`mailto:${o.email}`}>{o.email}</a></p>
            <p><span className="text-white/45">Phone:</span> {o.phone || "—"}</p>
            <p><span className="text-white/45">Payment:</span> {o.provider}{o.provider_ref && <span className="block break-all font-mono text-xs text-white/50">{o.provider_ref}</span>}</p>
            <p><span className="text-white/45">Created:</span> {fmtDateTime(o.created_at)}</p>
            {o.paid_at && <p><span className="text-white/45">Paid:</span> {fmtDateTime(o.paid_at)}</p>}
            <p><span className="text-white/45">Mailing list opt-in:</span> {o.marketing_opt_in ? "Yes" : "No"}</p>
          </div>
          <div className="card space-y-2 p-5">
            {o.status === "paid" && (
              <>
                <a href={orderUrl(o)} target="_blank" className="btn btn-ghost w-full">Open buyer&apos;s ticket page ↗</a>
                <form action={resendOrderAction}><Hidden /><SubmitButton className="btn btn-ghost w-full">Re-send ticket email</SubmitButton></form>
                <form action={setOrderStatusAction}><Hidden /><input type="hidden" name="status" value="refunded" /><SubmitButton className="btn btn-danger w-full" confirm="Mark as refunded? Tickets will stop working. (Refund the money in your payment dashboard.)">Mark refunded</SubmitButton></form>
              </>
            )}
            {(o.status === "pending" || o.status === "failed" || o.status === "cancelled") && (
              <form action={markPaidAction}><Hidden /><SubmitButton confirm="Confirm you received this payment (e.g. cash or direct MoMo)? Tickets will be issued and emailed." className="btn btn-gold w-full">Mark as paid (cash / manual)</SubmitButton></form>
            )}
            {o.status === "pending" && (
              <form action={setOrderStatusAction}><Hidden /><input type="hidden" name="status" value="cancelled" /><SubmitButton className="btn btn-danger w-full">Cancel order</SubmitButton></form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
