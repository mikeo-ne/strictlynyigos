"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { all, get, run, tx } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";
import { emailLayout, escapeHtml, sendMail } from "@/lib/mail";
import { createOrder, markOrderPaid, orderByRef, OrderError, sendOrderEmail } from "@/lib/orders";
import { hashPassword } from "@/lib/password";
import { DEFAULT_SETTINGS, saveSettings } from "@/lib/settings";
import { subscribe, unsubscribeUrl } from "@/lib/subscribers";
import type { Campaign, Order, Role, Subscriber } from "@/lib/types";
import { int, isEmail, kampalaInputToISO, slugify, str, token } from "@/lib/util";
import type { FormState } from "@/app/actions";

const CONTENT: Role[] = ["admin", "editor"];
const ADMIN: Role[] = ["admin"];

function uniqueSlug(table: "articles" | "events", base: string, id?: number) {
  let slug = slugify(base);
  let i = 2;
  while (get(`SELECT 1 FROM ${table} WHERE slug = ? AND id != ?`, slug, id ?? 0)) slug = `${slugify(base)}-${i++}`;
  return slug;
}

export async function previewMarkdownAction(md: string) {
  await requireUser(CONTENT);
  return renderMarkdown(md);
}

/* ------------------------------ Articles ------------------------------ */

