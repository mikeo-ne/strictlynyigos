/* STRICTLY NYIGOS — static site build (zero dependencies).
 * Usage: node build.js   →  renders ./public from ./src
 * Ordering guarantees:
 *   categories alphabetical · articles newest-first · releases by release date ·
 *   fresh-finds roster alphabetical · charts rank-ordered (Billboard-style)
 */
const fs = require('fs');
const path = require('path');
const content = require('./src/content');
const { buildArt } = require('./src/art');
const T = require('./src/templates');

const OUT = path.join(__dirname, 'public');
const w = (p, data) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, data); };

/* ---------------------------------------------------------------- prepare */
const cats = [...content.categories].sort((a, b) => a.name.localeCompare(b.name));
const catById = Object.fromEntries(cats.map((c) => [c.id, c]));
const articles = [...content.articles].sort((a, b) => b.date.localeCompare(a.date)); // latest first
const releases = [...content.releases].sort((a, b) => b.date.localeCompare(a.date)); // release order
const artists = [...content.artists].sort((a, b) => a.name.localeCompare(b.name));    // alphabetical
const editions = [...content.editions].sort((a, b) => b.date.localeCompare(a.date)); // latest first
const songs = content.songs;

const articleForEdition = (id) => articles.find((a) => a.edition === id);
const ctx = { songs, catById, articleForEdition };

/* ------------------------------------------------------------------ assets */
for (const art of buildArt(content)) w(path.join(OUT, 'assets/art', art.file), art.svg);
w(path.join(OUT, 'assets/css/style.css'), fs.readFileSync(path.join(__dirname, 'src/style.css')));
w(path.join(OUT, 'assets/js/site.js'), fs.readFileSync(path.join(__dirname, 'src/site.js')));

/* ------------------------------------------------------------------- home */
function home() {
  const r = T.root(0);
  const latestEdition = editions[0];
  const topSong = songs[latestEdition.chart[0].song];
  const top5 = latestEdition.chart.slice(0, 5).map((en) => {
    const s = songs[en.song];
    return `<li><span class="mini-rank">${en.rank}</span><img src="${T.artPath(s.art, 0)}" alt=""><a href="${r}articles/${articleForEdition(latestEdition.id).slug}/"><strong>${T.esc(s.title)}</strong> — ${T.esc(s.artist)}</a></li>`;
  }).join('');
  const tiles = cats.map((c) => {
    const count = c.id === 'fresh-finds' ? artists.length + ' artists · ' + articles.filter((a) => a.category === c.id).length + ' stories'
      : c.id === 'latest-releases' ? releases.length + ' releases'
      : c.id === 'songs-of-the-week' ? editions.length + ' charts'
      : articles.filter((a) => a.category === c.id).length + ' stories';
    return `<a class="cat-tile" href="${r}${c.id}/"><h3>${T.esc(c.name)}</h3><p>${T.esc(c.blurb)}</p><span class="count">${count.toUpperCase()}</span></a>`;
  }).join('');
  const body = `
  <section class="hero"><div class="wrap">
    <p class="hero-kicker">Kampala · Music · Events</p>
    <h1>Strictly the <em>nyigos</em>.<br>Nothing else.</h1>
    <p>${T.esc(content.site.description)}</p>
    <div class="hero-cta">
      <a class="btn btn-gold" href="${r}articles/${articleForEdition(latestEdition.id).slug}/">This week’s chart: ${T.esc(topSong.title)} is No. 1</a>
      <a class="btn btn-ghost" href="${r}songs-of-the-week/">Songs of the Week</a>
      <a class="btn btn-ghost" href="${r}events/">What’s on</a>
    </div>
  </div></section>
  <section class="sec"><div class="wrap">
    <div class="sec-head"><h2 class="sec-title">Browse by <span class="hl">category</span></h2></div>
    <div class="cat-strip">${tiles}</div>
  </div></section>
  <section class="sec"><div class="wrap">
    <div class="sec-head"><h2 class="sec-title">The <span class="hl">latest</span></h2><a class="sec-link" href="${r}articles/${articleForEdition(latestEdition.id).slug}/">Everything, newest first ↓</a></div>
    <div class="cards">${articles.slice(0, 6).map((a) => T.articleCard(a, 0, ctx)).join('')}</div>
  </div></section>
  <section class="sec"><div class="wrap">
    <div class="sec-head"><h2 class="sec-title">This week’s <span class="hl">top 5</span></h2><a class="sec-link" href="${r}articles/${articleForEdition(latestEdition.id).slug}/">Full interactive top 10 →</a></div>
    <div class="chart"><ul class="mini-chart">${top5}</ul>
    <p class="chart-legend">Chart of ${T.esc(latestEdition.week)} · tap through for the interactive Billboard-style board and the embedded Spotify playlist.</p></div>
  </div></section>
  <section class="sec"><div class="wrap">
    <div class="sec-head"><h2 class="sec-title">Latest <span class="hl">releases</span></h2><a class="sec-link" href="${r}latest-releases/">All releases, in release order →</a></div>
    <div class="releases">${releases.slice(0, 4).map((rel) => T.releaseRow(rel, 0)).join('')}</div>
  </div></section>`;
  return T.layout({ title: content.site.name + ' — ' + content.site.tagline, desc: content.site.description, depth: 0, body, og: r + 'assets/art/' + topSong.art + '.svg', ogAlt: 'Song of the week artwork', site: content.site, cats, playlist: content.PLAYLIST_URL });
}

