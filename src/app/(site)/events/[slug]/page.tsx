import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TicketPicker } from "@/components/TicketPicker";
import { ArticleCard } from "@/components/Cards";
import { NewsletterForm } from "@/components/NewsletterForm";
import { eventBySlug, isPast, lineupList, ticketTypesWithStock } from "@/lib/events";
import { renderMarkdown } from "@/lib/markdown";
import { paymentProvider } from "@/lib/payments";
import { all } from "@/lib/db";
import type { Article } from "@/lib/types";
import { fmtDate, fmtTime, siteUrl } from "@/lib/util";
import { currentUser } from "@/lib/auth";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = eventBySlug((await params).slug);
  if (!e) return {};
  return { title: e.title, description: e.tagline || `${fmtDate(e.starts_at)} at ${e.venue}`, openGraph: { images: [e.cover_image || "/images/hero.jpg"] } };
}

export default async function EventPage({ params }: Props) {
  const e = eventBySlug((await params).slug);
  if (!e) notFound();
  if (e.status === "draft" && !(await currentUser())) notFound();
  const past = isPast(e);
  const tiers = ticketTypesWithStock(e.id, true);
  const lineup = lineupList(e);
  const related = all<Article>(
    "SELECT * FROM articles WHERE event_id = ? AND status='published' AND published_at <= ? ORDER BY published_at DESC LIMIT 3",
    e.id,
    new Date().toISOString(),
  );
  const onSale = !past && e.status === "published" && tiers.length > 0;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    startDate: e.starts_at,
    endDate: e.ends_at || undefined,
    eventStatus: e.status === "cancelled" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: e.venue, address: e.address || "Kampala, Uganda" },
    image: [siteUrl() + (e.cover_image || "/images/hero.jpg")],
    description: e.tagline,
    offers: tiers.map((t) => ({ "@type": "Offer", name: t.name, price: t.price, priceCurrency: "UGX", availability: t.remaining ? "https://schema.org/InStock" : "https://schema.org/SoldOut", url: `${siteUrl()}/events/${e.slug}` })),
    performer: lineup.map((n) => ({ "@type": "Person", name: n })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <section className="grain relative isolate overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={e.cover_image || "/images/hero.jpg"} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/75 to-ink/30" />
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-32 sm:px-6">
          <Link href="/events" className="text-sm font-semibold text-white/60 hover:text-gold">← All events</Link>
          {e.status === "draft" && <p className="mt-3 w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase">Draft preview</p>}
          {e.status === "cancelled" && <p className="mt-3 w-fit rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase">Cancelled</p>}
          <h1 className="mt-4 max-w-4xl font-display text-5xl leading-[0.95] text-white sm:text-7xl">{e.title}</h1>
          {e.tagline && <p className="mt-3 max-w-2xl text-xl text-white/80">{e.tagline}</p>}
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold">
            <span className="rounded-full bg-gold px-4 py-2 text-black">📅 {fmtDate(e.starts_at, { weekday: "long" })}</span>
            <span className="rounded-full border border-white/20 bg-black/40 px-4 py-2">⏰ {fmtTime(e.starts_at)}{e.ends_at && ` – ${fmtTime(e.ends_at)}`}</span>
            <span className="rounded-full border border-white/20 bg-black/40 px-4 py-2">📍 {e.venue || "Venue TBA"}</span>
            {e.age_limit > 0 && <span className="rounded-full border border-white/20 bg-black/40 px-4 py-2">🔞 {e.age_limit}+ only</span>}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_440px]">
        <div className="min-w-0">
          {lineup.length > 0 && (
            <div className="mb-12">
              <h2 className="font-display text-3xl text-gold">Line-up</h2>
              <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                {lineup.map((n, i) => (
                  <li key={n} className={`font-display ${i === 0 ? "text-4xl text-white" : "text-2xl text-white/80"}`}>{n}</li>
                ))}
              </ul>
            </div>
          )}
          <h2 className="font-display text-3xl text-white">About this event</h2>
          <div className="prose-sn mt-4" dangerouslySetInnerHTML={{ __html: renderMarkdown(e.description_md) }} />

          {(e.address || e.map_url) && (
            <div className="card mt-10 flex flex-wrap items-center justify-between gap-4 p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">Venue</p>
                <p className="text-lg font-bold text-white">{e.venue}</p>
                <p className="text-white/60">{e.address}</p>
              </div>
              {e.map_url && <a href={e.map_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">Get directions ↗</a>}
            </div>
          )}

          {related.length > 0 && (
            <div className="mt-14">
              <h2 className="font-display text-3xl text-white">Related stories</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">{related.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
            </div>
          )}
        </div>

        <aside id="tickets" className="scroll-mt-24">
          <div className="lg:sticky lg:top-24">
            <h2 className="font-display text-3xl text-white">{onSale ? "Tickets" : past ? "This edition has passed" : "Tickets"}</h2>
            <div className="mt-4">
              {onSale ? (
                <TicketPicker
                  eventId={e.id}
                  demo={paymentProvider() === "demo"}
                  tiers={tiers.map((t) => ({ id: t.id, name: t.name, description: t.description, price: t.price, admits: t.admits, remaining: t.remaining, max: t.max_per_order }))}
                />
              ) : (
                <div className="card p-6">
                  <p className="text-white/70">
                    {past ? "Missed it? Join the list so you're first in line next time." : e.status === "cancelled" ? "This event has been cancelled." : "Tickets aren't on sale yet. Join the list to get early-bird access."}
                  </p>
                  <div className="mt-4"><NewsletterForm source={`event:${e.slug}`} compact /></div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
