import { ActionForm, SubmitButton } from "./ActionForm";
import { ImageField } from "./ImageField";
import { MarkdownEditor } from "./MarkdownEditor";
import { saveEventAction } from "@/app/admin/actions";
import type { EventRow } from "@/lib/types";
import { isoToKampalaInput } from "@/lib/util";

export function EventForm({ e }: { e?: EventRow }) {
  return (
    <ActionForm action={saveEventAction} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <input type="hidden" name="id" value={e?.id ?? ""} />
      <div className="min-w-0 space-y-5">
        <div>
          <label className="label" htmlFor="title">Event title</label>
          <input id="title" name="title" required defaultValue={e?.title} className="input !text-xl !font-bold" placeholder="Strictly Nyigos — December Edition" />
        </div>
        <div>
          <label className="label" htmlFor="tagline">Tagline</label>
          <input id="tagline" name="tagline" defaultValue={e?.tagline} className="input" placeholder="Dim lights. Slow riddims. Real chemistry." />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="starts_at">Starts (Kampala time)</label>
            <input id="starts_at" name="starts_at" type="datetime-local" required defaultValue={isoToKampalaInput(e?.starts_at)} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="ends_at">Ends</label>
            <input id="ends_at" name="ends_at" type="datetime-local" defaultValue={isoToKampalaInput(e?.ends_at)} className="input" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="venue">Venue</label>
            <input id="venue" name="venue" defaultValue={e?.venue} className="input" placeholder="Silo 15" />
          </div>
          <div>
            <label className="label" htmlFor="address">Address</label>
            <input id="address" name="address" defaultValue={e?.address} className="input" placeholder="Bandali Rise, Bugolobi, Kampala" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="map_url">Google Maps link</label>
          <input id="map_url" name="map_url" defaultValue={e?.map_url} className="input" placeholder="https://maps.google.com/…" />
        </div>
        <div>
          <span className="label">Description</span>
          <MarkdownEditor name="description_md" defaultValue={e?.description_md} rows={12} />
        </div>
      </div>
      <div className="space-y-5">
        <div className="card space-y-3 p-4">
          <label className="label" htmlFor="status">Visibility</label>
          <select id="status" name="status" defaultValue={e?.status ?? "draft"} className="input">
            <option value="draft">Draft (hidden)</option>
            <option value="published">Published (on sale)</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <SubmitButton className="btn btn-gold w-full">{e ? "Save changes" : "Create event"}</SubmitButton>
        </div>
        <ImageField name="cover_image" defaultValue={e?.cover_image} label="Poster / cover image" />
        <div>
          <label className="label" htmlFor="lineup">Line-up (one per line, headliner first)</label>
          <textarea id="lineup" name="lineup" rows={7} defaultValue={e?.lineup} className="input" placeholder={"DJ Alza\nDJ Bugy\nMC Dreadlock Dziz"} />
        </div>
        <div>
          <label className="label" htmlFor="age_limit">Minimum age</label>
          <input id="age_limit" name="age_limit" type="number" min={0} defaultValue={e?.age_limit ?? 18} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="slug">URL slug</label>
          <input id="slug" name="slug" defaultValue={e?.slug} placeholder="auto from title" className="input font-mono text-xs" />
        </div>
      </div>
    </ActionForm>
  );
}
