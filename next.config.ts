import type { NextConfig } from "next";

// Extra hosts allowed to submit forms (Server Actions) — e.g. when the site sits
// behind a proxy that rewrites the Host header. Comma separated, wildcards allowed.
const extraOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  // Native/WASM database drivers stay as plain Node modules (not bundled).
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  allowedDevOrigins: extraOrigins,
  experimental: {
    serverActions: {
      allowedOrigins: extraOrigins,
      bodySizeLimit: "4mb", // Vercel caps request bodies at 4.5 MB; images go straight to Blob instead.
    },
  },
};

export default nextConfig;
