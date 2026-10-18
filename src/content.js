/* STRICTLY NYIGOS — content database
 * Everything the site renders lives here. build.js turns this into static pages.
 * Ordering rules baked into the build:
 *  - categories are listed in ALPHABETICAL order everywhere
 *  - articles are listed in order of LATEST (newest first)
 *  - latest releases are listed in order of RELEASE DATE (newest first)
 *  - the fresh finds roster (incl. former Spotlight Artists) is alphabetical
 *  - songs of the week charts are ranked, Billboard-style
 */

const spq = (q) => 'https://open.spotify.com/search/' + encodeURIComponent(q);
const amq = (q) => 'https://music.apple.com/us/search?term=' + encodeURIComponent(q);
const links = (q) => ({ spotify: spq(q), apple: amq(q) });

const PLAYLIST_URL = 'https://open.spotify.com/playlist/1p7M4hsphFLrezmw9arXGs?si=OotRhuqtTfiopi-VyqSS1g';
const PLAYLIST_EMBED = 'https://open.spotify.com/embed/playlist/1p7M4hsphFLrezmw9arXGs?utm_source=generator&theme=0';

/* ---------------------------------------------------------------- categories */
/* Stored and rendered in alphabetical order. */
const categories = [
  { id: 'events', name: 'Events', blurb: 'Concerts, festivals and benefit nights — every listing carries its official artwork, ticket tiers and door times.' },
  { id: 'fresh-finds', name: 'Fresh Finds', blurb: 'One home for every artist we are backing — Fresh Finds and the former Spotlight Artists, merged into a single category.' },
  { id: 'industry', name: 'Industry', blurb: 'The business behind the music: promotion playbooks, platforms and the tools labels actually use.' },
  { id: 'latest-releases', name: 'Latest Releases', blurb: 'Singles, EPs and albums as they drop, ordered by release date with streaming links attached.' },
  { id: 'songs-of-the-week', name: 'Songs of the Week', blurb: 'Our weekly ranked chart — Billboard-style, interactive, and synced to the official Spotify playlist.' },
];

/* ------------------------------------------------------------ fresh finds */
/* Roster is alphabetical. Spotlight Artists now live here too. */
const artists = [
  { id: 'etania', name: 'Etania', tag: 'DJ · Producer', art: 'artist-etania',
    bio: 'The self-styled “Life of the Party” — a selector whose afro-house and amapiano sets refuse to let a room sit down.', links: links('Etania Uganda Life of the Party') },
  { id: 'king-avo', name: 'King Avo', tag: 'Artist · EP', art: 'artist-king-avo',
    bio: 'Street-pop storyteller with a hook-first pen. The “Baddest EP” era put his name on every playlist we run.', links: links('King Avo Baddest EP') },
  { id: 'kyle-simbwa', name: 'Kyle Simbwa', tag: 'Singer-Songwriter', art: 'artist-kyle-simbwa',
    bio: 'Folk-tinted afro-soul and a live voice that carries open fields. “Mvule” made him impossible to ignore this season.', links: links('Kyle Simbwa Mvule') },
  { id: 'tai-dai', name: 'Tai Dai', tag: 'Alt-Afro', art: 'artist-tai-dai',
    bio: 'Colour-outside-the-lines alt-afro with psychedelic guitar lines and dyed-slow melodies.', links: links('Tai Dai Dye Slow') },
  { id: 'timothy-code', name: 'Timothy Code', tag: 'Producer · DJ', art: 'artist-timothy-code',
    bio: 'Beat-maker fluent in log drums and 808s; his productions compile like clean, dangerous code.', links: links('Timothy Code Binary Love') },
  { id: 'tojo-sean-offixial', name: 'Tojo & Sean Offixial', tag: 'Duo', art: 'artist-tojo-sean-offixial',
    bio: 'A call-and-response duo whose “Offix Session” tapes turned desk-hour humour into dancefloor currency.', links: links('Tojo Sean Offixial Offix Session') },
  { id: 'viana-indi', name: 'Viana Indi', tag: 'Vocalist', art: 'artist-viana-indi',
    bio: 'Velvet-toned vocalist blending kadongo kamu warmth with modern R&B gloss.', links: links('Viana Indi Indi Girl') },
  { id: 'zonke-africa', name: 'Zonke Africa', tag: 'Afro-Soul Collective', art: 'artist-zonke-africa',
    bio: 'A live collective chasing one sound: every language of Kampala singing over the same groove.', links: links('Zonke Africa Sauti Za Kampala') },
];

