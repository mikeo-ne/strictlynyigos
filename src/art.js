/* Deterministic cover-artwork generator.
 * Every song, release and fresh-find artist gets a designed square cover (SVG),
 * so charts, releases and rosters always carry artwork — no external fetches. */

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed) {
  let a = seed;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const PALETTES = [
  { bg1: '#101418', bg2: '#1d2b33', acc: '#17c3b2', ink: '#f4f1e8' },
  { bg1: '#1a0f14', bg2: '#3a1420', acc: '#f5c542', ink: '#fdf6e9' },
  { bg1: '#0e1a12', bg2: '#173324', acc: '#9ee493', ink: '#f2f7ee' },
  { bg1: '#141020', bg2: '#2a1b45', acc: '#c9a2ff', ink: '#f6f1ff' },
  { bg1: '#20140c', bg2: '#40261a', acc: '#ff9d5c', ink: '#fff3e8' },
  { bg1: '#0c1520', bg2: '#123049', acc: '#6fc7ff', ink: '#eef7ff' },
  { bg1: '#1c0f0f', bg2: '#471d1d', acc: '#ff6b6b', ink: '#fff0ee' },
  { bg1: '#12180f', bg2: '#2c3a14', acc: '#d7e34c', ink: '#f8fbe9' },
];

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function wrap(text, max) {
  const words = String(text).split(/\s+/); const lines = []; let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) { if (cur) lines.push(cur.trim()); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 4);
}

function bars(rand, acc, y0, h0, w) {
  let out = ''; const n = 42; const bw = w / n;
  for (let i = 0; i < n; i++) {
    const h = h0 * (0.18 + 0.82 * Math.abs(Math.sin(i * 0.55 + rand() * 2)) * (0.5 + rand() * 0.5));
    out += `<rect x="${(i * bw + bw * 0.22).toFixed(1)}" y="${(y0 - h / 2).toFixed(1)}" width="${(bw * 0.56).toFixed(1)}" height="${h.toFixed(1)}" rx="${(bw * 0.28).toFixed(1)}" fill="${acc}" opacity="${(0.35 + 0.55 * rand()).toFixed(2)}"/>`;
  }
  return out;
}

function vinyl(cx, cy, r, acc, ink, label) {
  let g = '';
  for (let i = 0; i < 6; i++) g += `<circle cx="${cx}" cy="${cy}" r="${(r - i * (r * 0.09)).toFixed(1)}" fill="none" stroke="${ink}" stroke-opacity="${0.07 + i * 0.02}" stroke-width="1.4"/>`;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#0b0c0e" stroke="${acc}" stroke-width="3"/>${g}
  <circle cx="${cx}" cy="${cy}" r="${(r * 0.34).toFixed(1)}" fill="${acc}"/><circle cx="${cx}" cy="${cy}" r="${(r * 0.06).toFixed(1)}" fill="#0b0c0e"/>`;
}

function mono(text) {
  const initials = String(text).split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('');
  return initials.toUpperCase();
}

/* Square song / release cover */
function coverArt({ id, title, artist, kind = 'song', palette }) {
  const p = palette || PALETTES[hash(id) % PALETTES.length];
  const rand = rng(hash(id + kind));
  const W = 800;
  const tLines = wrap(title.toUpperCase(), 14);
  const aLines = wrap(artist.toUpperCase(), 26);
  const maxLen = Math.max(...tLines.map((l) => l.length));
  const tSize = maxLen <= 8 ? 96 : maxLen <= 10 ? 84 : maxLen <= 12 ? 72 : 64;
  const startY = kind === 'release' ? 470 : 430;
  let deco = '';
  if (kind === 'release') {
    deco = vinyl(400, 250, 165, p.acc, p.ink);
  } else {
    deco = `<g transform="rotate(-6 400 210)">${bars(rand, p.acc, 200, 190, 800)}</g>`;
    deco += `<circle cx="${(120 + rand() * 560).toFixed(0)}" cy="${(90 + rand() * 120).toFixed(0)}" r="${(26 + rand() * 30).toFixed(0)}" fill="${p.acc}" opacity="0.85"/>`;
  }
  const titleSvg = tLines.map((l, i) => `<text x="60" y="${startY + i * (tSize + 6)}" font-family="Archivo Black, Impact, 'Arial Black', sans-serif" font-weight="900" font-size="${tSize}" fill="${p.ink}" letter-spacing="-2">${esc(l)}</text>`).join('');
  const artistSvg = aLines.map((l, i) => `<text x="62" y="${startY + tLines.length * (tSize + 6) + 34 + i * 34}" font-family="Inter, 'Helvetica Neue', Arial, sans-serif" font-weight="700" font-size="30" fill="${p.acc}" letter-spacing="4">${esc(l)}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" role="img" aria-label="${esc(title + ' — ' + artist)}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.bg1}"/><stop offset="1" stop-color="${p.bg2}"/></linearGradient></defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <rect x="0" y="0" width="800" height="800" fill="none" stroke="${p.acc}" stroke-opacity="0.35" stroke-width="2"/>
  ${deco}
  <rect x="62" y="${startY - Math.round(tSize * 0.72) - 20}" width="120" height="8" fill="${p.acc}"/>
  ${titleSvg}
  ${artistSvg}
  <text x="62" y="756" font-family="Inter, Arial, sans-serif" font-weight="800" font-size="20" fill="${p.ink}" opacity="0.55" letter-spacing="6">STRICTLY NYIGOS</text>
