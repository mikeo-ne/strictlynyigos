"use client";

import { useActionState, useMemo, useState } from "react";
import { buyTicketsAction, type FormState } from "@/app/actions";

export interface PickerTier {
  id: number;
  name: string;
  description: string;
  price: number;
  admits: number;
  remaining: number;
  max: number;
}

const ugx = (n: number) => "UGX " + n.toLocaleString("en-US");

export function TicketPicker({ eventId, tiers, demo }: { eventId: number; tiers: PickerTier[]; demo: boolean }) {
  const [qty, setQty] = useState<Record<number, number>>({});
  const [state, action, pending] = useActionState<FormState, FormData>(buyTicketsAction, null);
  const total = useMemo(() => tiers.reduce((s, t) => s + (qty[t.id] || 0) * t.price, 0), [qty, tiers]);
  const count = Object.values(qty).reduce((a, b) => a + b, 0);
  const people = tiers.reduce((s, t) => s + (qty[t.id] || 0) * t.admits, 0);
  const set = (id: number, v: number, max: number) => setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(max, v)) }));

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="event_id" value={eventId} />
      <div className="space-y-3">
        {tiers.map((t) => {
          const max = Math.min(t.max, t.remaining);
          const v = qty[t.id] || 0;
          const out = t.remaining === 0;
          return (
            <div key={t.id} className={`flex items-center justify-between gap-4 rounded-2xl border p-4 transition ${v > 0 ? "border-gold bg-gold/5" : "border-white/10 bg-black/30"} ${out ? "opacity-50" : ""}`}>
              <div className="min-w-0">
                <p className="font-bold text-white">{t.name}</p>
                <p className="text-sm text-white/55">
                  {t.description || (t.admits > 1 ? `Admits ${t.admits} people` : "Admits 1 person")}
                </p>
                <p className="mt-1 font-display text-xl text-gold">{ugx(t.price)}</p>
                {!out && t.remaining < 30 && <p className="text-xs font-bold text-gold">Only {t.remaining} left!</p>}
              </div>
              {out ? (
                <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold uppercase text-red-400">Sold out</span>
              ) : (
                <div className="flex shrink-0 items-center gap-2">
                  <button type="button" aria-label={`Remove ${t.name}`} onClick={() => set(t.id, v - 1, max)} disabled={v === 0} className="h-10 w-10 rounded-full border border-white/20 text-xl font-bold disabled:opacity-30">−</button>
                  <input name={`qty_${t.id}`} value={v} readOnly className="w-8 bg-transparent text-center text-lg font-bold tabular-nums" aria-label={`${t.name} quantity`} />
                  <button type="button" aria-label={`Add ${t.name}`} onClick={() => set(t.id, v + 1, max)} disabled={v >= max} className="h-10 w-10 rounded-full bg-gold text-xl font-bold text-black disabled:opacity-30">+</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {count > 0 && (
        <div className="space-y-4 rounded-2xl border border-white/10 bg-black/30 p-5">
          <p className="text-sm font-bold uppercase tracking-widest text-white/50">Your details</p>
          <div>
            <label className="label" htmlFor="name">Full name</label>
            <input id="name" name="name" required autoComplete="name" className="input" placeholder="e.g. Sarah Nakato" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required autoComplete="email" className="input" placeholder="you@email.com" />
            </div>
            <div>
              <label className="label" htmlFor="phone">Mobile Money number</label>
              <input id="phone" name="phone" type="tel" required autoComplete="tel" className="input" placeholder="07XX XXX XXX" />
            </div>
          </div>
          <label className="flex items-start gap-3 text-sm text-white/70">
            <input type="checkbox" name="opt_in" defaultChecked className="mt-0.5 h-4 w-4 accent-[#fed100]" />
            Add me to the Strictly Nyigos mailing list for future dates & early-bird tickets.
          </label>
        </div>
      )}

      <div className="sticky bottom-3 z-10 rounded-2xl border border-white/10 bg-coal/95 p-4 shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">
              {count ? `${count} ticket${count > 1 ? "s" : ""} · ${people} ${people === 1 ? "person" : "people"}` : "Select tickets"}
            </p>
            <p className="font-display text-2xl text-white">{ugx(total)}</p>
          </div>
          <button className="btn btn-gold !px-6 !py-3 uppercase tracking-wider" disabled={!count || pending}>
            {pending ? "Processing…" : "Checkout"}
          </button>
        </div>
        {state?.error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400">{state.error}</p>}
        <p className="mt-2 text-xs text-white/40">
          Pay with MTN MoMo, Airtel Money or card.{demo && " (Demo mode — no real money is charged.)"}
        </p>
      </div>
    </form>
  );
}
