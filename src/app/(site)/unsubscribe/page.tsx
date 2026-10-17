import { unsubscribeAction } from "@/app/actions";
import { get } from "@/lib/db";
import Link from "next/link";

export const metadata = { title: "Unsubscribe", robots: { index: false } };

export default async function Unsubscribe({ searchParams }: { searchParams: Promise<{ token?: string; done?: string }> }) {
  const { token = "", done } = await searchParams;
  const sub = get<{ email: string; status: string }>("SELECT email, status FROM subscribers WHERE token = ?", token);
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      {!sub ? (
        <>
          <h1 className="font-display text-4xl text-white">Link not valid</h1>
          <p className="mt-3 text-white/60">This unsubscribe link is invalid or expired.</p>
        </>
      ) : done || sub.status === "unsubscribed" ? (
        <>
          <h1 className="font-display text-4xl text-white">You&apos;re unsubscribed</h1>
          <p className="mt-3 text-white/60">{sub.email} won&apos;t receive any more emails from us. Changed your mind? You can re-join anytime from the <Link className="text-gold underline" href="/#join">homepage</Link>.</p>
        </>
      ) : (
        <>
          <h1 className="font-display text-4xl text-white">Leaving so soon?</h1>
          <p className="mt-3 text-white/60">Unsubscribe <b className="text-white">{sub.email}</b> from the Strictly Nyigos mailing list?</p>
          <form action={unsubscribeAction} className="mt-8">
            <input type="hidden" name="token" value={token} />
            <button className="btn btn-gold">Yes, unsubscribe me</button>
          </form>
        </>
      )}
    </div>
  );
}
