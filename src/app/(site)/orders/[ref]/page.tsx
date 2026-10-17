import Link from "next/link";
import { notFound } from "next/navigation";
import { QR } from "@/components/QR";
import { orderByRef, orderItems, orderTickets } from "@/lib/orders";
import { eventById } from "@/lib/events";
import { fmtDate, fmtTime, formatUGX } from "@/lib/util";
import { PrintButton } from "@/components/PrintButton";

export const metadata = { title: "Your tickets", robots: { index: false } };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ ref: string }>; searchParams: Promise<{ t?: string }> }) {
  const { ref } = await params;
  const { t } = await searchParams;
  const o = await orderByRef(ref);
  if (!o || o.access_token !== t) notFound();
  const ev = (await eventById(o.event_id))!;
  const items = await orderItems(o.id);
  const tickets = await orderTickets(o.id);

  if (o.status !== "paid") {
    const failed = o.status === "failed" || o.status === "cancelled";
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${failed ? "bg-red-500/15" : "bg-gold/15"}`}>{failed ? "✕" : "⏳"}</div>
        <h1 className="mt-6 font-display text-4xl text-white">{failed ? "Payment not completed" : "Waiting for payment"}</h1>
        <p className="mt-3 text-white/60">
          {failed
            ? "Your payment was cancelled or declined, so no tickets were issued. You can try again — nothing was charged."
            : "We haven't received confirmation yet. If you approved the prompt, refresh in a moment — your tickets will also be emailed to you."}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href={`/events/${ev.slug}#tickets`} className="btn btn-gold">{failed ? "Try again" : "Back to event"}</Link>
          {!failed && <Link href={`/orders/${o.ref}?t=${o.access_token}`} className="btn btn-ghost">Refresh</Link>}
        </div>
        <p className="mt-6 text-xs text-white/40">Order {o.ref}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <div className="text-center print:hidden">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-jam/15 text-3xl">✓</div>
        <h1 className="mt-5 font-display text-5xl text-white">You&apos;re in, {o.buyer_name.split(" ")[0]}!</h1>
        <p className="mt-2 text-white/60">We&apos;ve emailed your tickets to <b className="text-white">{o.email}</b>. Show the QR codes at the gate.</p>
        <div className="mt-5 flex justify-center gap-3">
          <PrintButton />
          <Link href={`/events/${ev.slug}`} className="btn btn-ghost">Event details</Link>
        </div>
      </div>

      <div className="mt-10 space-y-5">
        {tickets.map((tk, i) => (
          <div key={tk.id} className="relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-coal sm:flex-row print:break-inside-avoid print:border-black print:bg-white print:text-black">
            <div className="stripe absolute inset-x-0 top-0 h-1.5" />
            <div className="flex-1 p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-jam">Strictly Nyigos · Ticket {i + 1}/{tickets.length}</p>
              <h2 className="mt-2 font-display text-3xl text-white print:text-black">{ev.title}</h2>
              <p className="mt-1 font-semibold text-gold print:text-black">{fmtDate(ev.starts_at, { weekday: "long" })} · {fmtTime(ev.starts_at)}</p>
              <p className="text-white/60 print:text-black">{ev.venue}</p>
              <div className="mt-5 flex flex-wrap gap-6 text-sm">
                <div><p className="text-xs uppercase tracking-widest text-white/40">Type</p><p className="font-bold">{tk.name}</p></div>
                <div><p className="text-xs uppercase tracking-widest text-white/40">Admits</p><p className="font-bold">{tk.admits}</p></div>
                <div><p className="text-xs uppercase tracking-widest text-white/40">Name</p><p className="font-bold">{o.buyer_name}</p></div>
                <div><p className="text-xs uppercase tracking-widest text-white/40">Order</p><p className="font-bold">{o.ref}</p></div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 border-t border-dashed border-white/15 p-6 sm:border-l sm:border-t-0">
              <QR value={tk.code} size={170} />
              <p className="font-mono text-lg font-bold tracking-[0.2em]">{tk.code}</p>
              {tk.checked_in_at && <p className="rounded-full bg-white/10 px-3 py-0.5 text-xs font-bold uppercase">Used</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="card mt-8 p-6 print:hidden">
        <h3 className="font-bold text-white">Order summary</h3>
        <ul className="mt-3 space-y-1 text-sm text-white/70">
          {items.map((i) => (
            <li key={i.ticket_type_id} className="flex justify-between"><span>{i.qty} × {i.name}</span><span>{formatUGX(i.qty * i.unit_price)}</span></li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-white/10 pt-3 font-bold"><span>Total paid</span><span>{formatUGX(o.total)}</span></div>
        <p className="mt-3 text-xs text-white/40">Bookmark this page — it&apos;s your ticket wallet. Lost it? Use <Link href="/orders/find" className="underline">Find my tickets</Link>.</p>
      </div>
    </div>
  );
}
