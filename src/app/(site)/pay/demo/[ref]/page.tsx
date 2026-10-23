import { notFound, redirect } from "next/navigation";
import { demoPayAction } from "@/app/actions";
import { orderByRef, orderItems, orderUrl } from "@/lib/orders";
import { eventById } from "@/lib/events";
import { formatUGX } from "@/lib/util";

export const metadata = { title: "Pay with Mobile Money", robots: { index: false } };

export default async function DemoPay({ params, searchParams }: { params: Promise<{ ref: string }>; searchParams: Promise<{ t?: string }> }) {
  const { ref } = await params;
  const { t } = await searchParams;
  const o = await orderByRef(ref);
  if (!o || o.access_token !== t || o.provider !== "demo") notFound();
  if (o.status !== "pending") redirect(orderUrl(o));
  const ev = (await eventById(o.event_id))!;
  const items = await orderItems(o.id);
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-[#ffcc00] to-[#ffde4d] p-5 text-black">
          <p className="text-xs font-bold uppercase tracking-widest">Demo checkout</p>
          <p className="font-display text-2xl">Mobile Money</p>
        </div>
        <div className="space-y-4 p-6">
          <p className="rounded-lg border border-gold/30 bg-gold/10 p-3 text-sm text-gold">
            This is a simulated payment so you can test the full flow. Set <code>PAYMENTS_PROVIDER=flutterwave</code> to take real MTN MoMo / Airtel Money payments.
          </p>
          <div>
            <p className="text-sm text-white/50">Paying for</p>
            <p className="font-bold text-white">{ev.title}</p>
            <ul className="mt-2 space-y-1 text-sm text-white/70">
              {items.map((i) => (
                <li key={i.ticket_type_id} className="flex justify-between"><span>{i.qty} × {i.name}</span><span>{formatUGX(i.qty * i.unit_price)}</span></li>
              ))}
            </ul>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-3 text-lg font-bold"><span>Total</span><span className="text-gold">{formatUGX(o.total)}</span></div>
          <p className="text-sm text-white/60">A payment prompt would now be sent to <b className="text-white">{o.phone}</b>. Approve it with your PIN.</p>
          <form action={demoPayAction} className="grid grid-cols-2 gap-3">
            <input type="hidden" name="ref" value={o.ref} />
            <input type="hidden" name="t" value={o.access_token} />
            <button name="decision" value="decline" className="btn btn-ghost">Decline</button>
            <button name="decision" value="approve" className="btn btn-gold">Approve payment</button>
          </form>
          <p className="text-center text-xs text-white/40">Order {o.ref}</p>
        </div>
      </div>
    </div>
  );
}
