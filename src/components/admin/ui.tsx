import Link from "next/link";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-white/55">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, href }: { label: string; value: React.ReactNode; hint?: React.ReactNode; href?: string }) {
  const inner = (
    <>
      <p className="text-xs font-bold uppercase tracking-widest text-white/45">{label}</p>
      <p className="mt-2 font-display text-3xl text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-white/50">{hint}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="card block p-5 transition hover:border-gold/50">{inner}</Link>
  ) : (
    <div className="card p-5">{inner}</div>
  );
}

const COLORS: Record<string, string> = {
  paid: "bg-jam/15 text-jam",
  published: "bg-jam/15 text-jam",
  subscribed: "bg-jam/15 text-jam",
  sent: "bg-jam/15 text-jam",
  pending: "bg-gold/15 text-gold",
  draft: "bg-white/10 text-white/70",
  scheduled: "bg-sky-500/15 text-sky-300",
  logged: "bg-sky-500/15 text-sky-300",
  failed: "bg-red-500/15 text-red-400",
  cancelled: "bg-red-500/15 text-red-400",
  refunded: "bg-purple-500/15 text-purple-300",
  unsubscribed: "bg-white/10 text-white/50",
  admin: "bg-gold/15 text-gold",
  editor: "bg-sky-500/15 text-sky-300",
  door: "bg-white/10 text-white/70",
};

export function Badge({ s, label }: { s: string; label?: string }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${COLORS[s] || "bg-white/10 text-white/70"}`}>{label || s}</span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="card p-10 text-center text-white/55">{children}</div>;
}

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3 [&_th]:text-xs [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-white/45 [&_tbody_tr]:border-t [&_tbody_tr]:border-white/5 [&_tbody_tr:hover]:bg-white/[0.02]">
        {children}
      </table>
    </div>
  );
}

export function Flash({ msg, error }: { msg?: string; error?: string }) {
  if (!msg && !error) return null;
  return <div className={`mb-6 rounded-xl px-4 py-3 text-sm font-semibold ${error ? "bg-red-500/10 text-red-400" : "bg-jam/10 text-jam"}`}>{error || msg}</div>;
}
