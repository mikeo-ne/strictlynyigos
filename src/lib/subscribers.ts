import "server-only";
import { get, run } from "./db";
import { emailLayout, escapeHtml, sendMail, emailButton } from "./mail";
import { getSettings } from "./settings";
import type { Subscriber } from "./types";
import { siteUrl, token } from "./util";

/** Adds (or re-subscribes) an email. Returns true if this is a new/re-activated subscriber. */
export async function subscribe(email: string, opts: { name?: string; phone?: string; source?: string; welcome?: boolean } = {}) {
  const existing = get<Subscriber>("SELECT * FROM subscribers WHERE email = ?", email);
  if (existing) {
    if (existing.status === "subscribed") {
      if (opts.name && !existing.name) run("UPDATE subscribers SET name = ? WHERE id = ?", opts.name, existing.id);
      return false;
    }
    run(
      "UPDATE subscribers SET status='subscribed', unsubscribed_at=NULL, name=COALESCE(NULLIF(?, ''), name) WHERE id = ?",
      opts.name || "",
      existing.id,
    );
  } else {
    run(
      "INSERT INTO subscribers (email, name, phone, source, token) VALUES (?,?,?,?,?)",
      email,
      opts.name || "",
      opts.phone || "",
      opts.source || "website",
      token(18),
    );
  }
  if (opts.welcome !== false) {
    const sub = get<Subscriber>("SELECT * FROM subscribers WHERE email = ?", email)!;
    const s = getSettings();
    await sendMail({
      to: email,
      subject: `You're on the ${s.site_name} list 🔥`,
      html: emailLayout({
        title: "Welcome",
        preheader: "First to know about dates, venues and early-bird tickets.",
        unsubscribeUrl: unsubscribeUrl(sub.token),
        bodyHtml: `<h1 style="margin:0 0 12px;color:#fff;font-size:24px">Welcome to the family${sub.name ? ", " + escapeHtml(sub.name.split(" ")[0]) : ""}!</h1>
<p>You'll be the first to hear about new dates, secret venues, line-ups and <b style="color:#FED100">early-bird tickets</b> — before they sell out.</p>
${emailButton(siteUrl() + "/events", "See upcoming events")}
<p style="color:#9a9a9a">Strictly Nyigos. Come close, move slow.</p>`,
      }),
    });
  }
  return true;
}

export function unsubscribeUrl(t: string) {
  return `${siteUrl()}/unsubscribe?token=${encodeURIComponent(t)}`;
}
