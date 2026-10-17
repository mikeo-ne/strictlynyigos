// Starter content: past Strictly Nyigos editions, a SAMPLE upcoming event and a few articles.
// Used by /admin/setup ("Load starter content") and by `npm run seed` (scripts/seed.ts).
// No "server-only" import here so the CLI can use it too.
import { get, tx, type Q } from "./db";
import { code, token } from "./util";

const eat = (s: string) => new Date(s + "+03:00").toISOString(); // Kampala time -> ISO

type Tier = [name: string, description: string, price: number, admits: number, quantity: number];
interface SeedEvent {
  slug: string; title: string; tagline: string; description_md: string; venue: string; address: string; map_url: string;
  starts_at: string; ends_at: string; cover_image: string; lineup: string; status: string; tiers: Tier[];
}

const SILO = { venue: "Silo 15", address: "Bandali Rise, Bugolobi, Kampala", map_url: "https://www.google.com/maps/search/?api=1&query=Silo+15+Bandali+Rise+Bugolobi+Kampala" };

const EVENTS: SeedEvent[] = [
  {
    slug: "the-most-killa-xperience-strictly-nyigos-edition",
    title: "The Most Killa Xperience: Strictly Nyigos Edition",
    tagline: "Where it all started — a day-into-night nyigos session in Lugogo.",
    description_md: `The very first **Strictly Nyigos** — a special edition of DJ Alza's *The Most Killa Xperience*.\n\nFrom 2 PM till late, the former Legends Sports Bar turned into a high-energy playground of dancehall, drinks and non-stop nyigos. Singles were 30K and squads of five rolled in for 75K.\n\nThe city has been asking for it ever since.`,
    venue: "Legends Sports Bar & Restaurant", address: "Lugogo, Kampala", map_url: "",
    starts_at: eat("2025-08-16T14:00:00"), ends_at: eat("2025-08-16T23:30:00"),
    cover_image: "/images/dj.jpg", lineup: "DJ Alza\nDJ Bugy\nDreadlock Dziz", status: "published",
    tiers: [["Single", "Admits 1", 30000, 1, 400], ["Group of 5", "Admits 5 — bring the crew", 75000, 5, 100]],
  },
  {
    slug: "strictly-nyigos-silo-15-december-2025",
    title: "Strictly Nyigos @ Silo 15",
    tagline: "A midweek takeover on Bandali Rise.",
    description_md: `Strictly Nyigos moved to **Silo 15** on Bandali Rise for a stacked Wednesday night with fourteen selectors and hosts on one bill.`,
    ...SILO, starts_at: eat("2025-12-10T19:00:00"), ends_at: eat("2025-12-11T02:00:00"),
    cover_image: "/images/hero.jpg",
    lineup: "DJ Alza\nDJ Dash\nKash Pro\nDJ Bugy\nMelvyn Deejay\nCarlos Lopez\nDJ Ssese\nDJ Ames\nSaint Trevor\nDJ Matson\nOrijinal Jenesis\nEckostar\nChattabwoy\nDreadlock Dziz",
    status: "published",
    tiers: [["Single Pass", "Admits 1", 50000, 1, 400], ["Squad of 3", "Admits 3", 100000, 3, 150]],
  },
  {
    slug: "strictly-nyigos-returns-april-2026",
    title: "Strictly Nyigos Returns",
    tagline: "Smooth R&B, hip hop and slow-dance vibes — one of Kampala's most intimate party experiences.",
    description_md: `Strictly Nyigos came back on **30th April** with dim lights, a packed-out floor and a night all about moving slow and staying in the moment.`,
    ...SILO, starts_at: eat("2026-04-30T18:00:00"), ends_at: eat("2026-05-01T00:00:00"),
    cover_image: "/images/hero.jpg", lineup: "DJ Alza", status: "published",
    tiers: [["Single Pass", "Admits 1", 50000, 1, 400], ["Squad of 3", "Admits 3", 100000, 3, 150]],
  },
  {
    slug: "strictly-nyigos-in-the-jungle",
    title: "Strictly Nyigos in the Jungle",
    tagline: "24 hours. One forest. Independence weekend.",
    description_md: `For Independence weekend, DJ Alza took Strictly Nyigos **outdoors** — into the trees at Nyungu Yamawe Forest Park in Kitukutwe.\n\nNoon Friday to noon Saturday. No under 18s.`,
    venue: "Nyungu Yamawe Forest Park", address: "Kitukutwe, Kampala", map_url: "https://www.google.com/maps/dir/?api=1&destination=0.4386922,32.6521799",
    starts_at: eat("2026-10-09T12:00:00"), ends_at: eat("2026-10-10T12:00:00"),
    cover_image: "/images/jungle.jpg", lineup: "DJ Alza", status: "published",
    tiers: [["Jungle Pass", "Admits 1 · full 24 hours", 100000, 1, 500]],
  },
  {
    // ⚠ SAMPLE upcoming event so the ticket flow can be tried. Edit or delete it in /admin/events.
    slug: "strictly-nyigos-december-edition-2026",
    title: "Strictly Nyigos: December Edition",
    tagline: "Dim lights. Slow riddims. Real chemistry. The end-of-year nyigos.",
    description_md: `The end-of-year edition of Kampala's most talked-about party.\n\nExpect a packed floor, dim lights and the city's best selectors keeping it **slow, steady and close** all night long.\n\n### Good to know\n- Strictly **18+** — carry your ID\n- Squad passes admit everyone on one QR code\n- Early birds are limited — once they're gone, they're gone\n- Dress to dance: bright colours or all-black, comfortable shoes`,
    ...SILO, starts_at: eat("2026-12-12T19:00:00"), ends_at: eat("2026-12-13T03:00:00"),
    cover_image: "/images/hero.jpg",
    lineup: "DJ Alza\nDJ Bugy\nDJ Dash\nMelvyn Deejay\nDJ Ssese\nDreadlock Dziz (host)",
    status: "published",
    tiers: [
      ["Early Bird Single", "Admits 1 · limited batch", 50000, 1, 150],
      ["Squad of 3", "Admits 3 on one QR code", 100000, 3, 100],
      ["Regular Single", "Admits 1", 70000, 1, 400],
      ["VIP Table (6)", "Admits 6 · reserved table + bottle", 600000, 6, 12],
    ],
  },
];


