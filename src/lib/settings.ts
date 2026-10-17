import "server-only";
import { all, run } from "./db";

export const DEFAULT_SETTINGS = {
  site_name: "Strictly Nyigos",
  tagline: "The Most Killa Xperience",
  about:
    "Strictly Nyigos is Kampala's most talked-about dancehall party — a concept by DJ Alza's The Most Killa Xperience. Dim lights, a packed floor, slow-wine riddims and real chemistry. Come close, move slow, stay in the moment.",
  contact_email: "deejayalza258@gmail.com",
  contact_phone: "+256 774 221100",
  whatsapp: "256774221100",
  instagram: "",
  x_handle: "deejay_alza",
  tiktok: "",
  announcement: "",
};

export type Settings = typeof DEFAULT_SETTINGS;

export function getSettings(): Settings {
  const rows = all<{ key: string; value: string }>("SELECT key, value FROM settings");
  const s: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const r of rows) s[r.key] = r.value;
  return s as Settings;
}

export function saveSettings(values: Partial<Settings>) {
  for (const [k, v] of Object.entries(values)) {
    if (!(k in DEFAULT_SETTINGS)) continue;
    run("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", k, v ?? "");
  }
}
