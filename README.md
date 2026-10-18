# strictlynyigos

Uganda's music & events desk — strictly the nyigos. A zero-dependency static site:
songs of the week, fresh finds, latest releases, events and industry stories,
built from a single content file.

## Run it

```bash
node build.js                          # renders ./public from ./src
python3 -m http.server 8000 -d public  # serve the build locally
```

`public/` is committed, so it can be dropped on any static host (GitHub Pages, Netlify, …) as the site root.

## Structure

```
src/content.js   every article, release, artist, song and chart entry (the only file you edit for content)
src/art.js       deterministic SVG cover-artwork generator (songs, releases, artists, posters)
src/templates.js HTML templates (cards, Billboard-style chart, galleries, embeds)
src/style.css    site styles
src/site.js      interactions: chart filter, gallery lightbox, nav, scroll reveals
build.js         static site generator → public/
public/          generated site + committed event artwork (public/assets/img)
```

## Content rules baked into the build

- **Categories** are listed in alphabetical order everywhere (nav, home tiles, footer).
- **Articles** are listed in order of latest (newest first) on the home page and category pages.
- **Latest releases** are listed in order of release date (newest first), each with cover artwork and streaming links.
- **Fresh Finds** is one category for every artist we back — the former *Spotlight Artists* live here too; the roster is alphabetical.
- **Songs of the Week** is a Billboard-style top 10: rank, last week, peak, weeks on chart, movement arrows — interactive (live filter) and clickable (Spotify per row, Apple Music per row), with the week's playlist embedded in the article and the No. 1 song's artwork as the article cover and on every chart row.
- **Events** always carry their official artwork, plus ticket tiers and door times at a glance.

## Changelog — 2026-10-18 update

- Events now carry artwork: Kampala Jazz & Soul Benefit Concert '26, Rachel Magoola @60, Rolex Festival 10 Years, plus the Blankets & Wine Uganda announcement poster.
- Removed the Blankets & Wine **Kenya** edition; the Uganda edition owns the coverage.
- New: Blankets & Wine Uganda lineup announcement — BNXN (Nigeria) headlining with King Saha, Aziz Azion, Kyle Simbwa, Tojo & Sean Offixial and Tai Dai; music policy by Etania "Life of the Party", DJ Dash, DJ Ssese, Selector Jay, Fem DJ, City Girl, Josh MC, Viana Indi, Timothy Code and Zonke Africa.
- New: Etania profile ("Life of the Party") and a Fresh-Finds-to-B&W story on Kyle Simbwa.
- New: event articles built from the shared decks — "Rules for a Successful Event Brand" (@yomex_paragon) and "Music Labels Use These Secret Sites…" (@shay.mizz, Industry).
- Spotlight Artists merged into Fresh Finds (single category, alphabetical roster).
- King Avo's *Baddest EP* now links to both Spotify and Apple Music.
