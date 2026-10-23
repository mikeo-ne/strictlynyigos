import "server-only";
import { all, get, type Q } from "./db";
import type { EventRow, TicketTypeWithStock } from "./types";

/** Pending (unpaid) orders hold their tickets for this long. */
export const HOLD_MINUTES = 20;

export function holdCutoff() {
  return new Date(Date.now() - HOLD_MINUTES * 60 * 1000).toISOString();
}

export function publishedEvents() {
  return all<EventRow>("SELECT * FROM events WHERE status != 'draft' ORDER BY starts_at DESC");
}

export function upcomingEvents() {
  return all<EventRow>(
    "SELECT * FROM events WHERE status = 'published' AND COALESCE(ends_at, starts_at) >= ? ORDER BY starts_at ASC",
    new Date().toISOString(),
  );
}

export function pastEvents() {
  return all<EventRow>(
    "SELECT * FROM events WHERE status != 'draft' AND COALESCE(ends_at, starts_at) < ? ORDER BY starts_at DESC",
    new Date().toISOString(),
  );
}

export async function nextEvent() {
  return (await upcomingEvents())[0];
}

export function eventBySlug(slug: string) {
  return get<EventRow>("SELECT * FROM events WHERE slug = ?", slug);
}

export function eventById(id: number, q: Pick<Q, "get"> = { get }) {
  return q.get<EventRow>("SELECT * FROM events WHERE id = ?", id);
}

export function isPast(e: EventRow) {
  return new Date(e.ends_at || e.starts_at).getTime() < Date.now();
}

/** Pass a transaction `q` + lock=true to lock the rows (prevents overselling under concurrency). */
export async function ticketTypesWithStock(eventId: number, onlyActive = false, q: Pick<Q, "all"> = { all }, lock = false): Promise<TicketTypeWithStock[]> {
  if (lock) await q.all("SELECT id FROM ticket_types WHERE event_id = ? FOR UPDATE", eventId);
  const rows = await q.all<TicketTypeWithStock>(
    `SELECT t.*,
       COALESCE((SELECT SUM(oi.qty) FROM order_items oi JOIN orders o ON o.id = oi.order_id
                 WHERE oi.ticket_type_id = t.id
                   AND (o.status = 'paid' OR (o.status = 'pending' AND o.created_at > ?))), 0) AS sold
     FROM ticket_types t WHERE t.event_id = ? ${onlyActive ? "AND t.active = 1" : ""}
     ORDER BY t.sort, t.price`,
    holdCutoff(),
    eventId,
  );
  return rows.map((t) => ({ ...t, remaining: Math.max(0, t.quantity - t.sold) }));
}

export function lineupList(e: EventRow) {
  return e.lineup
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}