/** Returns false (and does nothing) if events already exist. */
export async function seedStarterContent(opts: { demo?: boolean; authorId?: number; authorName?: string } = {}) {
  if (await get("SELECT 1 FROM events LIMIT 1")) return false;
  await tx(async (q) => {
    const ids: Record<string, number> = {};
    for (const e of EVENTS) {
      const { tiers, ...r } = e;
      const id = await q.insert(
        `INSERT INTO events (slug,title,tagline,description_md,venue,address,map_url,starts_at,ends_at,cover_image,lineup,age_limit,status)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,18,?)`,
        r.slug, r.title, r.tagline, r.description_md, r.venue, r.address, r.map_url, r.starts_at, r.ends_at, r.cover_image, r.lineup, r.status,
      );
      ids[e.slug] = id;
      for (const [i, t] of tiers.entries())
        await q.run(
          "INSERT INTO ticket_types (event_id,name,description,price,admits,quantity,max_per_order,sort) VALUES (?,?,?,?,?,?,?,?)",
          id, t[0], t[1], t[2], t[3], t[4], t[3] >= 5 ? 4 : 10, i,
        );
    }

    const articles = [
      {
        slug: "december-edition-announced",
        title: "December Edition announced — early birds are live",
        excerpt: "The end-of-year nyigos is coming to Silo 15. Early-bird singles and squad passes are on sale now — and they never last.",
        category: "Announcement", featured: 1, cover_image: "/images/hero.jpg",
        event_id: ids["strictly-nyigos-december-edition-2026"] ?? null, published_at: eat("2026-10-15T10:00:00"),
        body_md: `It's official — **Strictly Nyigos: December Edition** is happening at **Silo 15, Bandali Rise**.\n\nAfter the Jungle edition, we're bringing it back indoors for the end-of-year nyigos: dim lights, a packed floor, and slow, steady riddims all night long.\n\n## Tickets\n- **Early Bird Single** — 50K (limited batch)\n- **Squad of 3** — 100K on one QR code\n- **Regular Single** — 70K\n- **VIP Table (6)** — reserved table + bottle\n\nPay with MTN MoMo, Airtel Money or card. Your QR tickets land in your inbox instantly.\n\n> Early birds sold out fast last time. Don't sleep.\n\nSee you on the floor.`,
      },
      {
        slug: "strictly-nyigos-in-the-jungle-recap",
        title: "Into the trees: Strictly Nyigos in the Jungle",
        excerpt: "For Independence weekend we took the party outdoors to Nyungu Yamawe Forest Park — 24 hours of dancehall under the canopy.",
        category: "Recap", featured: 0, cover_image: "/images/jungle.jpg",
        event_id: ids["strictly-nyigos-in-the-jungle"] ?? null, published_at: eat("2026-10-12T12:00:00"),
        body_md: `Independence weekend, a forest park in Kitukutwe, and a sound system in the trees. **Strictly Nyigos in the Jungle** was our boldest edition yet.\n\nFrom noon on Friday to noon on Saturday, Nyungu Yamawe Forest Park became the dancefloor — the lights hit different when they're bouncing off branches.\n\n## Thank you\nTo everyone who made the drive out of town, to the crew who built a club in the middle of a forest, and to the selectors who kept it close all night: **asante sana**.\n\nGot photos or videos? Tag us — we want to see them.\n\nNext stop: December. Join the mailing list to be first in line.`,
      },
      {
        slug: "what-does-nyigos-mean",
        title: "What does “nyigos” actually mean?",
        excerpt: "Kampala slang, a dancefloor philosophy, and the story of how a one-off party became the city's most talked-about night.",
        category: "Story", featured: 0, cover_image: "/images/dj.jpg",
        event_id: null, published_at: eat("2026-09-20T09:00:00"),
        body_md: `If you've been on a Kampala dancefloor lately, you've heard it: **nyigos**.\n\nLoosely translated, it's two people dancing in *close proximity* — real close — to slow, steady dancehall. Some call it a test of the waist's flexibility. We call it a vibe.\n\n## How it started\nStrictly Nyigos began as a special edition of DJ Alza's **The Most Killa Xperience** in August 2025 at the former Legends Sports Bar in Lugogo. It was meant to be one night. The city had other plans.\n\nSince then it's taken over **Silo 15** on Bandali Rise and even a forest park on Independence weekend.\n\n## The rules (sort of)\n1. Come close.\n2. Move slow.\n3. Stay in the moment.\n4. Respect always — nyigos is about connection, not pressure.\n\nThat's it. See you on the floor.`,
      },
      {
        slug: "what-to-wear-to-strictly-nyigos",
        title: "What to wear to Strictly Nyigos",
        excerpt: "Bold colours, all-black mystery, and shoes that can survive a whole night of slow wine. Your style guide.",
        category: "Guide", featured: 0, cover_image: "/images/hero.jpg",
        event_id: null, published_at: eat("2026-09-05T09:00:00"),
        body_md: `Strictly Nyigos is intimate, bold and unapologetically fun — your outfit should be too.\n\n### Go bright… or go black\nBright colours and playful prints grab attention under the lights. All-black adds a mysterious, seductive edge. Both work.\n\n### Shoes are everything\nSneakers and boots are your best friends. You'll be on your feet all night — trust us.\n\n### Keep it moveable\nNyigos is about moving *with* someone. Pick fabrics that breathe and fits you can dance in.\n\n### Don't forget\n- Your **ID** — strictly 18+\n- Your **QR ticket** (on your phone or printed)\n- Your squad`,
      },
    ];
    for (const a of articles)
      await q.run(
        `INSERT INTO articles (slug,title,excerpt,body_md,cover_image,category,author_name,author_id,event_id,status,featured,published_at)
         VALUES (?,?,?,?,?,?,?,?,?,'published',?,?)`,
        a.slug, a.title, a.excerpt, a.body_md, a.cover_image, a.category, "Strictly Nyigos Team", opts.authorId ?? null, a.event_id, a.featured, a.published_at,
      );

    if (opts.demo) await seedDemo(q, ids["strictly-nyigos-december-edition-2026"]);
  });
  return true;
}

