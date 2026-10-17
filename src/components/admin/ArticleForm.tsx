import Link from "next/link";
import { ActionForm, SubmitButton } from "./ActionForm";
import { ImageField } from "./ImageField";
import { MarkdownEditor } from "./MarkdownEditor";
import { deleteArticleAction, saveArticleAction } from "@/app/admin/actions";
import type { Article, EventRow } from "@/lib/types";
import { isoToKampalaInput } from "@/lib/util";

const CATEGORIES = ["News", "Line-up", "Recap", "Guide", "Interview", "Announcement"];

export function ArticleForm({ a, events, defaultAuthor }: { a?: Article; events: EventRow[]; defaultAuthor: string }) {
  return (
    <>
      <ActionForm action={saveArticleAction} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <input type="hidden" name="id" value={a?.id ?? ""} />
        <div className="min-w-0 space-y-5">
          <div>
            <label className="label" htmlFor="title">Title</label>
            <input id="title" name="title" defaultValue={a?.title} required className="input !text-xl !font-bold" placeholder="e.g. Strictly Nyigos returns to Silo 15 this December" />
          </div>
          <div>
            <label className="label" htmlFor="excerpt">Summary (shown on cards & social shares)</label>
            <textarea id="excerpt" name="excerpt" defaultValue={a?.excerpt} rows={2} maxLength={400} className="input" />
          </div>
          <div>
            <span className="label">Story</span>
            <MarkdownEditor name="body_md" defaultValue={a?.body_md} />
            <p className="mt-1.5 text-xs text-white/40">Tip: paste or upload images straight into the editor. Use <code>{"{{name}}"}</code> only in email campaigns.</p>
          </div>
        </div>
        <div className="space-y-5">
          <div className="card space-y-3 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">Status</span>
              <span className="font-bold capitalize">{a?.status ?? "new"}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SubmitButton name="intent" value="draft" className="btn btn-ghost">Save draft</SubmitButton>
              <SubmitButton name="intent" value="publish" className="btn btn-gold">{a?.status === "published" ? "Update" : "Publish"}</SubmitButton>
            </div>
            {a && (
              <Link href={`/news/${a.slug}`} target="_blank" className="block text-center text-xs text-white/50 hover:text-white">Preview on site ↗</Link>
            )}
          </div>
          <ImageField name="cover_image" defaultValue={a?.cover_image} />
          <div>
            <label className="label" htmlFor="category">Category</label>
            <input id="category" name="category" list="cats" defaultValue={a?.category ?? "News"} className="input" />
            <datalist id="cats">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div>
            <label className="label" htmlFor="event_id">Related event (adds a ticket button)</label>
            <select id="event_id" name="event_id" defaultValue={a?.event_id ?? ""} className="input">
              <option value="">— None —</option>
              {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="published_at">Publish date (Kampala time)</label>
            <input id="published_at" name="published_at" type="datetime-local" defaultValue={isoToKampalaInput(a?.published_at)} className="input" />
            <p className="mt-1 text-xs text-white/40">Set a future date to schedule. Leave empty to publish now.</p>
          </div>
          <div>
            <label className="label" htmlFor="author_name">Author</label>
            <input id="author_name" name="author_name" defaultValue={a?.author_name || defaultAuthor} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="slug">URL slug</label>
            <input id="slug" name="slug" defaultValue={a?.slug} placeholder="auto from title" className="input font-mono text-xs" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="featured" defaultChecked={!!a?.featured} className="h-4 w-4 accent-[#fed100]" /> Feature at the top of the news page
          </label>
        </div>
      </ActionForm>
      {a && (
        <form action={deleteArticleAction} className="mt-10 border-t border-white/10 pt-6">
          <input type="hidden" name="id" value={a.id} />
          <SubmitButton className="btn btn-danger" confirm="Delete this article permanently?">Delete article</SubmitButton>
        </form>
      )}
    </>
  );
}