/* --------------------------------------------------------------- category */
function categoryPage(c) {
  const r = T.root(1);
  const list = articles.filter((a) => a.category === c.id);
  let inner = '';
  if (c.id === 'fresh-finds') {
    inner += `<p class="note">One home, one category: Fresh Finds now includes every former Spotlight Artist — the whole roster we are backing, alphabetically, plus their stories.</p>
    <div class="sec" style="padding-top:26px"><div class="sec-head"><h2 class="sec-title">The <span class="hl">roster</span> (A–Z)</h2></div>
    <div class="artists">${artists.map((a) => T.artistCard(a, 1)).join('')}</div></div>`;
  }
  if (c.id === 'latest-releases') {
    inner += `<p class="note">Ordered by release date, newest first — every entry carries its cover artwork and streaming links.</p>
    <div class="releases" style="margin-top:22px">${releases.map((rel) => T.releaseRow(rel, 1)).join('')}</div>`;
  }
  if (c.id === 'songs-of-the-week') {
    inner += `<div class="cards" style="margin-top:22px">${editions.map((e) => T.editionCard(e, 1, ctx)).join('')}</div>
    <p class="embed-note" style="margin-top:18px">Every edition embeds the official playlist: <a href="${T.esc(content.PLAYLIST_URL)}" target="_blank" rel="noopener">open in Spotify ↗</a></p>`;
  }
  if (list.length) {
    inner += `<div class="sec" style="padding-top:30px"><div class="sec-head"><h2 class="sec-title">${c.id === 'latest-releases' ? 'Release <span class="hl">coverage</span>' : 'Stories, <span class="hl">latest first</span>'}</h2></div>
    <div class="cards">${list.map((a) => T.articleCard(a, 1, ctx)).join('')}</div></div>`;
  }
  const body = `<section class="page-head"><div class="wrap">
    <h1>${T.esc(c.name)}</h1><p>${T.esc(c.blurb)}</p></div></section>
    <section class="sec" style="padding-top:8px"><div class="wrap">${inner}</div></section>`;
  return T.layout({ title: c.name + ' — ' + content.site.name, desc: c.blurb, depth: 1, body, site: content.site, cats, playlist: content.PLAYLIST_URL });
}

/* ---------------------------------------------------------------- article */
function articlePage(a, idx) {
  const depth = 2;
  const cat = catById[a.category];
  const edition = a.edition ? editions.find((e) => e.id === a.edition) : null;
  const coverIsPortrait = a.cover.kind === 'img';
  let body = `<article>
  <header class="art-head"><div class="wrap">
    <p class="art-kicker">${T.chip(cat.name)}<time datetime="${a.date}">${T.fmtLong(a.date)}</time><span>·</span><span>${T.readTime(a.body)} min read</span></p>
    <h1>${T.esc(a.title)}</h1>
    <p class="art-stand">${T.esc(a.standfirst)}</p>
  </div></header>
  <div class="wrap">
    <figure class="art-cover${coverIsPortrait ? ' portrait contain' : ' contain'}">
      <img src="${T.coverPath(a.cover, depth)}" alt="${T.esc(T.coverAlt(a.cover, a))}">
      ${a.cover.caption ? `<figcaption>${T.esc(a.cover.caption)}</figcaption>` : ''}
    </figure>
  </div>
  <div class="wrap"><div class="art-body">
    ${a.body}
    ${a.facts ? T.factsHTML(a.facts) : ''}
    ${a.lineup ? T.lineupHTML(a.lineup) : ''}
    ${edition ? T.chartHTML(edition, depth, ctx) : ''}
    ${edition && edition.bubbling ? `<p class="credit">Bubbling under: ${edition.bubbling.map((id) => `<a href="${T.esc(songs[id].links.spotify)}" target="_blank" rel="noopener">${T.esc(songs[id].title)} — ${T.esc(songs[id].artist)}</a>`).join(' · ')}</p>` : ''}
    ${edition ? T.embedHTML(edition) : ''}
    ${a.gallery ? T.galleryHTML(a.gallery, depth) : ''}
    ${a.credit ? `<p class="credit">${T.esc(a.credit)}</p>` : ''}
  </div></div>
  <div class="wrap"><nav class="pn" aria-label="More articles">
    ${idx + 1 < articles.length ? `<a href="${T.root(depth)}articles/${articles[idx + 1].slug}/"><span class="k">← Older</span><span class="t">${T.esc(articles[idx + 1].title)}</span></a>` : '<span></span>'}
    ${idx - 1 >= 0 ? `<a class="next" href="${T.root(depth)}articles/${articles[idx - 1].slug}/"><span class="k">Newer →</span><span class="t">${T.esc(articles[idx - 1].title)}</span></a>` : '<span></span>'}
  </nav></div>
  </article>`;
  if (a.gallery) body += lightbox(a.gallery, depth);
  return T.layout({ title: a.title + ' — ' + content.site.name, desc: a.standfirst, depth, body, og: T.coverPath(a.cover, depth), ogAlt: T.coverAlt(a.cover, a), site: content.site, cats, playlist: content.PLAYLIST_URL });
}
const lightbox = T.lightboxHTML;

/* ------------------------------------------------------------------ write */
w(path.join(OUT, 'index.html'), home());
for (const c of cats) w(path.join(OUT, c.id, 'index.html'), categoryPage(c));
articles.forEach((a, i) => w(path.join(OUT, 'articles', a.slug, 'index.html'), articlePage(a, i)));

console.log('Built:',
  '\n  pages:', 1 + cats.length + articles.length,
  '\n  artworks:', buildArt(content).length,
  '\n  articles (latest first):', articles.map((a) => a.date + ' ' + a.slug).join('\n    '));