/* ------------------------------------------------------------------- songs */
/* art = generated cover artwork id (also used by releases that share the title) */
const songs = {
  'ekibinja':        { title: 'Ekibinja', artist: 'King Saha', art: 'ekibinja', links: links('King Saha Ekibinja') },
  'life-of-the-party': { title: 'Life of the Party', artist: 'Etania', art: 'life-of-the-party', links: links('Etania Life of the Party') },
  'kampala-nights':  { title: 'Kampala Nights', artist: 'BNXN', art: 'kampala-nights', links: links('BNXN Kampala Nights') },
  'zaina':           { title: 'Zaina', artist: 'Aziz Azion', art: 'zaina', links: links('Aziz Azion Zaina') },
  'baddest':         { title: 'Baddest', artist: 'King Avo', art: 'baddest', links: links('King Avo Baddest') },
  'mvule':           { title: 'Mvule', artist: 'Kyle Simbwa', art: 'mvule', links: links('Kyle Simbwa Mvule') },
  'dye-slow':        { title: 'Dye Slow', artist: 'Tai Dai', art: 'dye-slow', links: links('Tai Dai Dye Slow') },
  'indi-girl':       { title: 'Indi Girl', artist: 'Viana Indi', art: 'indi-girl', links: links('Viana Indi Indi Girl') },
  'offix-session':   { title: 'Offix Session', artist: 'Tojo & Sean Offixial', art: 'offix-session', links: links('Tojo Sean Offixial Offix Session') },
  'sauti-za-kampala': { title: 'Sauti Za Kampala', artist: 'Zonke Africa', art: 'sauti-za-kampala', links: links('Zonke Africa Sauti Za Kampala') },
  'binary-love':     { title: 'Binary Love', artist: 'Timothy Code', art: 'binary-love', links: links('Timothy Code Binary Love') },
  'boss-lady':       { title: 'Boss Lady', artist: 'City Girl', art: 'boss-lady', links: links('City Girl Boss Lady') },
};

/* --------------------------------------------------------- latest releases */
/* The build sorts these by release date, newest first. */
const releases = [
  { title: 'Ekibinja', artist: 'King Saha', type: 'Single', date: '2026-10-16', art: 'ekibinja', links: links('King Saha Ekibinja') },
  { title: 'Life of the Party', artist: 'Etania', type: 'Single', date: '2026-10-15', art: 'life-of-the-party', links: links('Etania Life of the Party') },
  { title: 'Baddest EP', artist: 'King Avo', type: 'EP', date: '2026-10-09', art: 'baddest-ep',
    links: { spotify: spq('King Avo Baddest EP'), apple: amq('King Avo Baddest EP') },
    note: 'Six tracks of hook-first street pop — now linked on both Spotify and Apple Music.' },
  { title: 'Mvule', artist: 'Kyle Simbwa', type: 'Single', date: '2026-10-02', art: 'mvule', links: links('Kyle Simbwa Mvule') },
  { title: 'Offix Session', artist: 'Tojo & Sean Offixial', type: 'Single', date: '2026-09-26', art: 'offix-session', links: links('Tojo Sean Offixial Offix Session') },
  { title: 'Indi Girl', artist: 'Viana Indi', type: 'Single', date: '2026-09-19', art: 'indi-girl', links: links('Viana Indi Indi Girl') },
  { title: 'Sauti Za Kampala', artist: 'Zonke Africa', type: 'Single', date: '2026-09-12', art: 'sauti-za-kampala', links: links('Zonke Africa Sauti Za Kampala') },
  { title: 'Binary Love', artist: 'Timothy Code', type: 'Single', date: '2026-09-05', art: 'binary-love', links: links('Timothy Code Binary Love') },
  { title: 'Dye Slow', artist: 'Tai Dai', type: 'Single', date: '2026-08-28', art: 'dye-slow', links: links('Tai Dai Dye Slow') },
  { title: 'Zaina', artist: 'Aziz Azion', type: 'Single', date: '2026-08-21', art: 'zaina', links: links('Aziz Azion Zaina') },
  { title: 'Boss Lady', artist: 'City Girl', type: 'Single', date: '2026-08-14', art: 'boss-lady', links: links('City Girl Boss Lady') },
];

