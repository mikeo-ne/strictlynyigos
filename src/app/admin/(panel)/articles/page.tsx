import Link from "next/link";
import { Badge, Empty, Flash, PageHeader, Table } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import type { Article } from "@/lib/types";
import { fmtDate } from "@/lib/util";

export const metadata = { title: "Articles" };

export default async function Articles({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; deleted?: string }> }) {
  await requireUser(["admin", "editor"]);
  const { q = "", status = "", deleted } = await searchParams;
  const rows = all<Article>(
    `SELECT * FROM articles WHERE (? = '' OR title LIKE ?) AND (? = '' OR status = ?) ORDER BY COALESCE(published_at, created_at) DESC`,
    q, `%${q}%`, status, status,
  );
  const now = new Date().toISOString();
  return (
    <>
      <PageHeader title="Articles" subtitle="News, line-up announcements, recaps & guides." actions={<Link href="/admin/articles/new" className="btn btn-gold">+ New article</Link>} />
      <Flash msg={deleted ? "Article deleted." : undefined} />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Search titles…" className="input max-w-xs" />
        <select name="status" defaultValue={status} className="input max-w-[10rem]">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
        <button className="btn btn-ghost">Filter</button>
      </form>
      {rows.length === 0 ? (
        <Empty>No articles yet. <Link href="/admin/articles/new" className="text-gold underline">Write your first one</Link>.</Empty>
      ) : (
        <Table>
          <thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Date</th><th></th></tr></thead>
          <tbody>
            {rows.map((a) => {
              const scheduled = a.status === "published" && a.published_at && a.published_at > now;
              return (
                <tr key={a.id}>
                  <td>
                    <Link href={`/admin/articles/${a.id}`} className="font-semibold text-white hover:text-gold">{a.title}</Link>
                    {a.featured ? <span className="ml-2 text-xs text-gold">★ featured</span> : null}
                    <div className="text-xs text-white/40">/news/{a.slug}</div>
                  </td>
                  <td className="text-white/70">{a.category}</td>
                  <td><Badge s={scheduled ? "scheduled" : a.status} /></td>
                  <td className="text-white/55">{fmtDate(a.published_at || a.created_at)}</td>
                  <td className="text-right">
                    <Link href={`/news/${a.slug}`} target="_blank" className="text-xs text-white/50 hover:text-white">View ↗</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </>
  );
}