/** Fake fans + orders so the dashboard has something to show. Never use on a real site. */
async function seedDemo(q: Q, evId: number) {
  const names = ["Sarah Nakato", "Brian Okello", "Joan Atim", "Ivan Ssemanda", "Patricia Namubiru", "Daniel Kato", "Grace Akello", "Moses Mugisha", "Esther Nansubuga", "Allan Tumusiime", "Rita Achieng", "Kevin Lubega", "Diana Nabirye", "Samuel Opio", "Vivian Kyomuhendo", "Ronald Wasswa", "Faith Auma", "Edgar Byaruhanga"];
  const sources = ["homepage", "footer", "ticket purchase", "event:strictly-nyigos-in-the-jungle", "article:what-does-nyigos-mean"];
  const emailOf = (n: string) => n.toLowerCase().replace(" ", ".") + "@example.com";
  for (const [i, n] of names.entries())
    await q.run(
      "INSERT INTO subscribers (email,name,source,token,created_at) VALUES (?,?,?,?,?) ON CONFLICT (email) DO NOTHING",
      emailOf(n), n, sources[i % sources.length], token(18), new Date(Date.now() - (i * 1.7 + 0.3) * 86400e3).toISOString(),
    );
  const tiers = await q.all<{ id: number; price: number; admits: number }>("SELECT id, price, admits FROM ticket_types WHERE event_id = ? ORDER BY sort", evId);
  for (const [i, n] of names.slice(0, 14).entries()) {
    const t = tiers[i % 3 === 0 ? 1 : i % 5 === 0 ? 3 : 0];
    const qty = t.admits >= 6 ? 1 : 1 + (i % 2);
    const when = new Date(Date.now() - (i * 0.9 + 0.2) * 86400e3).toISOString();
    const status = i === 13 ? "pending" : "paid";
    const oid = await q.insert(
      `INSERT INTO orders (ref,access_token,event_id,buyer_name,email,phone,total,status,provider,provider_ref,created_at,paid_at,marketing_opt_in)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1)`,
      "SN-" + code(6), token(18), evId, n, emailOf(n), "0772" + String(100000 + i * 7919).slice(0, 6), t.price * qty, status, "demo",
      status === "paid" ? "DEMO-SEED" : null, when, status === "paid" ? when : null,
    );
    await q.run("INSERT INTO order_items (order_id,ticket_type_id,qty,unit_price) VALUES (?,?,?,?)", oid, t.id, qty, t.price);
    if (status === "paid")
      for (let k = 0; k < qty; k++) await q.run("INSERT INTO tickets (code,order_id,ticket_type_id,event_id) VALUES (?,?,?,?)", code(10), oid, t.id, evId);
  }
}