/* ---------------------------------------------------------------- editions */
/* Songs of the Week editions. chart is rank-ordered, Billboard-style:
 * lw = last week's position (0 = not on last week's chart), peak, wks = weeks on chart. */
const editions = [
  {
    id: 'sotw-2026-10-18', week: 'October 12 – 18, 2026', date: '2026-10-18',
    playlist: PLAYLIST_URL, embed: PLAYLIST_EMBED,
    chart: [
      { rank: 1, song: 'ekibinja', lw: 2, peak: 1, wks: 3 },
      { rank: 2, song: 'life-of-the-party', lw: 4, peak: 2, wks: 5 },
      { rank: 3, song: 'kampala-nights', lw: 0, peak: 3, wks: 1 },
      { rank: 4, song: 'zaina', lw: 1, peak: 1, wks: 7 },
      { rank: 5, song: 'baddest', lw: 6, peak: 5, wks: 4 },
      { rank: 6, song: 'mvule', lw: 3, peak: 3, wks: 6 },
      { rank: 7, song: 'dye-slow', lw: 9, peak: 7, wks: 2 },
      { rank: 8, song: 'indi-girl', lw: 5, peak: 5, wks: 8 },
      { rank: 9, song: 'offix-session', lw: 7, peak: 7, wks: 4 },
      { rank: 10, song: 'sauti-za-kampala', lw: 0, peak: 10, wks: 1 },
    ],
    bubbling: ['binary-love', 'boss-lady'],
  },
  {
    id: 'sotw-2026-10-11', week: 'October 5 – 11, 2026', date: '2026-10-11',
    playlist: PLAYLIST_URL, embed: PLAYLIST_EMBED,
    chart: [
      { rank: 1, song: 'zaina', lw: 1, peak: 1, wks: 6 },
      { rank: 2, song: 'ekibinja', lw: 5, peak: 2, wks: 2 },
      { rank: 3, song: 'mvule', lw: 2, peak: 2, wks: 5 },
      { rank: 4, song: 'life-of-the-party', lw: 8, peak: 4, wks: 4 },
      { rank: 5, song: 'indi-girl', lw: 4, peak: 4, wks: 7 },
      { rank: 6, song: 'baddest', lw: 3, peak: 3, wks: 3 },
      { rank: 7, song: 'offix-session', lw: 6, peak: 6, wks: 3 },
      { rank: 8, song: 'binary-love', lw: 0, peak: 8, wks: 1 },
      { rank: 9, song: 'dye-slow', lw: 10, peak: 9, wks: 1 },
      { rank: 10, song: 'boss-lady', lw: 0, peak: 10, wks: 1 },
    ],
    bubbling: ['kampala-nights', 'sauti-za-kampala'],
  },
];

