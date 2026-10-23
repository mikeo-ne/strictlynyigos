import Link from "next/link";

export function Logo({ name = "Strictly Nyigos", href = "/", small = false }: { name?: string; href?: string; small?: boolean }) {
  const [first, ...rest] = name.split(" ");
  return (
    <Link href={href} className="group inline-flex items-baseline gap-1.5 leading-none" aria-label={`${name} home`}>
      <span className={`font-display ${small ? "text-xl" : "text-2xl"} text-white transition group-hover:text-gold`}>{first}</span>
      <span className={`font-display ${small ? "text-xl" : "text-2xl"} text-gold`}>{rest.join(" ")}</span>
    </Link>
  );
}
