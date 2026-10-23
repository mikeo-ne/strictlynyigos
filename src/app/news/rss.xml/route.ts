import { publishedArticles } from "@/lib/articles";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/util";

export const dynamic = "force-dynamic";

const x = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

export async function GET() {
  const s = await getSettings();
  const base = siteUrl();
  const items = (await publishedArticles(30))
    .map(
      (a) => `<item><title>${x(a.title)}</title><link>${base}/news/${a.slug}</link><guid>${base}/news/${a.slug}</guid>
<pubDate>${new Date(a.published_at!).toUTCString()}</pubDate><category>${x(a.category)}</category><description>${x(a.excerpt)}</description></item>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${x(s.site_name)} — News</title><link>${base}/news</link><description>${x(s.tagline)}</description>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
