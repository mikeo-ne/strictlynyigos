import Link from "next/link";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";
import { getSettings } from "@/lib/settings";

export async function SiteFooter() {
  const s = await getSettings();
  const socials = [
    s.instagram && { label: "Instagram", href: `https://instagram.com/${s.instagram.replace("@", "")}` },
    s.x_handle && { label: "X / Twitter", href: `https://x.com/${s.x_handle.replace("@", "")}` },
    s.tiktok && { label: "TikTok", href: `https://tiktok.com/@${s.tiktok.replace("@", "")}` },
    s.whatsapp && { label: "WhatsApp", href: `https://wa.me/${s.whatsapp.replace(/\D/g, "")}` },
  ].filter(Boolean) as { label: string; href: string }[];
  return (
    <footer className="mt-24 border-t border-white/5 bg-black">
      <div className="stripe h-1.5" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Logo name={s.site_name} />
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.3em] text-jam">{s.tagline}</p>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">Get dates, venues and early-bird tickets in your inbox first.</p>
          <div className="mt-4 max-w-md">
            <NewsletterForm source="footer" compact />
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Explore</h3>
          <ul className="mt-4 space-y-2.5 text-sm font-medium">
            <li><Link className="hover:text-gold" href="/events">Upcoming events</Link></li>
            <li><Link className="hover:text-gold" href="/events#past">Past editions</Link></li>
            <li><Link className="hover:text-gold" href="/news">News & stories</Link></li>
            <li><Link className="hover:text-gold" href="/orders/find">Find my tickets</Link></li>
            <li><Link className="hover:text-gold" href="/news/rss.xml">RSS feed</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Contact & bookings</h3>
          <ul className="mt-4 space-y-2.5 text-sm font-medium text-white/80">
            {s.contact_phone && <li><a className="hover:text-gold" href={`tel:${s.contact_phone.replace(/\s/g, "")}`}>{s.contact_phone}</a></li>}
            {s.contact_email && <li><a className="hover:text-gold" href={`mailto:${s.contact_email}`}>{s.contact_email}</a></li>}
            {socials.map((x) => (
              <li key={x.label}><a className="hover:text-gold" href={x.href} target="_blank" rel="noopener noreferrer">{x.label}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 px-4 py-6 text-center text-xs text-white/40">
        © {new Date().getFullYear()} {s.site_name} · Kampala, Uganda · Strictly 18+ · Drink responsibly ·{" "}
        <Link href="/admin" className="hover:text-white">Organiser login</Link>
      </div>
    </footer>
  );
}
