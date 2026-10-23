"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

export function Countdown({ to }: { to: string }) {
  const target = new Date(to).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const p = parts(now === null ? 0 : target - now);
  if (now !== null && target - now <= 0) return <p className="font-display text-3xl text-gold">It&apos;s going down right now 🔥</p>;
  return (
    <div className="flex gap-3" aria-label="Countdown to event">
      {(
        [
          ["Days", p.d],
          ["Hrs", p.h],
          ["Min", p.m],
          ["Sec", p.s],
        ] as const
      ).map(([l, v]) => (
        <div key={l} className="min-w-16 rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-center backdrop-blur">
          <div className="font-display text-3xl tabular-nums text-white sm:text-4xl" suppressHydrationWarning>
            {now === null ? "--" : String(v).padStart(2, "0")}
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-white/60">{l}</div>
        </div>
      ))}
    </div>
  );
}
