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
Next.js 16 (App Router, Server Actions) · React 19 · Tailwind CSS 4 · SQLite (better-sqlite3) · Nodemailer · QR codes generated on the server.
Everything is in one Node process with one SQLite file. No other services are needed.

## Getting started

```bash
npm install
cp .env.example .env.local      # then edit
npm run seed                    # loads the Strictly Nyigos events & articles
# or: npm run seed:demo         # same, plus fake fans & orders so you can try the dashboard
npm run build && npm start      # http://localhost:3000
```

Open `/admin`. On the first visit it asks you to create the admin account. You can also set `ADMIN_EMAIL` / `ADMIN_PASSWORD` before running the seed script and it will create the account for you.

Development: `npm run dev`.

## Going live

| What | How |
|---|---|
| **Real payments** | Create a [Flutterwave](https://flutterwave.com/ug) account. Set `PAYMENTS_PROVIDER=flutterwave`, `FLW_SECRET_KEY`, and `FLW_WEBHOOK_HASH`. In the Flutterwave dashboard, point the webhook to `https://YOUR-DOMAIN/api/payments/flutterwave/webhook`. Every payment is checked server-to-server (amount, currency and reference) before tickets are issued. |
| **Email** | Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`. Works with Brevo, Mailgun, Amazon SES, Zoho, Gmail (app password), etc. Until SMTP is set up, emails are only saved to the Outbox. |
| **Site URL** | Set `SITE_URL=https://your-domain` (used in emails and payment redirects). |
| **Hosting** | Any host that runs a long-lived Node server and has a persistent disk: a VPS, Railway, Render, Fly.io, etc. The SQLite database and uploaded images are stored in `DATA_DIR` (default `./data`), so **back up that folder**. Serverless hosts like Vercel are a poor fit unless you move to a hosted database. |

## Content note
The past editions in the seed data come from public listings: Legends Lugogo (16 Aug 2025), Silo 15 (10 Dec 2025 and 30 Apr 2026), and *In the Jungle* at Nyungu Yamawe Forest Park (9–10 Oct 2026). **"Strictly Nyigos: December Edition" (12 Dec 2026) is a placeholder** so the ticket flow can be tried. Edit or delete it in `/admin/events` once the real date is announced. The images in `public/images` are AI-generated placeholders; replace them with real photos from the events.
