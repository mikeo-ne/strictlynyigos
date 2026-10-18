/* HTML templates for the static build. */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
const fmtLong = (iso) => { const [y, m, d] = iso.split('-').map(Number); const wd = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(Date.UTC(y, m - 1, d)).getUTCDay()]; return `${wd}, ${d} ${MONTHS[m - 1]} ${y}`; };

const root = (depth) => '../'.repeat(depth);
const artPath = (id, depth) => root(depth) + 'assets/art/' + id + '.svg';
const coverPath = (cover, depth) => (cover.kind === 'art' ? artPath(cover.id, depth) : root(depth) + cover.src);
const coverAlt = (cover, a) => (cover.alt || (a ? a.title : 'Cover artwork'));

const readTime = (html) => Math.max(2, Math.round(html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 200));

function layout({ title, desc, depth, body, og, ogAlt, site, cats, playlist }) {
  const r = root(depth);
  const nav = cats.map((c) => `<a class="nav-link" href="${r}${c.id}/">${esc(c.name)}</a>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="icon" type="image/svg+xml" href="${r}assets/art/favicon.svg">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="article">
${og ? `<meta property="og:image" content="${esc(og)}">${ogAlt ? `<meta property="og:image:alt" content="${esc(ogAlt)}">` : ''}` : ''}
<link rel="stylesheet" href="${r}assets/css/style.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-head">
  <div class="wrap head-in">
    <a class="brand" href="${r}">
      <span class="brand-mark" aria-hidden="true"></span>
      <span class="brand-text">${esc(site.name)}</span>
    </a>
    <nav class="nav" id="nav" aria-label="Categories">
      ${nav}
      <a class="nav-cta" href="${esc(playlist)}" target="_blank" rel="noopener">Playlist ↗</a>
    </nav>
    <button class="nav-toggle" aria-expanded="false" aria-controls="nav" aria-label="Menu"><span></span><span></span><span></span></button>
  </div>
</header>
<main id="main">${body}</main>
<footer class="site-foot">
  <div class="wrap foot-in">
    <div>
      <p class="foot-brand">${esc(site.name)}</p>
      <p class="foot-tag">${esc(site.tagline)}</p>
    </div>
    <nav class="foot-cats" aria-label="Categories">${cats.map((c) => `<a href="${r}${c.id}/">${esc(c.name)}</a>`).join('')}</nav>
    <p class="foot-note">© <span data-year></span> Strictly Nyigos · Kampala · Cover artworks are designed in-house; event artwork © respective promoters.</p>
  </div>
</footer>
<script src="${r}assets/js/site.js"></script>
</body>
</html>`;
}

const chip = (name) => `<span class="chip">${esc(name)}</span>`;

function articleCard(a, depth, ctx) {
  const cat = ctx.catById[a.category];
  return `<a class="card reveal" href="${root(depth)}articles/${a.slug}/">
    <span class="card-art"><img src="${coverPath(a.cover, depth)}" alt="${esc(coverAlt(a.cover, a))}" loading="lazy"></span>
    <span class="card-body">
      <span class="card-meta">${chip(cat.name)}<time datetime="${a.date}">${fmtDate(a.date)}</time></span>
      <span class="card-title">${esc(a.title)}</span>
      <span class="card-stand">${esc(a.standfirst)}</span>
    </span>
  </a>`;
}

function editionCard(e, depth, ctx) {
  const top = ctx.songs[e.chart[0].song];
  const art = ctx.articleForEdition(e.id);
  return `<a class="card reveal" href="${root(depth)}articles/${art.slug}/">
    <span class="card-art"><img src="${artPath(top.art, depth)}" alt="${esc('Song of the week artwork: ' + top.title + ' — ' + top.artist)}" loading="lazy"></span>
    <span class="card-body">
      <span class="card-meta">${chip('Songs of the Week')}<time datetime="${e.date}">${fmtDate(e.date)}</time></span>
      <span class="card-title">Chart: ${esc(e.week)}</span>
      <span class="card-stand">No. 1 — <strong>${esc(top.title)}</strong> by ${esc(top.artist)}. Tap for the full interactive top 10 and the Spotify playlist.</span>
    </span>
  </a>`;
}

function releaseRow(rel, depth) {
  return `<article class="release reveal">
    <img class="release-art" src="${artPath(rel.art, depth)}" alt="${esc(rel.title + ' — ' + rel.artist + ' cover artwork')}" loading="lazy">
    <div class="release-info">
      <h3>${esc(rel.title)}</h3>
      <p class="release-artist">${esc(rel.artist)} <span class="rtype">${esc(rel.type)}</span></p>
      <p class="release-date">Released ${fmtDate(rel.date)}</p>
      ${rel.note ? `<p class="release-note">${esc(rel.note)}</p>` : ''}
    </div>
    <div class="release-links">
      <a class="btn btn-spot" href="${esc(rel.links.spotify)}" target="_blank" rel="noopener">Spotify</a>
      <a class="btn btn-apple" href="${esc(rel.links.apple)}" target="_blank" rel="noopener">Apple Music</a>
    </div>
  </article>`;
}

function artistCard(a, depth) {
  return `<article class="artist reveal">
    <img src="${artPath(a.art, depth)}" alt="${esc(a.name + ' — Fresh Finds artwork')}" loading="lazy">
    <div class="artist-body">
      <h3>${esc(a.name)}</h3>
      <p class="artist-tag">${esc(a.tag)}</p>
      <p class="artist-bio">${esc(a.bio)}</p>
      <p class="artist-links"><a href="${esc(a.links.spotify)}" target="_blank" rel="noopener">Spotify</a><a href="${esc(a.links.apple)}" target="_blank" rel="noopener">Apple Music</a></p>
    </div>
  </article>`;
}

function mov(entry) {
  if (!entry.lw) return `<span class="mov new">NEW</span>`;
  const d = entry.lw - entry.rank;
  if (d > 0) return `<span class="mov up" aria-label="Up ${d}">▲ ${d}</span>`;
  if (d < 0) return `<span class="mov down" aria-label="Down ${-d}">▼ ${-d}</span>`;
  return `<span class="mov same" aria-label="No change">—</span>`;
}

function chartHTML(e, depth, ctx) {
  const rows = e.chart.map((en) => {
    const s = ctx.songs[en.song];
    return `<div class="chart-row${en.rank === 1 ? ' is-one' : ''}" data-search="${esc((s.title + ' ' + s.artist).toLowerCase())}">
      <a class="chart-main" href="${esc(s.links.spotify)}" target="_blank" rel="noopener" aria-label="${esc(s.title + ' by ' + s.artist + ' on Spotify, position ' + en.rank)}">
        <span class="chart-rank">${en.rank}</span>
        <img class="chart-art" src="${artPath(s.art, depth)}" alt="${esc(s.title + ' artwork')}" loading="lazy">
        <span class="chart-meta">
          <span class="chart-title">${esc(s.title)}${en.rank === 1 ? ' <em class="sotw-badge">Song of the Week</em>' : ''}</span>
          <span class="chart-artist">${esc(s.artist)}</span>
        </span>
        ${mov(en)}
      </a>
      <span class="chart-num" title="Last week">${en.lw || '–'}</span>
      <span class="chart-num" title="Peak position">${en.peak}</span>
      <span class="chart-num" title="Weeks on chart">${en.wks}</span>
      <a class="chart-alt" href="${esc(s.links.apple)}" target="_blank" rel="noopener" aria-label="${esc(s.title + ' on Apple Music')}"></a>
    </div>`;
  }).join('');
  return `<section class="chart" aria-label="Songs of the Week top 10">
    <div class="chart-tools">
      <h3 class="chart-heading">The Top 10 — ${esc(e.week)}</h3>
      <input class="chart-filter" type="search" placeholder="Filter the chart — artist or title…" aria-label="Filter the chart">
    </div>
    <div class="chart-head" aria-hidden="true"><span>This wk</span><span>Song</span><span></span><span>Last</span><span>Peak</span><span>Wks</span><span></span></div>
    ${rows}
    <p class="chart-legend">Tap a row to open the song on Spotify · the round mark on the right opens Apple Music · ▲▼ = movement, NEW = debut.</p>
  </section>`;
}

function galleryHTML(items, depth) {
  const figs = items.map((g, i) => `<figure class="gal-item" data-i="${i}">
      <img src="${root(depth)}${g.src}" alt="${esc(g.caption)}" loading="lazy">
      <figcaption>${esc(g.caption)}</figcaption>
    </figure>`).join('');
  return `<section class="gallery-wrap">
    <h3 class="sec-title">The deck, slide by slide</h3>
    <div class="gallery" data-gallery>${figs}</div>
    <p class="gal-hint">Scroll sideways · tap any slide to enlarge · arrow keys to move, Esc to close.</p>
  </section>`;
}

function lightboxHTML(items, depth) {
  return `<div class="lightbox" hidden aria-modal="true" role="dialog" aria-label="Image viewer">
    <button class="lb-close" aria-label="Close">×</button>
    <button class="lb-prev" aria-label="Previous">‹</button>
    <figure><img alt=""><figcaption></figcaption></figure>
    <button class="lb-next" aria-label="Next">›</button>
    <script type="application/json" data-lightbox-items>${JSON.stringify(items.map((g) => ({ src: root(depth) + g.src, caption: g.caption })))}</script>
  </div>`;
}

function factsHTML(facts) {
  return `<aside class="facts"><h3>At a glance</h3><dl>${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></aside>`;
}

function lineupHTML(l) {
  return `<aside class="lineup">
    <h3>The bill &amp; the music policy</h3>
    ${l.stages.map(([k, v]) => `<p class="lineup-row"><span class="lineup-k">${esc(k)}</span><span class="lineup-v">${esc(v)}</span></p>`).join('')}
    <p class="lineup-k lineup-policy-k">Music policy</p>
    <ul class="policy">${l.policy.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
  </aside>`;
}

function embedHTML(e) {
  return `<section class="embed-wrap">
    <h3 class="sec-title">Listen: the official Songs of the Week playlist</h3>
    <p class="embed-note">The whole week, in chart order — press play without leaving the page.</p>
    <iframe class="spotify-embed" src="${esc(e.embed)}" width="100%" height="450" frameborder="0" allowfullscreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="Songs of the Week — Spotify playlist"></iframe>
    <p class="embed-note"><a href="${esc(e.playlist)}" target="_blank" rel="noopener">Open the playlist in Spotify ↗</a></p>
  </section>`;
}

module.exports = { esc, fmtDate, fmtLong, root, artPath, coverPath, coverAlt, readTime, layout, chip, articleCard, editionCard, releaseRow, artistCard, chartHTML, galleryHTML, lightboxHTML, factsHTML, lineupHTML, embedHTML };