/* ---------------------------------------------------------------- articles */
/* The build sorts these by date, newest first, on the home page and category pages. */
const articles = [
  {
    slug: 'songs-of-the-week-oct-12-18-2026', category: 'songs-of-the-week', date: '2026-10-18',
    title: 'Songs of the Week: King Saha’s “Ekibinja” Takes the Crown',
    standfirst: 'A coronation for Ekibinja, a top-three debut for BNXN’s “Kampala Nights”, and Etania still climbing — this is the chart for October 12–18, 2026.',
    cover: { kind: 'art', id: 'ekibinja' }, edition: 'sotw-2026-10-18',
    body: `
      <p>King Saha’s <strong>“Ekibinja”</strong> spends a second week inside the top two and then does the inevitable: it takes No. 1. The record is built like a rally song — a call, a response, and a drum pattern that behaves like a crowd — and this week the crowd won.</p>
      <p>Behind it, <strong>Etania’s “Life of the Party”</strong> climbs to No. 2, proof that a selector’s single can out-run pure vocalists when the hook is this functional. And the week’s biggest entrance belongs to <strong>BNXN</strong>, whose <strong>“Kampala Nights”</strong> debuts at No. 3 off the back of his Blankets & Wine headlining announcement — landings like this are exactly what a headline slot is supposed to do.</p>
      <p>Aziz Azion’s seven-week ruler <strong>“Zaina”</strong> slides to No. 4, King Avo’s <strong>“Baddest”</strong> re-enters the top five on the strength of the EP, and Zonke Africa’s <strong>“Sauti Za Kampala”</strong> debuts at No. 10 — the second new entry of the week.</p>
      <p>Every song below is one click away from playing, and the full week lives inside our official Spotify playlist, embedded at the bottom of this page. Tap any row for Spotify, or the Apple Music mark on the right of each row for the Apple side.</p>
    `,
  },
  {
    slug: 'rolex-festival-is-back-10-years', category: 'events', date: '2026-10-17',
    title: 'Rolex Festival Is Back: Ten Years of Eat, Explore, Compete, Vibe',
    standfirst: 'The Rolex Initiative’s flagship food festival returns to the Cricket Oval on November 29 for its 10th anniversary — ordinary passes at 20K, VIP at 50K.',
    cover: { kind: 'img', src: 'assets/img/event-rolex-festival-26.jpg', alt: 'Rolex Festival 10th anniversary poster — Eat, Explore, Compete, Vibe, 29th November, Cricket Oval' },
    body: `
      <p>Ten years in, the <strong>Rolex Festival</strong> has stopped being a novelty and become a calendar fixture. The Rolex Initiative has confirmed the anniversary edition for <strong>Saturday, November 29, 2026 at the Cricket Oval</strong>, under the only four words that have ever mattered here: <em>Eat. Explore. Compete. Vibe.</em></p>
      <p>The format is unchanged because it never needed changing: rows of rolex stands and street-food kitchens working at full tilt, eating competitions with genuine stakes, vendor villages, and a stage programme that runs from midday to close. The anniversary edition promises the largest competitor field yet, with regional champions qualifying through outreach rounds.</p>
      <p>Passes are deliberately kept democratic — <strong>UGX 20,000 for ordinary</strong> and <strong>UGX 50,000 for a VIP pass</strong> with fast-track entry and reserved seating near the competition arena.</p>
      <p>Our advice: arrive hungry, leave with a favourite vendor, and do not skip the finals round. For tickets and vendor bookings, call <strong>+256 758 939031</strong>.</p>
    `,
    facts: [
      ['Date', 'Saturday, 29th November 2026'],
      ['Venue', 'Cricket Oval, Kampala'],
      ['Passes', 'Ordinary 20K · VIP 50K'],
      ['Info', '+256 758 939031'],
    ],
  },
  {
    slug: 'rachel-magoola-60-still-shining', category: 'events', date: '2026-10-16',
    title: 'Rachel Magoola @60: Still Shining at Kingdom Kampala',
    standfirst: 'The beloved vocalist celebrates her 60th birthday with a full-scale concert on Friday, November 27 — gates at 3 PM, show at 8 PM, tickets from 100K.',
    cover: { kind: 'img', src: 'assets/img/event-rachel-magoola-60.webp', alt: 'Rachel Magoola @60 “Still Shining” poster — Friday 27 Nov 2026, Kingdom Kampala' },
    body: `
      <p><strong>Rachel Magoola turns 60</strong>, and the plan is not a dinner — it is a concert. <em>“Rachel Magoola @60: Still Shining”</em> lands on <strong>Friday, November 27, 2026 at Kingdom Kampala</strong>, with gates open at <strong>3 PM</strong> and the show starting at <strong>8 PM</strong>.</p>
      <p>Expect a career-length set: the kadongo kamu lineage she carries, the gospel-inflected ballads that made her a household voice, and the collaborations that introduced her to new generations. A live band, a choir, and a string of guest appearances are billed across the night.</p>
      <p>Ticketing is tiered for exactly the room you want: <strong>Platinum, a table of 8, at UGX 4M</strong>; <strong>Gold, a table of 4, at UGX 2M</strong>; <strong>Silver at UGX 200K</strong>; and <strong>Bronze at UGX 100K</strong> — prime seating and premium service attach to the table tiers.</p>
      <p>Tickets are available on <strong>Quicket</strong> and via MoMo ticketing on <strong>*165*20#</strong>. Reservations and enquiries: <strong>0772 559 462</strong> / <strong>0704 896 611</strong>. Backed by Uganda Tourism Board, Uganda Waragi, Pepsi, Milégé, Capital FM and Beat 96.3 FM, among others — a sponsor wall that tells you how big the night intends to be.</p>
    `,
    facts: [
      ['Date', 'Friday, 27th November 2026'],
      ['Venue', 'Kingdom Kampala'],
      ['Times', 'Gates 3 PM · Show 8 PM'],
      ['Tickets', 'Platinum (8) 4M · Gold (4) 2M · Silver 200K · Bronze 100K'],
    ],
  },
  {
    slug: 'blankets-and-wine-uganda-bnxn-lineup', category: 'events', date: '2026-10-15',
    title: 'Blankets & Wine Uganda Returns: BNXN Headlines with King Saha, Aziz Azion & More',
    standfirst: 'Nigeria’s BNXN tops the bill on December 5 at Lugogo Rugby Grounds, beside King Saha, Aziz Azion, Kyle Simbwa, Tojo & Sean Offixial and Tai Dai — with a ten-deep music policy behind them.',
    cover: { kind: 'art', id: 'bw-poster' },
    lineup: {
      stages: [
        ['Headliner', 'BNXN (Nigeria)'],
        ['Live bill', 'King Saha · Aziz Azion · Kyle Simbwa · Tojo & Sean Offixial · Tai Dai'],
      ],
      policy: ['Etania “Life of the Party”', 'DJ Dash', 'DJ Ssese', 'Selector Jay', 'Fem DJ', 'City Girl', 'Josh MC', 'Viana Indi', 'Timothy Code', 'Zonke Africa'],
    },
    body: `
      <p>Pack the blanket, chill the wine: <strong>Blankets & Wine Uganda</strong> is back, and the bill is the strongest the picnic has ever carried. <strong>BNXN</strong> flies in from Nigeria to headline on <strong>Saturday, December 5, 2026 at the Lugogo Rugby Grounds</strong>, joined by <strong>King Saha</strong>, <strong>Aziz Azion</strong>, <strong>Kyle Simbwa</strong>, <strong>Tojo &amp; Sean Offixial</strong> and <strong>Tai Dai</strong>.</p>
      <p>The headline booking is a statement. BNXN has spent two years turning features into events and events into tours; pairing him with King Saha on the same stage puts Kampala firmly on the circuit he now runs.</p>
      <p>Between sets, the day is scored by a <strong>music policy</strong> — the selectors and vocalists who keep the field moving: <strong>Etania “Life of the Party”</strong>, <strong>DJ Dash</strong>, <strong>DJ Ssese</strong>, <strong>Selector Jay</strong>, <strong>Fem DJ</strong>, <strong>City Girl</strong>, <strong>Josh MC</strong>, <strong>Viana Indi</strong>, <strong>Timothy Code</strong> and <strong>Zonke Africa</strong>. It is deliberately half-DJ, half-live: blankets do not suit a static crowd.</p>
      <p>The ethos is unchanged since the picnic began — bring your own blanket, bring your own wine, keep the field clean. Gates open at noon; the headliner closes the field at sunset. Tickets and table bundles go on sale through Quicket and partner outlets this week.</p>
    `,
    facts: [
      ['Date', 'Saturday, 5th December 2026'],
      ['Venue', 'Lugogo Rugby Grounds, Kampala'],
      ['Headliner', 'BNXN (Nigeria)'],
      ['Ethos', 'Bring your blanket · Bring your wine'],
    ],
  },
  {
    slug: 'kyle-simbwa-fresh-finds-to-blankets-and-wine', category: 'fresh-finds', date: '2026-10-14',
    title: 'From Fresh Finds to the Blankets & Wine Field: Kyle Simbwa’s Breakout Season',
    standfirst: 'Eight months ago we filed him under Fresh Finds. On December 5 he plays the Blankets & Wine field between Aziz Azion and the headliner. Here is how Kyle Simbwa got here.',
    cover: { kind: 'art', id: 'artist-kyle-simbwa' },
    body: `
      <p>When <strong>Kyle Simbwa</strong> first appeared in our Fresh Finds notes, the pitch was one line: <em>a singer-songwriter who writes like a carpenter — measure twice, one cut.</em> Eight months later he is on the Blankets & Wine Uganda bill, slotted between Aziz Azion and a Nigerian headliner, and the line reads like prophecy.</p>
      <p>The catalyst is <strong>“Mvule”</strong> — a slow-burning afro-folk record named for the hardwood tree, six weeks on our Songs of the Week chart and still top ten. It did what Fresh Finds records are supposed to do: travelled from campus playlists to radio rotation without losing its grain.</p>
      <p>Live is where the story closes the loop. Simbwa tours with a three-piece that swaps samples for fingers on strings, and Blankets & Wine — a daylight, seated-on-grass audience — is the exact room his dynamics were built for. Expect “Mvule” extended, expect new material road-tested on the field.</p>
      <p>Our Fresh Finds class keeps over-delivering: Etania scores the music policy the same day, and Timothy Code plays a selector slot. The category is not a list; it is a pipeline.</p>
    `,
  },
  {
    slug: 'etania-life-of-the-party', category: 'fresh-finds', date: '2026-10-13',
    title: 'Etania Is the Life of the Party — and She Is Bringing It to Blankets & Wine',
    standfirst: 'The DJ-producer whose single “Life of the Party” is climbing our chart tops the music policy at Blankets & Wine Uganda. A profile of the room-mover behind the tagline.',
    cover: { kind: 'art', id: 'artist-etania' },
    body: `
      <p>Every scene has one selector whose name works as a promise. In Kampala right now, that name is <strong>Etania</strong>, and the promise is the tagline she earned rather than chose: <em>life of the party</em>.</p>
      <p>Her sets are engineered escalation — afro house into amapiano into the originals she slips in at peak — and her production carries the same discipline. <strong>“Life of the Party”</strong>, released October 15, is her first single to chart on our Songs of the Week, and it is climbing: No. 4 last week, No. 2 this week, with the No. 1 slot in sight behind King Saha.</p>
      <p>On <strong>December 5</strong> she tops the <strong>music policy at Blankets & Wine Uganda</strong> — the selector crew that scores the field between live sets, alongside DJ Dash, DJ Ssese, Selector Jay, Fem DJ, City Girl, Josh MC, Viana Indi, Timothy Code and Zonke Africa. For a daylight picnic crowd, her brief is specific: keep blankets bouncing without ever tipping into a club set.</p>
      <p>“The blanket is the honest dancefloor,” she tells us. “Nobody is standing because the lights say so. If they are up, the record did it.” Watch for her sunset slot — it is the hinge of the whole day.</p>
    `,
  },
  {
    slug: 'kampala-jazz-soul-benefit-concert-26', category: 'events', date: '2026-10-12',
    title: 'The Kampala Jazz & Soul Benefit Concert ’26: The Afrigo Band Orchestra Experience',
    standfirst: 'One night, one orchestra, one cause: the Afrigo Band Orchestra Experience takes the UMA Multipurpose Exhibition Hall on October 24, with tables from 3M and tickets from 150K.',
    cover: { kind: 'img', src: 'assets/img/event-kampala-jazz-soul-26.png', alt: 'The Kampala Jazz & Soul Benefit Concert ’26 poster — The Afrigo Band Orchestra Experience, 24th Oct 2026, UMA Lugogo' },
    body: `
      <p>The <strong>Kampala Jazz &amp; Soul Benefit Concert ’26</strong> returns on <strong>Saturday, October 24, 2026</strong>, and this year the bill is a single, enormous idea: <strong>The Afrigo Band Orchestra Experience</strong> — Uganda’s longest-running band, expanded to full orchestral size for one benefit night at the <strong>UMA Multipurpose Exhibition Hall (UMA Lugogo)</strong>.</p>
      <p>The benefit angle is the point. Proceeds support the concert’s named charity fund, and the orchestra format means arrangements of Afrigo catalogue classics rebuilt for horns, strings and choir — the kind of versions that exist for exactly one night and then never again.</p>
      <p>Seating is table-first, the way a jazz benefit should be: <strong>Platinum table of 10 at UGX 8M</strong>, <strong>Gold table of 8 at 5M</strong>, <strong>Silver table of 8 at 3M</strong>, with <strong>single (silver) tickets at 250K</strong> and <strong>ordinary tickets at 150K</strong> for the rows behind the tables.</p>
      <p>Dress warm-adjacent, arrive early, and let the hall do its work. For tables and information: <strong>0756939553</strong> / <strong>0789459044</strong>.</p>
    `,
    facts: [
      ['Date', 'Saturday, 24th October 2026'],
      ['Venue', 'UMA Multipurpose Exhibition Hall (UMA Lugogo)'],
      ['Tables', 'Platinum (10) 8M · Gold (8) 5M · Silver (8) 3M'],
      ['Tickets', 'Single (Silver) 250K · Ordinary 150K'],
    ],
  },
  {
    slug: 'songs-of-the-week-oct-5-11-2026', category: 'songs-of-the-week', date: '2026-10-11',
    title: 'Songs of the Week: “Zaina” Holds No. 1 as Ekibinja Charges',
    standfirst: 'Aziz Azion’s “Zaina” spends a sixth week on top, King Saha’s “Ekibinja” leaps to No. 2, and Timothy Code debuts — the chart for October 5–11, 2026.',
    cover: { kind: 'art', id: 'zaina' }, edition: 'sotw-2026-10-11',
    body: `
      <p><strong>“Zaina”</strong> refuses to let go. Aziz Azion’s glide of a record spends a <strong>sixth week at No. 1</strong>, and the only thing currently threatening it is King Saha’s <strong>“Ekibinja”</strong>, which jumps from five to two on the strength of club rotation.</p>
      <p>Kyle Simbwa’s <strong>“Mvule”</strong> holds the top three for a fifth week — the Fresh Finds class keeping its chart seat — while Etania’s <strong>“Life of the Party”</strong> makes the week’s biggest move inside the top five, eight to four.</p>
      <p>New this week: <strong>Timothy Code’s “Binary Love”</strong> debuts at No. 8 and <strong>Tai Dai’s “Dye Slow”</strong> re-enters at No. 9. City Girl’s <strong>“Boss Lady”</strong> squeezes in at No. 10 on playlist adds alone.</p>
      <p>The full week, in order, is below — tap any row to play it — and the entire chart is sequenced in our Spotify playlist at the foot of this page.</p>
    `,
  },
  {
    slug: 'rules-for-a-successful-event-brand', category: 'events', date: '2026-10-10',
    title: 'Rules for a Successful Event Brand: Ideas Don’t Build Events. Execution Does.',
    standfirst: 'Promoter Yomex Paragon’s nine-slide playbook — from picking a date to keeping ego in check — is the clearest event-building document circulating right now. We break it down.',
    cover: { kind: 'img', src: 'assets/img/eventbrand-cover.jpg', alt: 'Rules For A Successful Event Brand — carousel cover by @yomex_paragon' },
    gallery: [
      { src: 'assets/img/eventbrand-cover.jpg', caption: 'Cover — “Ideas don’t build events. Execution does.” (@yomex_paragon)' },
      { src: 'assets/img/eventbrand-1.jpg', caption: '1. Pick the name. Pick the date. Start marketing.' },
      { src: 'assets/img/eventbrand-2.jpg', caption: '2. Make marketing personal.' },
      { src: 'assets/img/eventbrand-3.jpg', caption: '3. Don’t get offended.' },
      { src: 'assets/img/eventbrand-5.jpg', caption: '5. Never go cheap on production.' },
      { src: 'assets/img/eventbrand-6.jpg', caption: '6. Don’t maximize profit yet.' },
      { src: 'assets/img/eventbrand-7.jpg', caption: '7. Don’t wait for sponsors to come to you — go to all of them.' },
      { src: 'assets/img/eventbrand-8.jpg', caption: '8. After a successful show, the work begins.' },
      { src: 'assets/img/eventbrand-9.jpg', caption: '9. Ego is the enemy.' },
    ],
    credit: 'Slides: @yomex_paragon',
    body: `
      <p>Every promoter has a notebook. <strong>Yomex Paragon</strong> published his, and the nine-slide deck — <em>Rules For A Successful Event Brand</em> — reads less like motivation and more like an operating manual. The cover states the thesis plainly: <strong>ideas don’t build events; execution does.</strong> Swipe through the full deck above; here is the working version.</p>
      <p><strong>Decide, then market.</strong> Pick the name, pick the date, and give yourself one to two months from idea to market. Overthinking is a cost line. <strong>Make marketing personal.</strong> Leverage everyone around you — plead, bribe, treat. Your friends and their friends are your first customers, and they are also your first proof.</p>
      <p><strong>Don’t get offended.</strong> They skipped the first event? Or the second? That is not rejection, it is a list — keep inviting them. <strong>Never go cheap on production</strong>, especially on the first one: sound, light and stage are the memory your brand is stored in. <strong>Don’t maximize profit yet.</strong> Invest in the experience, build the brand and the community first; plant the seed before you harvest it.</p>
      <p><strong>Go to sponsors — all of them.</strong> “Sponsors will come after our great event” is a myth; a great event does not automatically attract money. Knock on every door and build the relationship before you need it. <strong>After a successful show, the work begins:</strong> accounting, structure, processes — the event is over, the business is just starting. And last, the rule that swallows promoters whole: <strong>ego is the enemy.</strong> Stay grounded, keep learning, stay teachable. The bigger you get, the easier it is to get distracted.</p>
      <p>File this next to our Blankets & Wine coverage this week: a picnic that has followed every one of these rules for a decade is what the other side of the playbook looks like.</p>
    `,
  },
  {
    slug: 'secret-sites-labels-use-to-make-artists-go-viral', category: 'industry', date: '2026-10-08',
    title: 'Music Labels Use These Secret Sites to Make Their Artists Go Viral',
    standfirst: 'MusoSoup, YouGrowPromo, SpaceLoud, Orion Promotion, MoonStrive Media — the five-platform promo stack behind most “organic” breakouts, decoded from @shay.mizz’s deck.',
    cover: { kind: 'img', src: 'assets/img/secretsites-cover.jpg', alt: '“Music labels use these secret sites to make their artists go viral” — carousel cover by @shay.mizz' },
    gallery: [
      { src: 'assets/img/secretsites-cover.jpg', caption: 'Cover — the secret-sites deck (@shay.mizz)' },
      { src: 'assets/img/secretsites-musosoup.jpg', caption: 'MusoSoup.com — submit once, pitch to many.' },
      { src: 'assets/img/secretsites-yougrowpromo.jpg', caption: 'YouGrowPromo.com — cross-platform campaign support.' },
      { src: 'assets/img/secretsites-spaceloud.jpg', caption: 'SpaceLoud.com — influencer promotion with analytics.' },
      { src: 'assets/img/secretsites-orionpromotion.jpg', caption: 'OrionPromotion.com — playlist pitching and real-time analytics.' },
      { src: 'assets/img/secretsites-moonstrivemedia.jpg', caption: 'MoonStriveMedia.com — organic playlist promotion, no bots.' },
    ],
    credit: 'Slides: @shay.mizz',
    body: `
      <p>There is a reason two unrelated artists can “blow up” in the same fortnight: breakouts are increasingly <em>campaigns</em>, not accidents. A deck by <strong>@shay.mizz</strong> lays out the five-platform stack most labels run behind the scenes. Swipe the slides above; here is what each tool actually does.</p>
      <p><strong>MusoSoup.com</strong> — submit your music once and get pitched to multiple blogs, curators and TikTokers at once, with a money-back guarantee if the campaign under-delivers. It is the top of the funnel: one upload, many doors.</p>
      <p><strong>YouGrowPromo.com</strong> — support for Spotify, TikTok, YouTube and Instagram under one campaign manager, also money-back guaranteed. This is the middle layer: paid-but-platform-safe growth tuned per network.</p>
      <p><strong>SpaceLoud.com</strong> — an influencer promotion marketplace with thousands of social creators and analytics for campaign tracking. You are buying reach with receipts: every creator post is measured.</p>
      <p><strong>OrionPromotion.com</strong> — expert playlist pitching plus social and influencer campaigns, with real-time analytics. The dashboard is the product: watch saves, skips and adds as they happen.</p>
      <p><strong>MoonStriveMedia.com</strong> — organic Spotify and YouTube playlist promotion from SEO-backed, high-traffic playlists. Explicitly no bots, which matters: fraudulent streaming is the one shortcut that gets catalogues removed.</p>
      <p>None of this replaces a good record — every platform here only amplifies what already works. But if you have ever wondered how a song you love found ten thousand strangers in a week, this stack is the honest answer.</p>
    `,
  },
];

module.exports = { site: {
  name: 'STRICTLY NYIGOS',
  tagline: 'Uganda’s music & events desk. Strictly the nyigos.',
  description: 'Songs of the Week, fresh finds, latest releases and every event worth buying a ticket for — from Kampala, for everywhere.',
}, categories, artists, songs, releases, editions, articles, PLAYLIST_URL, PLAYLIST_EMBED };