</svg>`;
}

/* Fresh-find artist card artwork: monogram + rings */
function artistArt({ id, name, palette }) {
  const p = palette || PALETTES[hash(id) % PALETTES.length];
  const rand = rng(hash(id + 'artist'));
  let rings = '';
  for (let i = 0; i < 5; i++) rings += `<circle cx="400" cy="360" r="${120 + i * 46}" fill="none" stroke="${p.acc}" stroke-opacity="${(0.5 - i * 0.08).toFixed(2)}" stroke-width="${(3 - i * 0.4).toFixed(1)}" stroke-dasharray="${i % 2 ? '2 14' : 'none'}"/>`;
  const dots = Array.from({ length: 26 }, () => `<circle cx="${(rand() * 800).toFixed(0)}" cy="${(rand() * 800).toFixed(0)}" r="${(1.5 + rand() * 3).toFixed(1)}" fill="${p.ink}" opacity="${(0.1 + rand() * 0.3).toFixed(2)}"/>`).join('');
  const m = mono(name);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" role="img" aria-label="${esc(name)}">
  <defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="${p.bg1}"/><stop offset="1" stop-color="${p.bg2}"/></linearGradient></defs>
  <rect width="800" height="800" fill="url(#g)"/>${dots}${rings}
  <circle cx="400" cy="360" r="118" fill="${p.acc}"/>
  <text x="400" y="404" text-anchor="middle" font-family="Archivo Black, Impact, 'Arial Black', sans-serif" font-weight="900" font-size="118" fill="${p.bg1}">${esc(m)}</text>
  <text x="400" y="640" text-anchor="middle" font-family="Archivo Black, Impact, 'Arial Black', sans-serif" font-weight="900" font-size="56" fill="${p.ink}" letter-spacing="1">${esc(name.toUpperCase())}</text>
  <text x="400" y="690" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="24" fill="${p.acc}" letter-spacing="8">FRESH FINDS</text>
</svg>`;
}

