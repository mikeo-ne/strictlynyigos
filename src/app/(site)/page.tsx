import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { NewsletterForm } from "@/components/NewsletterForm";
import { ArticleCard, EventCard } from "@/components/Cards";
import { lineupList, nextEvent, pastEvents, ticketTypesWithStock } from "@/lib/events";
import { publishedArticles } from "@/lib/articles";
import { getSettings } from "@/lib/settings";
import { fmtDate, fmtTime, shortUGX } from "@/lib/util";
import { get } from "@/lib/db";

const faqs = [
  ["What does “nyigos” mean?", "Kampala slang for dancing close — real close — with your partner to slow, steady dancehall riddims. It's the whole vibe of the night."],
  ["How do I get my tickets?", "Buy online with MTN Mobile Money, Airtel Money or card. Your QR tickets are emailed instantly and are always available on your order page."],
  ["Can I buy for my squad?", "Yes — squad / group passes admit several people on one QR code, and they're cheaper than singles."],
  ["Is there an age limit?", "Strictly 18+. Carry a valid ID — the door team will check."],
  ["Can I get a refund?", "Tickets are non-refundable unless an event is cancelled or moved, in which case we'll contact you by email."],
];

export default async function Home() {
  const s = await getSettings();
  const ev = await nextEvent();
  const tiers = ev ? await ticketTypesWithStock(ev.id, true) : [];
  const minPrice = tiers.length ? Math.min(...tiers.map((t) => t.price)) : null;
  const articles = await publishedArticles(4);
  const past = (await pastEvents()).slice(0, 3);
  const lineup = ev ? lineupList(ev) : [];
  const fans = (await get<{ n: number }>("SELECT COUNT(*) AS n FROM subscribers WHERE status='subscribed'"))?.n ?? 0;
  const marquee = lineup.length ? lineup : ["Dancehall", "Slow wine", "Nyigos", "Kampala", "The Most Killa Xperience", "Strictly 18+"];

  return (
    <>
      {/* HERO */}
      <section className="grain relative isolate overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ev?.cover_image || "/images/hero.jpg"} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/90 via-ink/40 to-transparent" />
        <div className="mx-auto flex min-h-[86vh] max-w-7xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6">
          <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-jam/40 bg-black/50 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-jam backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-jam" /> {s.tagline}
          </p>
          <h1 className="font-display text-[19vw] leading-[0.85] text-white sm:text-[9rem] lg:text-[11rem]">
            Strictly
            <br />
            <span className="text-gold">Nyigos</span>
          </h1>
          {ev ? (
            <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-white/60">Next up</p>
                <h2 className="mt-1 font-display text-3xl text-white sm:text-4xl">{ev.title}</h2>
                <p className="mt-2 text-lg text-white/80">
                  {fmtDate(ev.starts_at, { weekday: "long" })} · {fmtTime(ev.starts_at)} — <span className="font-semibold text-gold">{ev.venue || "Venue TBA"}</span>
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={`/events/${ev.slug}#tickets`} className="btn btn-gold !px-7 !py-3.5 text-base uppercase tracking-wider">
                    Buy tickets{minPrice !== null && ` · from ${shortUGX(minPrice)}`}
                  </Link>
                  <Link href={`/events/${ev.slug}`} className="btn btn-ghost !px-7 !py-3.5 text-base">Event details</Link>
                </div>
              </div>
              <Countdown to={ev.starts_at} />
            </div>
          ) : (
            <div className="mt-8 max-w-xl">
              <p className="text-lg text-white/80">The next edition is loading… Join the list and be first to know the date, venue and early-bird prices.</p>
              <div className="mt-5"><NewsletterForm source="hero" /></div>
            </div>
          )}
        </div>
      </section>

      {/* MARQUEE */}
      <div className="overflow-hidden border-y border-white/10 bg-gold py-3 text-black">
        <div className="marquee flex w-max gap-10 whitespace-nowrap font-display text-2xl">
          {[...marquee, ...marquee, ...marquee, ...marquee].map((m, i) => (
            <span key={i} className="flex items-center gap-10">{m}<span aria-hidden>✦</span></span>
          ))}
        </div>
      </div>

      {/* TICKETS TEASER */}
      {ev && tiers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-jam">Tickets</p>
              <h2 className="font-display text-5xl text-white">Lock in your spot</h2>
            </div>
            <Link href={`/events/${ev.slug}#tickets`} className="text-sm font-bold text-gold hover:underline">All ticket options →</Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tiers.slice(0, 3).map((t) => (
              <Link key={t.id} href={`/events/${ev.slug}#tickets`} className="card group relative overflow-hidden p-6 transition hover:border-gold/60">
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gold/10 blur-2xl transition group-hover:bg-gold/25" />
                <p className="text-sm font-bold uppercase tracking-widest text-white/60">{t.name}</p>
                <p className="mt-2 font-display text-5xl text-white">
                  {shortUGX(t.price)} <span className="text-lg text-white/50">UGX</span>
                </p>
                <p className="mt-2 text-sm text-white/60">{t.description || (t.admits > 1 ? `Admits ${t.admits} people` : "Admits 1")}</p>
                <p className={`mt-4 text-xs font-bold uppercase tracking-widest ${t.remaining === 0 ? "text-red-400" : t.remaining < 30 ? "text-gold" : "text-jam"}`}>
                  {t.remaining === 0 ? "Sold out" : t.remaining < 30 ? `Only ${t.remaining} left` : "Available"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* NEWS */}
      {articles.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-jam">From the organisers</p>
              <h2 className="font-display text-5xl text-white">News & stories</h2>
            </div>
            <Link href="/news" className="text-sm font-bold text-gold hover:underline">All stories →</Link>
          </div>
          <div className="mt-8 grid gap-6">
            <ArticleCard a={articles[0]} large />
            {articles.length > 1 && (
              <div className="grid gap-6 md:grid-cols-3">
                {articles.slice(1, 4).map((a) => <ArticleCard key={a.id} a={a} />)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ABOUT */}
      <section id="about" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/dj.jpg" alt="DJ on the decks at Strictly Nyigos" className="aspect-[4/3] w-full rounded-3xl object-cover" />
            <div className="absolute -bottom-6 -right-2 rounded-2xl bg-gold px-6 py-4 text-black shadow-2xl sm:-right-6">
              <div className="font-display text-4xl leading-none">{fans > 0 ? fans.toLocaleString() : "18+"}</div>
              <div className="text-xs font-bold uppercase tracking-widest">{fans > 0 ? "on the list" : "strictly"}</div>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-jam">The vibe</p>
            <h2 className="font-display text-5xl leading-none text-white">Come close.<br />Move slow.</h2>
            <p className="mt-6 text-lg leading-relaxed text-white/70">{s.about}</p>
            <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
              <div><dt className="text-xs font-bold uppercase tracking-widest text-white/40">Sound</dt><dd className="mt-1 font-semibold">Dancehall · R&B · Afro</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-widest text-white/40">City</dt><dd className="mt-1 font-semibold">Kampala</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-widest text-white/40">Host</dt><dd className="mt-1 font-semibold">DJ Alza</dd></div>
            </dl>
          </div>
        </div>
      </section>

      {/* PAST */}
      {past.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-4xl text-white">Past editions</h2>
            <Link href="/events#past" className="text-sm font-bold text-gold hover:underline">See all →</Link>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">{past.map((e) => <EventCard key={e.id} e={e} past />)}</div>
        </section>
      )}

      {/* JOIN */}
      <section id="join" className="scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="grain relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-gold/30 bg-gradient-to-br from-jam-dark/40 via-coal to-black p-8 sm:p-14">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
          <p className="text-sm font-bold uppercase tracking-widest text-gold">The mailing list</p>
          <h2 className="mt-2 max-w-2xl font-display text-5xl leading-none text-white sm:text-6xl">Never miss a Nyigos night</h2>
          <p className="mt-4 max-w-xl text-lg text-white/70">Secret venues, line-up drops and early-bird tickets go to the list first. No spam — just the good stuff.</p>
          <div className="relative mt-8 max-w-2xl"><NewsletterForm source="homepage" /></div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h2 className="text-center font-display text-4xl text-white">FAQ</h2>
        <div className="mt-8 divide-y divide-white/10 rounded-2xl border border-white/10 bg-coal">
          {faqs.map(([q, a]) => (
            <details key={q} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white [&::-webkit-details-marker]:hidden">
                {q}
                <span className="text-2xl text-gold transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-white/65">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