export async function saveArticleAction(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser(CONTENT);
  const id = int(fd, "id");
  const title = str(fd, "title");
  if (!title) return { error: "Give your article a title." };
  const intent = str(fd, "intent"); // draft | publish | save
  const existing = id ? get<{ status: string; published_at: string | null }>("SELECT status, published_at FROM articles WHERE id = ?", id) : undefined;
  let status = existing?.status || "draft";
  if (intent === "publish") status = "published";
  if (intent === "draft") status = "draft";
  let publishedAt = kampalaInputToISO(str(fd, "published_at")) || existing?.published_at || null;
  if (status === "published" && !publishedAt) publishedAt = new Date().toISOString();
  const eventId = int(fd, "event_id") || null;
  const vals = {
    slug: uniqueSlug("articles", str(fd, "slug") || title, id || undefined),
    title,
    excerpt: str(fd, "excerpt").slice(0, 400),
    body_md: (fd.get("body_md") as string) || "",
    cover_image: str(fd, "cover_image"),
    category: str(fd, "category") || "News",
    author_name: str(fd, "author_name") || u.name,
    event_id: eventId,
    status,
    featured: fd.get("featured") === "on" ? 1 : 0,
    published_at: publishedAt,
  };
  let newId = id;
  if (id) {
    run(
      `UPDATE articles SET slug=?, title=?, excerpt=?, body_md=?, cover_image=?, category=?, author_name=?, event_id=?, status=?, featured=?, published_at=?, updated_at=? WHERE id=?`,
      vals.slug, vals.title, vals.excerpt, vals.body_md, vals.cover_image, vals.category, vals.author_name, vals.event_id, vals.status, vals.featured, vals.published_at, new Date().toISOString(), id,
    );
  } else {
    newId = Number(
      run(
        `INSERT INTO articles (slug, title, excerpt, body_md, cover_image, category, author_name, event_id, status, featured, published_at, author_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        vals.slug, vals.title, vals.excerpt, vals.body_md, vals.cover_image, vals.category, vals.author_name, vals.event_id, vals.status, vals.featured, vals.published_at, u.id,
      ).lastInsertRowid,
    );
  }
  revalidatePath("/", "layout");
  redirect(`/admin/articles/${newId}?saved=${intent || "save"}`);
}

export async function deleteArticleAction(fd: FormData) {
  await requireUser(CONTENT);
  run("DELETE FROM articles WHERE id = ?", int(fd, "id"));
  redirect("/admin/articles?deleted=1");
}

/* ------------------------------ Events ------------------------------ */

export async function saveEventAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireUser(ADMIN);
  const id = int(fd, "id");
  const title = str(fd, "title");
  const startsAt = kampalaInputToISO(str(fd, "starts_at"));
  const endsAt = kampalaInputToISO(str(fd, "ends_at"));
  if (!title) return { error: "Event title is required." };
  if (!startsAt) return { error: "Start date & time is required." };
  if (endsAt && endsAt < startsAt) return { error: "End time must be after the start time." };
  const status = ["draft", "published", "cancelled"].includes(str(fd, "status")) ? str(fd, "status") : "draft";
  const v = [
    uniqueSlug("events", str(fd, "slug") || title, id || undefined),
    title,
    str(fd, "tagline"),
    (fd.get("description_md") as string) || "",
    str(fd, "venue"),
    str(fd, "address"),
    str(fd, "map_url"),
    startsAt,
    endsAt,
    str(fd, "cover_image"),
    str(fd, "lineup"),
    int(fd, "age_limit", 18),
    status,
  ];
  let newId = id;
  if (id) {
    run(
      `UPDATE events SET slug=?, title=?, tagline=?, description_md=?, venue=?, address=?, map_url=?, starts_at=?, ends_at=?, cover_image=?, lineup=?, age_limit=?, status=?, updated_at=? WHERE id=?`,
      ...v, new Date().toISOString(), id,
    );
  } else {
    newId = Number(
      run(
        `INSERT INTO events (slug, title, tagline, description_md, venue, address, map_url, starts_at, ends_at, cover_image, lineup, age_limit, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        ...v,
      ).lastInsertRowid,
    );
  }
  revalidatePath("/", "layout");
  redirect(`/admin/events/${newId}?saved=1`);
}

export async function deleteEventAction(fd: FormData) {
  await requireUser(ADMIN);
  const id = int(fd, "id");
  const orders = get<{ n: number }>("SELECT COUNT(*) n FROM orders WHERE event_id = ?", id)?.n ?? 0;
  if (orders > 0) redirect(`/admin/events/${id}?error=${encodeURIComponent("This event has orders, so it can't be deleted. Set it to Cancelled or Draft instead.")}`);
  run("DELETE FROM events WHERE id = ?", id);
  redirect("/admin/events?deleted=1");
}

export async function saveTicketTypeAction(fd: FormData) {
  await requireUser(ADMIN);
  const id = int(fd, "id");
  const eventId = int(fd, "event_id");
  const name = str(fd, "name");
  const price = int(fd, "price", -1);
  const quantity = int(fd, "quantity", -1);
  const back = (e?: string) => redirect(`/admin/events/${eventId}${e ? `?error=${encodeURIComponent(e)}` : "?saved=tickets"}#tickets`);
  if (!name || price < 0 || quantity < 0) back("Ticket name, price and quantity are required.");
  if (id) {
    const sold =
      get<{ n: number }>("SELECT COALESCE(SUM(oi.qty),0) n FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE oi.ticket_type_id=? AND o.status='paid'", id)?.n ?? 0;
    if (quantity < sold) back(`Quantity can't be lower than the ${sold} already sold.`);
    run(
      "UPDATE ticket_types SET name=?, description=?, price=?, admits=?, quantity=?, max_per_order=?, sort=?, active=? WHERE id=? AND event_id=?",
      name, str(fd, "description"), price, Math.max(1, int(fd, "admits", 1)), quantity, Math.max(1, int(fd, "max_per_order", 10)), int(fd, "sort"), fd.get("active") === "on" ? 1 : 0, id, eventId,
    );
  } else {
    run(
      "INSERT INTO ticket_types (event_id, name, description, price, admits, quantity, max_per_order, sort, active) VALUES (?,?,?,?,?,?,?,?,1)",
      eventId, name, str(fd, "description"), price, Math.max(1, int(fd, "admits", 1)), quantity, Math.max(1, int(fd, "max_per_order", 10)), int(fd, "sort"),
    );
  }
  back();
}

export async function deleteTicketTypeAction(fd: FormData) {
  await requireUser(ADMIN);
  const id = int(fd, "id");
  const eventId = int(fd, "event_id");
  const used = get("SELECT 1 FROM order_items WHERE ticket_type_id = ? LIMIT 1", id);
  if (used) run("UPDATE ticket_types SET active = 0 WHERE id = ?", id);
  else run("DELETE FROM ticket_types WHERE id = ?", id);
  redirect(`/admin/events/${eventId}?saved=${used ? "hidden" : "tickets"}#tickets`);
}

/* ------------------------------ Orders ------------------------------ */

export async function resendOrderAction(fd: FormData) {
  await requireUser(ADMIN);
  const o = orderByRef(str(fd, "ref"));
  if (o?.status === "paid") await sendOrderEmail(o);
  redirect(`/admin/orders/${str(fd, "ref")}?msg=${encodeURIComponent("Tickets re-sent to " + (o?.email ?? ""))}`);
}

export async function markPaidAction(fd: FormData) {
  const u = await requireUser(ADMIN);
  const ref = str(fd, "ref");
  await markOrderPaid(ref, `MANUAL:${u.email}`);
  redirect(`/admin/orders/${ref}?msg=${encodeURIComponent("Marked as paid. Tickets issued and emailed.")}`);
}

export async function setOrderStatusAction(fd: FormData) {
  await requireUser(ADMIN);
  const ref = str(fd, "ref");
  const status = str(fd, "status");
  if (!["cancelled", "refunded"].includes(status)) redirect(`/admin/orders/${ref}`);
  run("UPDATE orders SET status = ? WHERE ref = ?", status, ref);
  redirect(`/admin/orders/${ref}?msg=${encodeURIComponent(`Order ${status}. Its tickets will no longer scan at the door.`)}`);
}

export async function compTicketsAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireUser(ADMIN);
  const eventId = int(fd, "event_id");
  const ttId = int(fd, "ticket_type_id");
  const qty = Math.max(1, Math.min(20, int(fd, "qty", 1)));
  const name = str(fd, "name");
  const email = str(fd, "email").toLowerCase();
  if (!name || !isEmail(email)) return { error: "Guest name and a valid email are required." };
  let ref: string;
  try {
    const o = createOrder({ eventId, lines: [{ ticketTypeId: ttId, qty }], name, email, phone: str(fd, "phone"), optIn: false, provider: "comp" });
    run("UPDATE orders SET total = 0 WHERE id = ?", o.id);
    run("UPDATE order_items SET unit_price = 0 WHERE order_id = ?", o.id);
    await markOrderPaid(o.ref, "COMPLIMENTARY");
    ref = o.ref;
  } catch (e) {
    return { error: e instanceof OrderError ? e.message : "Could not create guest tickets." };
  }
  redirect(`/admin/orders/${ref}?msg=${encodeURIComponent("Guest-list tickets issued and emailed.")}`);
}

