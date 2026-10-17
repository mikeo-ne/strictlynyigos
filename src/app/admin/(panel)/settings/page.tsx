import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { PageHeader } from "@/components/admin/ui";
import { saveSettingsAction } from "@/app/admin/actions";
import { requireUser } from "@/lib/auth";
import { emailEnabled } from "@/lib/mail";
import { paymentProvider } from "@/lib/payments";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/util";

export const metadata = { title: "Site settings" };

export default async function SettingsPage() {
  await requireUser(["admin"]);
  const s = getSettings();
  const F = ({ k, label, hint, area }: { k: keyof typeof s; label: string; hint?: string; area?: boolean }) => (
    <div>
      <label className="label" htmlFor={k}>{label}</label>
      {area ? <textarea id={k} name={k} defaultValue={s[k]} rows={4} className="input" /> : <input id={k} name={k} defaultValue={s[k]} className="input" />}
      {hint && <p className="mt-1 text-xs text-white/40">{hint}</p>}
    </div>
  );
  return (
    <>
      <PageHeader title="Site settings" />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <ActionForm action={saveSettingsAction} className="card space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <F k="site_name" label="Site name" />
            <F k="tagline" label="Tagline" />
          </div>
          <F k="announcement" label="Announcement bar" hint="Shown at the top of every page. Leave empty to hide. e.g. “Early-bird tickets end Friday!”" />
          <F k="about" label="About text" area />
          <div className="grid gap-4 sm:grid-cols-2">
            <F k="contact_email" label="Contact email" />
            <F k="contact_phone" label="Contact phone" />
            <F k="whatsapp" label="WhatsApp number" hint="International format, e.g. 256774221100" />
            <F k="instagram" label="Instagram handle" />
            <F k="x_handle" label="X / Twitter handle" />
            <F k="tiktok" label="TikTok handle" />
          </div>
          <SubmitButton>Save settings</SubmitButton>
        </ActionForm>
        <div className="space-y-4 text-sm">
          <div className="card p-5">
            <p className="font-bold text-white">Payments</p>
            <p className="mt-1 text-white/60">Provider: <b className="text-white">{paymentProvider()}</b></p>
            <p className="mt-2 text-white/50">To accept MTN MoMo, Airtel Money & cards, set <code>PAYMENTS_PROVIDER=flutterwave</code>, <code>FLW_SECRET_KEY</code> and <code>FLW_WEBHOOK_HASH</code> in your environment.</p>
            <p className="mt-2 break-all text-xs text-white/40">Webhook URL: {siteUrl()}/api/payments/flutterwave/webhook</p>
          </div>
          <div className="card p-5">
            <p className="font-bold text-white">Email</p>
            <p className="mt-1 text-white/60">SMTP: <b className={emailEnabled() ? "text-jam" : "text-gold"}>{emailEnabled() ? "connected" : "not configured"}</b></p>
            <p className="mt-2 text-white/50">Set <code>SMTP_HOST</code>, <code>SMTP_USER</code>, <code>SMTP_PASS</code> and <code>MAIL_FROM</code>. Works with Gmail (app password), Zoho, Brevo, Mailgun, Amazon SES, etc.</p>
          </div>
        </div>
      </div>
    </>
  );
}
