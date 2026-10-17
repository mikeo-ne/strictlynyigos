import { notFound } from "next/navigation";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { Flash, PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import type { Article, EventRow } from "@/lib/types";

export const metadata = { title: "Edit article" };

export default async function EditArticle({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const u = await requireUser(["admin", "editor"]);
  const a = get<Article>("SELECT * FROM articles WHERE id = ?", Number((await params).id));
  if (!a) notFound();
  const { saved } = await searchParams;
  const events = all<EventRow>("SELECT * FROM events ORDER BY starts_at DESC");
  const scheduled = a.status === "published" && a.published_at && new Date(a.published_at) > new Date();
  const msg = saved === "publish" ? (scheduled ? "Scheduled! It goes live on the publish date." : "Published — it's live on the site 🎉") : saved ? "Saved." : undefined;
  return (
    <>
      <PageHeader title="Edit article" />
      <Flash msg={msg} />
      <ArticleForm a={a} events={events} defaultAuthor={u.name} />
    </>
  );
}
