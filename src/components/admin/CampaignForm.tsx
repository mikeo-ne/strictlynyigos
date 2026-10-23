import { ActionForm, SubmitButton } from "./ActionForm";
import { AudienceCount } from "./AudienceCount";
import { MarkdownEditor } from "./MarkdownEditor";
import { saveCampaignAction } from "@/app/admin/actions";
import type { Campaign, EventRow } from "@/lib/types";

const TEMPLATE = `Hey {{name}},

**Strictly Nyigos is back!** 🔥

We're taking over **[venue]** on **[date]** — dim lights, slow riddims and the city's best selectors.

## Line-up
- DJ Alza
- …

Early-bird tickets are limited — grab yours before prices go up:

[Get tickets →](https://strictlynyigos.ug/events)

See you on the floor,
The Most Killa Xperience`;

export function CampaignForm({ c, events, subscriberCount, emailOn }: { c?: Campaign; events: EventRow[]; subscriberCount: number; emailOn: boolean }) {
  return (
    <ActionForm action={saveCampaignAction} className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <input type="hidden" name="id" value={c?.id ?? ""} />
      <div className="min-w-0 space-y-5">
        <div>
          <label className="label" htmlFor="subject">Subject line</label>
          <input id="subject" name="subject" required defaultValue={c?.subject} className="input !text-lg !font-bold" placeholder="🔥 Strictly Nyigos is back — early birds now on sale" />
        </div>
        <div>
          <label className="label" htmlFor="preheader">Preview text (shows after the subject in inboxes)</label>
          <input id="preheader" name="preheader" defaultValue={c?.preheader} className="input" placeholder="Only 100 early-bird tickets. Don't sleep." />
        </div>
        <div>
          <span className="label">Message</span>
          <MarkdownEditor name="body_md" defaultValue={c?.body_md ?? TEMPLATE} rows={20} />
          <p className="mt-1.5 text-xs text-white/40"><code>{"{{name}}"}</code> is replaced with each person&apos;s first name. An unsubscribe link is added automatically.</p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="card space-y-3 p-4">
          <label className="label" htmlFor="audience">Send to</label>
          <select id="audience" name="audience" defaultValue={c?.audience ?? "subscribers"} className="input">
            <option value="subscribers">Whole mailing list ({subscriberCount})</option>
            {events.map((e) => <option key={e.id} value={`event:${e.id}`}>Ticket buyers: {e.title}</option>)}
          </select>
          <AudienceCount />
          <SubmitButton name="intent" value="save" className="btn btn-ghost w-full">Save draft</SubmitButton>
          <SubmitButton name="intent" value="test" className="btn btn-ghost w-full">Send me a test</SubmitButton>
          <SubmitButton name="intent" value="send" className="btn btn-gold w-full" confirm="Send this email to everyone in the selected audience now? This can't be undone.">🚀 Send now</SubmitButton>
          {!emailOn && <p className="text-xs text-gold">SMTP isn&apos;t configured yet — emails will be saved to the Outbox instead of delivered.</p>}
        </div>
      </div>
    </ActionForm>
  );
}
