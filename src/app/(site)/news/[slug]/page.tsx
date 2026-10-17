import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/Cards";
import { NewsletterForm } from "@/components/NewsletterForm";
import { articleBySlug, publishedArticles, readingTime } from "@/lib/articles";
import { eventById, isPast } from "@/lib/events";
import { renderMarkdown } from "@/lib/markdown";
import { currentUser } from "@/lib/auth";
import { fmtDate, siteUrl } from "@/lib/util";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = articleBySlug((await params).slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.excerpt,
    openGraph: { type: "article", images: [a.cover_image || "/images/dj.jpg"], publishedTime: a.published_at || undefined },
  };
}

export default async function ArticlePage({ params }: Props) {
  const a = articleBySlug((await params).slug);
  if (!a) notFound();
  const live = a.status === "published" && a.published_at && new Date(a.published_at) <= new Date();
  if (!live && !(await currentUser())) notFound();
  const ev = a.event_id ? eventById(a.event_id) : undefined;
  const more = publishedArticles(4).filter((x) => x.id !== a.id).slice(0, 3);
  const shareUrl = `${siteUrl()}/news/${a.slug}`;
  const shareText = encodeURIComponent(`${a.title} ${shareUrl}`);

  return (
    <article>
      <header className="mx-auto max-w-4xl px-4 pt-14 sm:px-6">
        <Link href="/news" className="text-sm font-semibold text-white/60 hover:text-gold">← All stories</Link>
        {!live && <p className="mt-4 w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase">Draft / scheduled preview</p>}
        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest">
          <Link href={`/news?category=${encodeURIComponent(a.category)}`} className="text-gold">{a.category}</Link>
          <span className="text-white/30">•</span>
          <span className="text-white/50">{fmtDate(a.published_at || a.created_at)}</span>
          <span className="text-white/30">•</span>
          <span className="text-white/50">{readingTime(a.body_md)} min read</span>
        </div>
        <h1 className="mt-3 font-display text-4xl leading-[1.02] text-white sm:text-6xl">{a.title}</h1>
        {a.excerpt && <p className="mt-4 text-xl leading-relaxed text-white/70">{a.excerpt}</p>}
        {a.author_name && <p className="mt-5 text-sm text-white/50">By <span className="font-semibold text-white/80">{a.author_name}</span></p>}
      </header>
      {a.cover_image && (
        <div className="mx-auto mt-10 max-w-6xl px-4 sm:px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={a.cover_image} alt="" className="aspect-[21/10] w-full rounded-3xl object-cover" />
        </div>
      )}
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="prose-sn" dangerouslySetInnerHTML={{ __html: renderMarkdown(a.body_md) }} />

        {ev && !isPast(ev) && ev.status === "published" && (
          <Link href={`/events/${ev.slug}#tickets`} className="mt-12 flex items-center justify-between gap-4 rounded-2xl bg-gold p-6 text-black transition hover:bg-[#ffe14d]">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest">Tickets on sale</p>
              <p className="font-display text-2xl">{ev.title}</p>
              <p className="text-sm font-semibold">{fmtDate(ev.starts_at)} · {ev.venue}</p>
            </div>
            <span className="font-display text-3xl">→</span>
          </Link>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-white/10 pt-6 text-sm">
          <span className="font-bold text-white/50">Share:</span>
          <a className="btn btn-ghost !py-1.5" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${shareText}`}>WhatsApp</a>
          <a className="btn btn-ghost !py-1.5" target="_blank" rel="noopener noreferrer" href={`https://x.com/intent/post?text=${shareText}`}>X</a>
          <a className="btn btn-ghost !py-1.5" target="_blank" rel="noopener noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}>Facebook</a>
        </div>

        <div className="card mt-10 p-6 sm:p-8">
          <p className="font-display text-2xl text-white">Get the next story first</p>
          <p className="mt-1 text-white/60">Join the Strictly Nyigos mailing list.</p>
          <div className="mt-4"><NewsletterForm source={`article:${a.slug}`} /></div>
        </div>
      </div>

      {more.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-display text-3xl text-white">More stories</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">{more.map((x) => <ArticleCard key={x.id} a={x} />)}</div>
        </section>
      )}
    </article>
  );
}
