import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { Logo } from "@/components/Logo";
import { requireUser } from "@/lib/auth";
import { emailEnabled } from "@/lib/mail";
import { paymentProvider } from "@/lib/payments";
import { logoutAction } from "../auth-actions";

export const metadata = { title: { default: "Organiser portal", template: "%s · Organiser portal" }, robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const u = await requireUser();
  const demoPay = paymentProvider() === "demo";
  const noMail = !emailEnabled();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <div className="bg-black lg:border-r lg:border-white/5">
      <aside className="relative border-b border-white/5 p-4 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:p-5">
        <div className="flex items-center justify-between lg:block">
          <Logo href="/admin" small />
          <p className="hidden text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 lg:mt-1 lg:block">Organiser portal</p>
        </div>
        <div className="mt-4 lg:mt-8"><AdminNav role={u.role} /></div>
        <div className="mt-4 hidden border-t border-white/10 pt-4 text-sm lg:absolute lg:bottom-5 lg:left-5 lg:right-5 lg:block">
          <p className="font-semibold text-white">{u.name}</p>
          <p className="text-xs capitalize text-white/40">{u.role}</p>
          <div className="mt-3 flex gap-2">
            <Link href="/" target="_blank" className="btn btn-ghost !px-3 !py-1.5 text-xs">View site ↗</Link>
            <form action={logoutAction}><button className="btn btn-ghost !px-3 !py-1.5 text-xs">Log out</button></form>
          </div>
        </div>
      </aside>
      </div>
      <div className="min-w-0">
        {(demoPay || noMail) && u.role === "admin" && (
          <div className="border-b border-gold/20 bg-gold/10 px-6 py-2 text-xs text-gold">
            {demoPay && <span className="mr-4">● Payments are in <b>demo mode</b> (no real money). Add Flutterwave keys to go live.</span>}
            {noMail && <span>● SMTP not configured — emails are saved to the <Link className="underline" href="/admin/outbox">outbox</Link> instead of being sent.</span>}
          </div>
        )}
        <div className="mx-auto max-w-6xl p-4 sm:p-8">{children}</div>
        <div className="flex gap-2 p-4 lg:hidden">
          <Link href="/" className="btn btn-ghost text-xs">View site</Link>
          <form action={logoutAction}><button className="btn btn-ghost text-xs">Log out ({u.name})</button></form>
        </div>
      </div>
    </div>
  );
}
