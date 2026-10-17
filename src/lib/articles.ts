import "server-only";
import { all, get } from "./db";
import type { Article } from "./types";

export function publishedArticles(limit = 100, category?: string) {
  if (category)
    return all<Article>(
      "SELECT * FROM articles WHERE status='published' AND published_at <= ? AND category = ? ORDER BY published_at DESC LIMIT ?",
      new Date().toISOString(),
      category,
      limit,
    );
  return all<Article>(
    "SELECT * FROM articles WHERE status='published' AND published_at <= ? ORDER BY featured DESC, published_at DESC LIMIT ?",
    new Date().toISOString(),
    limit,
  );
}

export function articleCategories() {
  return all<{ category: string; n: number }>(
    "SELECT category, COUNT(*) n FROM articles WHERE status='published' AND published_at <= ? GROUP BY category ORDER BY n DESC",
    new Date().toISOString(),
  );
}

export function articleBySlug(slug: string) {
  return get<Article>("SELECT * FROM articles WHERE slug = ?", slug);
}

export function readingTime(md: string) {
  const words = md.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
