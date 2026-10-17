import type { Metadata } from "next";
import { EventCard } from "@/components/Cards";
import { NewsletterForm } from "@/components/NewsletterForm";
import { pastEvents, upcomingEvents } from "@/lib/events";

export const metadata: Metadata = { title: "Events" };

export default async function EventsPage() {
  const up = await upcomingEvents();
  const past = await pastEvents();
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <p className="text-sm font-bold uppercase tracking-widest text-jam">Dates & tickets</p>
      <h1 className="font-display text-6xl text-white sm:text-7xl">Events</h1>

      <h2 className="mt-12 font-display text-3xl text-gold">Upcoming</h2>
      {up.length ? (
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{up.map((e) => <EventCard key={e.id} e={e} />)}</div>
      ) : (
        <div className="card mt-6 max-w-2xl p-8">
          <p className="text-lg font-semibold text-white">No dates announced yet.</p>
          <p className="mt-1 text-white/60">Join the mailing list and we&apos;ll tell you the moment the next edition drops.</p>
          <div className="mt-5"><NewsletterForm source="events-page" /></div>
        </div>
      )}

      {past.length > 0 && (
        <>
          <h2 id="past" className="mt-20 scroll-mt-24 font-display text-3xl text-white/80">Past editions</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{past.map((e) => <EventCard key={e.id} e={e} past />)}</div>
        </>
      )}
    </div>
  );
}
