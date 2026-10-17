import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/Cards";
import { articleCategories, publishedArticles } from "@/lib/articles";

export const metadata: Metadata = { title: "News & stories" };

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const cats = articleCategories();
  const articles = publishedArticles(100, category || undefined);
  const [first, ...rest] = articles;
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <p className="text-sm font-bold uppercase tracking-widest text-jam">From the organisers</p>
      <h1 className="font-display text-6xl text-white sm:text-7xl">News & stories</h1>
      {cats.length > 1 && (
        <div className="mt-8 flex flex-wrap gap-2">
          <Link href="/news" className={`rounded-full px-4 py-2 text-sm font-bold ${!category ? "bg-gold text-black" : "border border-white/15 text-white/80 hover:border-white/40"}`}>All</Link>
          {cats.map((c) => (
            <Link key={c.category} href={`/news?category=${encodeURIComponent(c.category)}`} className={`rounded-full px-4 py-2 text-sm font-bold ${category === c.category ? "bg-gold text-black" : "border border-white/15 text-white/80 hover:border-white/40"}`}>
              {c.category} <span className="opacity-60">{c.n}</span>
            </Link>
          ))}
        </div>
      )}
      {!first ? (
        <p className="mt-12 text-white/60">No stories yet — check back soon.</p>
      ) : (
        <div className="mt-10 grid gap-6">
          <ArticleCard a={first} large />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{rest.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
        </div>
      )}
    </div>
  );
}