/* ------------------------------ Check-in ------------------------------ */

export type CheckInResult = {
  status: "ok" | "used" | "invalid" | "wrong_event" | "void";
  code: string;
  name?: string;
  ticket?: string;
  admits?: number;
  event?: string;
  usedAt?: string;
};

export async function checkInAction(rawCode: string, eventId: number | null): Promise<CheckInResult> {
  const u = await requireUser(["admin", "door"]);
  const code = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  const t = get<{ id: number; checked_in_at: string | null; event_id: number; status: string; buyer_name: string; tname: string; admits: number; etitle: string }>(
    `SELECT tk.id, tk.checked_in_at, tk.event_id, o.status, o.buyer_name, tt.name tname, tt.admits, e.title etitle
     FROM tickets tk JOIN orders o ON o.id = tk.order_id JOIN ticket_types tt ON tt.id = tk.ticket_type_id JOIN events e ON e.id = tk.event_id
     WHERE tk.code = ?`,
    code,
  );
  if (!t) return { status: "invalid", code };
  const base = { code, name: t.buyer_name, ticket: t.tname, admits: t.admits, event: t.etitle };
  if (eventId && t.event_id !== eventId) return { status: "wrong_event", ...base };
  if (t.status !== "paid") return { status: "void", ...base };
  if (t.checked_in_at) return { status: "used", ...base, usedAt: t.checked_in_at };
  const res = run("UPDATE tickets SET checked_in_at = ?, checked_in_by = ? WHERE id = ? AND checked_in_at IS NULL", new Date().toISOString(), u.id, t.id);
  if (res.changes === 0) return { status: "used", ...base };
  return { status: "ok", ...base };
}

export async function undoCheckInAction(code: string) {
  await requireUser(["admin", "door"]);
  run("UPDATE tickets SET checked_in_at = NULL, checked_in_by = NULL WHERE code = ?", code);
}

/* ------------------------------ Subscribers ------------------------------ */

