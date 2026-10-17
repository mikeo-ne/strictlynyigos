import { currentUser } from "@/lib/auth";
import { csvResponse, toCSV } from "@/lib/csv";
import { all } from "@/lib/db";

export async function GET(req: Request) {
  const u = await currentUser();
  if (!u || u.role === "door") return new Response("Forbidden", { status: 403 });
  const status = new URL(req.url).searchParams.get("status") || "subscribed";
  const rows = all("SELECT email, name, phone, source, status, created_at, unsubscribed_at FROM subscribers WHERE (? = 'all' OR status = ?) ORDER BY id", status, status);
  return csvResponse(toCSV(rows, ["email", "name", "phone", "source", "status", "created_at", "unsubscribed_at"]), `strictlynyigos-mailing-list-${new Date().toISOString().slice(0, 10)}.csv`);
}
