import type { NextConfig } from "next";

// Extra hosts allowed to submit forms (Server Actions) — e.g. when the site sits
// behind a proxy that rewrites the Host header. Comma separated, wildcards allowed.
const extraOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  allowedDevOrigins: extraOrigins,
  experimental: {
    serverActions: {
      allowedOrigins: extraOrigins,
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
