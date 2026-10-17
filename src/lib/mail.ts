import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { run } from "./db";
import { siteUrl } from "./util";
import { getSettings } from "./settings";

let transporter: Transporter | null | undefined;

function getTransport() {
  if (transporter !== undefined) return transporter;
  if (!process.env.SMTP_HOST) return (transporter = null);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporter;
}

export function emailEnabled() {
  return !!process.env.SMTP_HOST;
}

export interface MailOpts {
  to: string;
  subject: string;
  html: string;
  kind?: "transactional" | "campaign";
  campaignId?: number;
  headers?: Record<string, string>;
}

/**
 * Sends via SMTP when configured. Every email is recorded in the outbox so
 * organisers can see what went out (or what *would* have gone out in demo mode).
 */
export async function sendMail(o: MailOpts) {
  const t = getTransport();
  let status: "sent" | "logged" | "failed" = "logged";
  let error: string | null = null;
  if (t) {
    try {
      await t.sendMail({
        from: process.env.MAIL_FROM || "Strictly Nyigos <no-reply@strictlynyigos.ug>",
        to: o.to,
        subject: o.subject,
        html: o.html,
        headers: o.headers,
      });
      status = "sent";
    } catch (e) {
      status = "failed";
      error = e instanceof Error ? e.message : String(e);
    }
  }
  run(
    "INSERT INTO email_outbox (to_email, subject, html, kind, campaign_id, status, error) VALUES (?,?,?,?,?,?,?)",
    o.to,
    o.subject,
    o.html,
    o.kind || "transactional",
    o.campaignId ?? null,
    status,
    error,
  );
  return status;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export { esc as escapeHtml };

/** Branded, email-client-safe wrapper (tables + inline styles). */
export function emailLayout(opts: { title: string; preheader?: string; bodyHtml: string; unsubscribeUrl?: string }) {
  const s = getSettings();
  const base = siteUrl();
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(opts.title)}</title></head>
<body style="margin:0;padding:0;background:#0b0b0b;font-family:Helvetica,Arial,sans-serif;color:#f4f4f4">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(opts.preheader || "")}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0b"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#151515;border-radius:16px;overflow:hidden;border:1px solid #262626">
<tr><td style="padding:22px 28px;background:#000;border-bottom:4px solid #FED100">
<a href="${base}" style="text-decoration:none;color:#FED100;font-size:26px;font-weight:900;letter-spacing:2px;text-transform:uppercase">${esc(s.site_name)}</a>
<div style="color:#1db954;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin-top:4px">${esc(s.tagline)}</div>
</td></tr>
<tr><td style="padding:28px;font-size:16px;line-height:1.6;color:#e5e5e5">${opts.bodyHtml}</td></tr>
<tr><td style="padding:20px 28px;background:#0f0f0f;color:#8a8a8a;font-size:12px;line-height:1.6">
${esc(s.site_name)} · Kampala, Uganda · ${esc(s.contact_phone)}<br>
${opts.unsubscribeUrl ? `You're receiving this because you joined the ${esc(s.site_name)} list. <a href="${opts.unsubscribeUrl}" style="color:#FED100">Unsubscribe</a>.` : ""}
</td></tr></table></td></tr></table></body></html>`;
}

export function emailButton(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td style="background:#FED100;border-radius:999px">
<a href="${href}" style="display:inline-block;padding:14px 28px;color:#000;font-weight:800;text-decoration:none;text-transform:uppercase;letter-spacing:1px;font-size:14px">${esc(label)}</a></td></tr></table>`;
}