export async function addSubscribersAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireUser(CONTENT);
  const raw = str(fd, "emails");
  const welcome = fd.get("welcome") === "on";
  const source = str(fd, "source") || "manual";
  // Accept "email", "email,name" or "name <email>" per line
  const lines = raw.split(/\r?\n|;/).map((l) => l.trim()).filter(Boolean);
  let added = 0, skipped = 0, invalid = 0;
  for (const line of lines) {
    const m = line.match(/[^\s@,<>"]+@[^\s@,<>"]+\.[^\s@,<>"]+/);
    if (!m || !isEmail(m[0])) { invalid++; continue; }
    const email = m[0].toLowerCase();
    const name = line.replace(m[0], "").replace(/[<>",]/g, " ").trim();
    if (get<Subscriber>("SELECT * FROM subscribers WHERE email = ? AND status='subscribed'", email)) { skipped++; continue; }
    await subscribe(email, { name, source, welcome });
    added++;
  }
  revalidatePath("/admin/subscribers");
  return { ok: true, message: `Added ${added}. ${skipped ? `${skipped} already subscribed. ` : ""}${invalid ? `${invalid} invalid line(s) skipped.` : ""}` };
}

export async function subscriberStatusAction(fd: FormData) {
  await requireUser(CONTENT);
  const id = int(fd, "id");
  const op = str(fd, "op");
  if (op === "delete") run("DELETE FROM subscribers WHERE id = ?", id);
  else if (op === "unsubscribe") run("UPDATE subscribers SET status='unsubscribed', unsubscribed_at=? WHERE id = ?", new Date().toISOString(), id);
  else if (op === "resubscribe") run("UPDATE subscribers SET status='subscribed', unsubscribed_at=NULL WHERE id = ?", id);
  revalidatePath("/admin/subscribers");
}

/* ------------------------------ Campaigns ------------------------------ */

function recipientsFor(audience: string): { email: string; name: string; token: string | null }[] {
  if (audience.startsWith("event:")) {
    const eventId = Number(audience.slice(6));
    return all<{ email: string; name: string; token: string | null }>(
      `SELECT o.email, MAX(o.buyer_name) name, s.token FROM orders o LEFT JOIN subscribers s ON s.email = o.email
       WHERE o.event_id = ? AND o.status = 'paid' AND (s.status IS NULL OR s.status = 'subscribed') GROUP BY o.email`,
      eventId,
    );
  }
  return all("SELECT email, name, token FROM subscribers WHERE status = 'subscribed'");
}

export async function audienceCountAction(audience: string) {
  await requireUser(CONTENT);
  return recipientsFor(audience).length;
}

function campaignHtml(c: Pick<Campaign, "subject" | "preheader" | "body_md">, r: { name: string; token: string | null }) {
  const first = (r.name || "").split(" ")[0] || "fam";
  const body = renderMarkdown(c.body_md.replace(/\{\{\s*name\s*\}\}/gi, first));
  return emailLayout({
    title: c.subject,
    preheader: c.preheader,
    unsubscribeUrl: r.token ? unsubscribeUrl(r.token) : undefined,
    bodyHtml: `<div style="color:#e5e5e5">${body.replace(/<a /g, '<a style="color:#FED100" ').replace(/<img /g, '<img style="max-width:100%;border-radius:12px" ').replace(/<h(\d)>/g, '<h$1 style="color:#fff">')}</div>`,
  });
}

export async function saveCampaignAction(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireUser(CONTENT);
  const id = int(fd, "id");
  const intent = str(fd, "intent");
  const subject = str(fd, "subject");
  const body = (fd.get("body_md") as string) || "";
  const audience = str(fd, "audience") || "subscribers";
  const preheader = str(fd, "preheader");
  if (!subject) return { error: "Add a subject line." };
  const existing = id ? get<Campaign>("SELECT * FROM campaigns WHERE id = ?", id) : undefined;
  if (existing?.status === "sent") return { error: "This campaign has already been sent." };
  let cid = id;
  if (id) run("UPDATE campaigns SET subject=?, preheader=?, body_md=?, audience=? WHERE id=?", subject, preheader, body, audience, id);
  else cid = Number(run("INSERT INTO campaigns (subject, preheader, body_md, audience, created_by) VALUES (?,?,?,?,?)", subject, preheader, body, audience, u.id).lastInsertRowid);

  if (intent === "test") {
    await sendMail({ to: u.email, subject: `[TEST] ${subject}`, html: campaignHtml({ subject, preheader, body_md: body }, { name: u.name, token: null }), kind: "campaign", campaignId: cid });
    redirect(`/admin/campaigns/${cid}?msg=${encodeURIComponent(`Test email sent to ${u.email}`)}`);
  }
  if (intent === "send") {
    if (!body.trim()) return { error: "Write something before sending." };
    const claimed = run("UPDATE campaigns SET status='sent', sent_at=? WHERE id=? AND status='draft'", new Date().toISOString(), cid).changes;
    if (!claimed) return { error: "This campaign has already been sent." };
    const list = recipientsFor(audience);
    for (const r of list) {
      await sendMail({
        to: r.email,
        subject,
        html: campaignHtml({ subject, preheader, body_md: body }, r),
        kind: "campaign",
        campaignId: cid,
        headers: r.token ? { "List-Unsubscribe": `<${unsubscribeUrl(r.token)}>` } : undefined,
      });
    }
    run("UPDATE campaigns SET recipients=? WHERE id=?", list.length, cid);
    redirect(`/admin/campaigns/${cid}?msg=${encodeURIComponent(`Sent to ${list.length} recipient(s) 🚀`)}`);
  }
  redirect(`/admin/campaigns/${cid}?msg=Saved`);
}

export async function deleteCampaignAction(fd: FormData) {
  await requireUser(CONTENT);
  run("DELETE FROM campaigns WHERE id = ? AND status = 'draft'", int(fd, "id"));
  redirect("/admin/campaigns");
}

/* ------------------------------ Team ------------------------------ */

export async function addUserAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireUser(ADMIN);
  const name = str(fd, "name");
  const email = str(fd, "email").toLowerCase();
  const role = str(fd, "role") as Role;
  const password = str(fd, "password") || token(9);
  if (!name || !isEmail(email)) return { error: "Name and valid email required." };
  if (!["admin", "editor", "door"].includes(role)) return { error: "Pick a role." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (get("SELECT 1 FROM users WHERE email = ?", email)) return { error: "That email already has an account." };
  run("INSERT INTO users (email, name, password_hash, role) VALUES (?,?,?,?)", email, name, hashPassword(password), role);
  await sendMail({
    to: email,
    subject: "You've been added to the Strictly Nyigos organiser portal",
    html: emailLayout({
      title: "Organiser access",
      bodyHtml: `<p>Hi ${escapeHtml(name)}, you now have <b>${role}</b> access to the Strictly Nyigos organiser portal.</p><p>Email: ${escapeHtml(email)}<br>Temporary password: <code style="color:#FED100">${escapeHtml(password)}</code></p><p>Log in at /admin and change your password from the Team page.</p>`,
    }),
  });
  revalidatePath("/admin/team");
  return { ok: true, message: `Added ${name}. Temporary password: ${password}` };
}

export async function updateUserAction(fd: FormData) {
  const me = await requireUser(ADMIN);
  const id = int(fd, "id");
  const op = str(fd, "op");
  if (id === me.id && op !== "role") redirect("/admin/team?error=" + encodeURIComponent("You can't remove yourself."));
  if (op === "delete") {
    tx(() => {
      run("DELETE FROM sessions WHERE user_id = ?", id);
      run("DELETE FROM users WHERE id = ?", id);
    });
  } else if (op === "role") {
    const role = str(fd, "role");
    const admins = get<{ n: number }>("SELECT COUNT(*) n FROM users WHERE role='admin'")?.n ?? 0;
    if (id === me.id && role !== "admin" && admins <= 1) redirect("/admin/team?error=" + encodeURIComponent("You're the only admin."));
    if (["admin", "editor", "door"].includes(role)) run("UPDATE users SET role = ? WHERE id = ?", role, id);
  }
  revalidatePath("/admin/team");
}

export async function changePasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireUser();
  const pw = str(fd, "password");
  if (pw.length < 8) return { error: "At least 8 characters." };
  run("UPDATE users SET password_hash = ? WHERE id = ?", hashPassword(pw), me.id);
  return { ok: true, message: "Password updated." };
}

/* ------------------------------ Settings ------------------------------ */

export async function saveSettingsAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireUser(ADMIN);
  const vals: Record<string, string> = {};
  for (const k of Object.keys(DEFAULT_SETTINGS)) vals[k] = str(fd, k);
  saveSettings(vals);
  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved." };
}

