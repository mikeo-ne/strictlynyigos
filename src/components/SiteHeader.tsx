import Link from "next/link";
import { Logo } from "./Logo";
import { getSettings } from "@/lib/settings";
import { nextEvent } from "@/lib/events";

const nav = [
  { href: "/events", label: "Events" },
  { href: "/news", label: "News" },
  { href: "/#about", label: "About" },
  { href: "/#join", label: "Mailing list" },
];

export async function SiteHeader() {
  const s = await getSettings();
  const ev = await nextEvent();
  return (
    <>
      {s.announcement && (
        <div className="bg-gold px-4 py-2 text-center text-sm font-bold text-black">{s.announcement}</div>
      )}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-ink/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo name={s.site_name} />
          <nav className="hidden items-center gap-7 text-sm font-semibold text-white/80 md:flex">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="transition hover:text-gold">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href={ev ? `/events/${ev.slug}#tickets` : "/events"} className="btn btn-gold !px-4 !py-2 text-xs uppercase tracking-wider">
              Get tickets
            </Link>
            <details className="relative md:hidden">
              <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-white/15 [&::-webkit-details-marker]:hidden" aria-label="Menu">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
              </summary>
              <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-white/10 bg-coal p-2 shadow-2xl">
                {nav.map((n) => (
                  <Link key={n.href} href={n.href} className="block rounded-xl px-4 py-3 font-semibold hover:bg-white/5">
                    {n.label}
                  </Link>
                ))}
              </div>
            </details>
          </div>
        </div>
      </header>
    </>
  );
}
