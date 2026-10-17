import type { MetadataRoute } from "next";
import { publishedArticles } from "@/lib/articles";
import { publishedEvents } from "@/lib/events";
import { siteUrl } from "@/lib/util";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const b = siteUrl();
  return [
    { url: `${b}/`, changeFrequency: "daily", priority: 1 },
    { url: `${b}/events`, changeFrequency: "daily" },
    { url: `${b}/news`, changeFrequency: "daily" },
    ...(await publishedEvents()).map((e) => ({ url: `${b}/events/${e.slug}`, lastModified: e.updated_at })),
    ...(await publishedArticles(500)).map((a) => ({ url: `${b}/news/${a.slug}`, lastModified: a.updated_at })),
  ];
}
