# Strictly Nyigos — event website & organiser portal

Website for **Strictly Nyigos**, the Kampala dancehall party from DJ Alza's *The Most Killa Xperience*. Organisers can publish articles, run the mailing list, sell tickets and check people in at the door, all in one app.

## Features

**Public site**
- Homepage with the next event, a live countdown, ticket prices, latest stories, past editions, mailing-list signup and an FAQ
- Event pages with line-up, venue and directions, schema.org Event data for Google, and a ticket picker
- Ticket checkout: single and group passes ("Squad of 3" means one QR code admits 3 people). Payment by MTN MoMo, Airtel Money or card through Flutterwave, plus a demo mode for testing
- A ticket page for each order with QR codes (printable / save as PDF). The tickets are also emailed to the buyer
- "Find my tickets" page that re-sends ticket links, news section with categories, RSS feed, sitemap, and one-click unsubscribe

**Organiser portal (`/admin`)**
- **Dashboard**: revenue, tickets issued, list growth, sales for the last 14 days, and sales per ticket tier
- **Articles**: Markdown editor with preview, image upload, paste-to-upload, drafts, scheduled publishing, featured posts, categories, and a link to an event (adds a "Buy tickets" banner to the article)
- **Events & tickets**: create editions, upload posters, set ticket tiers (price, quantity, admits, max per order), issue comp / guest-list tickets
- **Orders**: search and filter, CSV export, re-send tickets, mark as paid manually (cash or direct MoMo), cancel or refund
- **Door check-in**: scan QR codes with the phone camera or type codes in. Each ticket can only be used once, with a live headcount and an undo button
- **Mailing list**: search, add or bulk-import (paste from Excel/Sheets), CSV export, signup-source tracking
- **Email campaigns**: write in Markdown with `{{name}}` merge tags, send yourself a test, then send to the whole list or to buyers of one event. An unsubscribe link and the `List-Unsubscribe` header are added automatically
- **Email outbox**: a copy of every email the site sends
- **Team**: Admin / Editor / Door roles. **Settings**: site text, contact details, socials, announcement bar

## Tech
Next.js 16 (App Router, Server Actions) · React 19 · Tailwind CSS 4 · Postgres · Nodemailer · QR codes generated on the server.

- **Database:** Postgres. In production that's **Neon** (set `DATABASE_URL`). Locally, if `DATABASE_URL` is empty, an embedded Postgres ([PGlite](https://pglite.dev)) is stored in `./data/pg`, so no setup is needed. Tables are created automatically on first use.
- **Images:** on Vercel, admin uploads go from the browser straight to **Vercel Blob** (`BLOB_READ_WRITE_TOKEN`). Locally they're saved in `./data/uploads`.

## Deploy on Vercel (recommended)

1. **Import the repo.** On [vercel.com/new](https://vercel.com/new), import `strictlynyigos`. Keep the defaults (framework: Next.js) and click **Deploy**. The first deploy builds fine. The site needs a database before it can show pages.
2. **Add the database.** Open the project's **Storage** tab, then **Create Database → Neon (Serverless Postgres)**. Choose region **Frankfurt (eu-central-1)**, since the app's functions run in Frankfurt (`vercel.json`), which is the closest region to Kampala. Connect it to the project for all environments. This sets `DATABASE_URL` automatically.
3. **Add image storage.** In **Storage**, choose **Create → Blob** and connect it to the project. This sets `BLOB_READ_WRITE_TOKEN`.
4. **Redeploy.** Go to **Deployments**, open the menu (⋯) on the latest deployment and choose **Redeploy**, so the new variables are picked up.
5. **Create your account.** Visit `https://YOUR-PROJECT.vercel.app/admin/setup`, create the admin account and leave **"Load starter content"** ticked. That's it: the site is live in demo-payment mode.

Then, when you're ready, go to **Settings → Environment Variables** (redeploy after any change):

| What | Variables |
|---|---|
| **Custom domain** | Add the domain under **Settings → Domains**, then set `SITE_URL=https://your-domain`. Until then, the `*.vercel.app` address is used for emails and payment redirects. |
| **Real payments** | Create a [Flutterwave](https://flutterwave.com/ug) account. Set `PAYMENTS_PROVIDER=flutterwave`, `FLW_SECRET_KEY` and `FLW_WEBHOOK_HASH`. In the Flutterwave dashboard, set the webhook URL to `https://YOUR-DOMAIN/api/payments/flutterwave/webhook` and use the same secret hash. Every payment is checked server-to-server (amount, currency and reference) before tickets are issued. |
| **Email** | Set `SMTP_HOST`, `SMTP_PORT` (587), `SMTP_USER`, `SMTP_PASS` and `MAIL_FROM`. Works with Brevo, Resend, Mailgun, Amazon SES, Zoho, etc. Until SMTP is set up, emails are only saved to the admin **Outbox**. |

Notes:
- Campaign emails are sent 5 at a time within one request (allowed up to 5 minutes), which is plenty for a few thousand subscribers. For much bigger lists, use your email provider's bulk tool with the subscriber CSV export.
- Neon's free tier sleeps when idle. The first visit after a quiet period takes about a second longer.
- To work locally against the live database, copy `DATABASE_URL` into `.env.local` (or run `vercel env pull .env.local`). `npm run seed` uses it too.

## Run locally

```bash
npm install
cp .env.example .env.local      # optional: everything works with the defaults
npm run seed                    # loads the Strictly Nyigos events & articles
# or: npm run seed:demo         # same, plus fake fans & orders so you can try the dashboard
npm run dev                     # http://localhost:3000
```

Open `/admin`. On the first visit it asks you to create the admin account. You can also set `ADMIN_EMAIL` / `ADMIN_PASSWORD` (and `ADMIN_NAME`) before running the seed and it will create the account for you.

You can also self-host anywhere that runs Node 20+ (`npm run build && npm start`). Point `DATABASE_URL` at any Postgres. Without Blob, uploads are stored in `DATA_DIR`, which needs a persistent disk.

## Content note
The past editions in the seed data come from public listings: Legends Lugogo (16 Aug 2025), Silo 15 (10 Dec 2025 and 30 Apr 2026), and *In the Jungle* at Nyungu Yamawe Forest Park (9–10 Oct 2026). **"Strictly Nyigos: December Edition" (12 Dec 2026) is a placeholder** so the ticket flow can be tried. Edit or delete it in `/admin/events` once the real date is announced. The images in `public/images` are AI-generated placeholders; replace them with real photos from the events.
