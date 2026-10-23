import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-[8rem] leading-none text-gold">404</p>
      <h1 className="font-display text-3xl text-white">Lost on the dancefloor?</h1>
      <p className="mt-2 text-white/60">That page doesn&apos;t exist (or the party moved).</p>
      <Link href="/" className="btn btn-gold mt-8">Back to the homepage</Link>
    </div>
  );
}
