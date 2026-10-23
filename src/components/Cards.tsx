import Link from "next/link";
import type { Article, EventRow } from "@/lib/types";
import { fmtDate, fmtTime } from "@/lib/util";

export function EventCard({ e, past = false }: { e: EventRow; past?: boolean }) {
  const d = new Date(e.starts_at);
  const day = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Kampala", day: "2-digit" }).format(d);
  const mon = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Kampala", month: "short" }).format(d);
  return (
    <Link href={`/events/${e.slug}`} className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-coal">
      <div className="relative aspect-[16/10] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={e.cover_image || "/images/hero.jpg"} alt="" className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${past ? "grayscale-[60%]" : ""}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute left-4 top-4 rounded-xl bg-gold px-3 py-1.5 text-center text-black">
          <div className="font-display text-2xl leading-none">{day}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest">{mon}</div>
        </div>
        {e.status === "cancelled" && <span className="absolute right-4 top-4 rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase">Cancelled</span>}
        {past && e.status !== "cancelled" && <span className="absolute right-4 top-4 rounded-full bg-black/70 px-3 py-1 text-xs font-bold uppercase text-white/80">Past edition</span>}
      </div>
      <div className="p-5">
        <h3 className="font-display text-2xl leading-tight text-white transition group-hover:text-gold">{e.title}</h3>
        <p className="mt-1.5 text-sm text-white/60">
          {fmtDate(e.starts_at)} · {fmtTime(e.starts_at)}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-jam">{e.venue || "Venue TBA"}</p>
      </div>
    </Link>
  );
}

export function ArticleCard({ a, large = false }: { a: Article; large?: boolean }) {
  return (
    <Link href={`/news/${a.slug}`} className={`group block overflow-hidden rounded-2xl border border-white/10 bg-coal ${large ? "md:grid md:grid-cols-2" : ""}`}>
      <div className={`relative overflow-hidden ${large ? "aspect-[16/10] md:aspect-auto md:h-full" : "aspect-[16/10]"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.cover_image || "/images/dj.jpg"} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className={large ? "flex flex-col justify-center p-6 md:p-10" : "p-5"}>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
          <span className="text-gold">{a.category}</span>
          <span className="text-white/30">•</span>
          <span className="text-white/50">{fmtDate(a.published_at, { weekday: undefined })}</span>
        </div>
        <h3 className={`mt-2 font-display leading-tight text-white transition group-hover:text-gold ${large ? "text-3xl md:text-4xl" : "text-xl"}`}>{a.title}</h3>
        {a.excerpt && <p className={`mt-2 text-white/60 ${large ? "text-base" : "line-clamp-2 text-sm"}`}>{a.excerpt}</p>}
        {large && <span className="mt-5 text-sm font-bold text-gold">Read story →</span>}
      </div>
    </Link>
  );
}