/* Blankets & Wine Uganda announcement poster */
function bwPoster() {
  let checks = '';
  for (let r = 0; r < 5; r++) for (let c = 0; c < 12; c++) {
    if ((r + c) % 2 === 0) checks += `<rect x="${c * 70}" y="${1010 + r * 48}" width="70" height="48" fill="#7a1f2b" opacity="${0.85 - r * 0.08}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 1250" width="840" height="1250" role="img" aria-label="Blankets &amp; Wine Uganda — BNXN headlines, December 5, Lugogo Rugby Grounds">
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3ead8"/><stop offset="1" stop-color="#e8d7b8"/></linearGradient></defs>
  <rect width="840" height="1250" fill="url(#sky)"/>
  <circle cx="420" cy="430" r="230" fill="#7a1f2b"/>
  <circle cx="420" cy="430" r="230" fill="none" stroke="#3d0f16" stroke-width="6" stroke-dasharray="4 10"/>
  <path d="M180 520 q60 -90 120 0 t120 0 t120 0 t120 0" fill="none" stroke="#f3ead8" stroke-width="10" stroke-linecap="round"/>
  <text x="420" y="180" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="800" font-size="34" fill="#3d0f16" letter-spacing="10">THE PICNIC RETURNS</text>
  <text x="420" y="300" text-anchor="middle" font-family="Archivo Black, Impact, 'Arial Black', sans-serif" font-weight="900" font-size="104" fill="#20140c" letter-spacing="-2">BLANKETS</text>
  <text x="420" y="392" text-anchor="middle" font-family="Archivo Black, Impact, 'Arial Black', sans-serif" font-weight="900" font-size="104" fill="#20140c" letter-spacing="-2">&amp; WINE</text>
  <text x="420" y="470" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="800" font-size="40" fill="#f3ead8" letter-spacing="14">UGANDA</text>
  <text x="420" y="760" text-anchor="middle" font-family="Archivo Black, Impact, 'Arial Black', sans-serif" font-weight="900" font-size="72" fill="#7a1f2b">BNXN HEADLINES</text>
  <text x="420" y="822" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="30" fill="#20140c" letter-spacing="2">KING SAHA · AZIZ AZION · KYLE SIMBWA</text>
  <text x="420" y="864" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="30" fill="#20140c" letter-spacing="2">TOJO &amp; SEAN OFFIXIAL · TAI DAI</text>
  <rect x="60" y="912" width="720" height="64" fill="#20140c"/>
  <text x="420" y="954" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="800" font-size="24" fill="#f5c542" letter-spacing="1.5">SAT 05 DEC 2026 · LUGOGO RUGBY GROUNDS</text>
  ${checks}
  <text x="420" y="1236" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="24" fill="#f3ead8" letter-spacing="6">BRING YOUR BLANKET · BRING YOUR WINE</text>
</svg>`;
}

function favicon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0d0f11"/><circle cx="32" cy="32" r="20" fill="none" stroke="#17c3b2" stroke-width="4"/><circle cx="32" cy="32" r="8" fill="#f5c542"/><circle cx="32" cy="32" r="2.6" fill="#0d0f11"/></svg>`;
}

/* Build the full artwork registry for a content set. */
function buildArt(content) {
  const arts = [];
  const paletteFor = (i) => PALETTES[i % PALETTES.length];
  let i = 0;
  for (const [id, s] of Object.entries(content.songs)) {
    arts.push({ id, file: id + '.svg', svg: coverArt({ id, title: s.title, artist: s.artist, kind: 'song', palette: paletteFor(i++) }) });
  }
  for (const r of content.releases) {
    if (!content.songs[ r.art ]) {
      arts.push({ id: r.art, file: r.art + '.svg', svg: coverArt({ id: r.art, title: r.title, artist: r.artist, kind: 'release', palette: paletteFor(i++) }) });
    }
  }
  for (const a of content.artists) {
    arts.push({ id: a.art, file: a.art + '.svg', svg: artistArt({ id: a.art, name: a.name, palette: paletteFor(i++) }) });
  }
  arts.push({ id: 'bw-poster', file: 'bw-poster.svg', svg: bwPoster() });
  arts.push({ id: 'favicon', file: 'favicon.svg', svg: favicon() });
  return arts;
}

module.exports = { buildArt, PALETTES };
