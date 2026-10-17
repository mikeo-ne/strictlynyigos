import { ArticleForm } from "@/components/admin/ArticleForm";
import { PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import type { EventRow } from "@/lib/types";

export const metadata = { title: "New article" };

export default async function NewArticle() {
  const u = await requireUser(["admin", "editor"]);
  const events = all<EventRow>("SELECT * FROM events ORDER BY starts_at DESC");
  return (
    <>
      <PageHeader title="New article" />
      <ArticleForm events={events} defaultAuthor={u.name} />
    </>
  );
}
