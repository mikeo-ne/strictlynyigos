import crypto from "node:crypto";

export const TZ = "Africa/Kampala";

export function formatUGX(n: number) {
  return "UGX " + Math.round(n).toLocaleString("en-US");
}

export function shortUGX(n: number) {
  if (n >= 1000 && n % 1000 === 0) return `${(n / 1000).toLocaleString("en-US")}K`;
  return n.toLocaleString("en-US");
}

export function fmtDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = {}) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  }).format(new Date(iso));
}

export function fmtTime(iso: string | null | undefined) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

export function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "";
  return `${fmtDate(iso)} · ${fmtTime(iso)}`;
}

/** Kampala is UTC+3 all year (no DST). */
export function kampalaInputToISO(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.length === 16 ? `${value}:00` : value;
  const d = new Date(`${v}+03:00`);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export function isoToKampalaInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 3 * 3600 * 1000);
  return d.toISOString().slice(0, 16);
}

export function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "item"
  );
}

export function token(bytes = 24) {
  return crypto.randomBytes(bytes).toString("base64url");
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
export function code(len = 8) {
  const buf = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[buf[i] % ALPHABET.length];
  return out;
}

export function nowISO() {
  return new Date().toISOString();
}

export function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}

export function str(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export function int(fd: FormData, key: string, fallback = 0) {
  const n = parseInt(str(fd, key).replace(/[, ]/g, ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Public base URL. On Vercel it falls back to the production domain automatically. */
export function siteUrl() {
  const explicit = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** Absolute URL for a stored path or an already-absolute (e.g. Vercel Blob) URL. */
export function absUrl(u: string) {
  return /^https?:\/\//i.test(u) ? u : siteUrl() + (u.startsWith("/") ? u : "/" + u);
}

/** Only allow site-relative paths or https URLs for images saved from the admin. */
export function safeImageUrl(u: string) {
  u = u.trim();
  return u.startsWith("/") && !u.startsWith("//") ? u : /^https:\/\/[^\s"'()<>]+$/i.test(u) ? u : "";
}
