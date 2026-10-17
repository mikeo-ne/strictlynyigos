import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/util";

// Everything reads live data from the database.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${s.site_name} — ${s.tagline}`, template: `%s · ${s.site_name}` },
    description: s.about,
    openGraph: { siteName: s.site_name, images: ["/images/hero.jpg"], type: "website" },
    twitter: { card: "summary_large_image" },
    alternates: { types: { "application/rss+xml": "/news/rss.xml" } },
  };
}

export const viewport: Viewport = { themeColor: "#0a0a0a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
