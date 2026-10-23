// Seeds starter content (and optionally an admin account).
//   npm run seed          -> starter events & articles (skipped if events already exist)
//   npm run seed:demo     -> also demo fans + ticket orders, for trying the dashboard
// Set ADMIN_EMAIL / ADMIN_PASSWORD (and optionally ADMIN_NAME) to create the first admin.
// Uses DATABASE_URL if set (e.g. your Neon database), otherwise the local ./data/pg database.
import { DATABASE_URL, get, insert } from "../src/lib/db";
import { hashPassword } from "../src/lib/password";
import { seedStarterContent } from "../src/lib/seed";

async function main() {
  console.log("Database:", DATABASE_URL ? DATABASE_URL.replace(/\/\/[^@]*@/, "//***@") : "local PGlite (./data/pg)");
  let authorId: number | undefined;
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  if (email && process.env.ADMIN_PASSWORD) {
    const existing = await get<{ id: number }>("SELECT id FROM users WHERE email = ?", email);
    authorId = existing?.id ?? (await insert("INSERT INTO users (email, name, password_hash, role) VALUES (?,?,?, 'admin')", email, process.env.ADMIN_NAME || "Organiser", hashPassword(process.env.ADMIN_PASSWORD)));
    console.log(existing ? "• Admin already exists:" : "✓ Admin created:", email);
  }
  const demo = process.argv.includes("--demo");
  const seeded = await seedStarterContent({ demo, authorId });
  console.log(seeded ? `✓ Starter content loaded${demo ? " (+ demo fans & orders)" : ""}` : "• Events already exist — skipped starter content.");
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
