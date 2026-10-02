// Builds the offline fallback bundled inside the skill (no server needed):
//   skills/ohny/assets/lineup.json             compact lineup for scripts/ohny_offline.py
//   skills/ohny/assets/interest-aliases.json   interest words -> tags (shared with the offline tool)
//   skills/ohny/assets/lineup/<area>.md        small geographic lists (<= ~45 sites, ~12 KB) the assistant can simply READ
//   skills/ohny/assets/lineup/index.md         which list covers which coordinates, and how to use them
//   skills/ohny/assets/lineup/neighborhoods.md neighborhood -> list(s), for when a visitor names a neighborhood
// The same files are served from GitHub raw, an independent host, for chats without the skill installed.
// Run: npm run build:fallback   (a test fails if the committed files are out of date)
import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { policyFlags } from '../src/core/policy.js';
import { INTEREST_ALIASES } from '../src/core/tags.js';
import { fmtTime } from '../src/core/time.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = join(ROOT, 'skills', 'ohny', 'assets');
export const PATHS = {
  lineup: join(ASSETS, 'lineup.json'),
  aliases: join(ASSETS, 'interest-aliases.json'),
  dir: join(ASSETS, 'lineup'),
};
export const RAW_BASE = 'https://raw.githubusercontent.com/dnaidionov/OHNY-skills/main/skills/ohny/assets/lineup';

const clip = (s, n) => (s && s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const r5 = (x) => Math.round(x * 1e5) / 1e5;
const slugify = (b) => String(b ?? 'other').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'other';
const dayName = (date) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });

const MAX_PER_FILE = 45;
function partition(list) {
  if (list.length <= MAX_PER_FILE) return [list];
  const lats = list.map((s) => s.geo.lat), lngs = list.map((s) => s.geo.lng);
  const latSpan = Math.max(...lats) - Math.min(...lats);
  const lngSpan = (Math.max(...lngs) - Math.min(...lngs)) * Math.cos((40.7 * Math.PI) / 180);   // degrees of longitude are shorter here
  const key = latSpan >= lngSpan ? (s) => s.geo.lat : (s) => s.geo.lng;
  const sorted = [...list].sort((a, b) => key(a) - key(b) || a.slug.localeCompare(b.slug));
  const mid = Math.ceil(sorted.length / 2);
  return [...partition(sorted.slice(0, mid)), ...partition(sorted.slice(mid))];
}

export function compactSite(s) {
  return {
    id: s.id, slug: s.slug, name: s.name, partner: s.partner, borough: s.borough, neighborhood: s.neighborhood,
    address: s.address?.line1 ? [s.address.line1, s.address.zip].filter(Boolean).join(' ') : undefined,
    geo: s.geo ? { lat: r5(s.geo.lat), lng: r5(s.geo.lng), conf: s.geo.conf } : undefined,
    access: s.access,
    windows: s.windows.map((w) => ({ kind: w.kind, date: w.date, start: w.start, end: w.end, ...(w.url ? { url: w.url } : {}) })),
    short: clip(s.short ?? s.description, 200),
    tags: s.tags, age: s.age, wheelchair: s.wheelchair, family: s.family ? true : undefined,
    heads_up: policyFlags(s, 4), related: s.related, website: s.websites?.[0]?.url,
  };
}

function whenText(s) {
  const open = s.windows.filter((w) => w.kind === 'open').map((w) => `${dayName(w.date)} ${fmtTime(w.start)}-${fmtTime(w.end)}`);
  const tours = s.windows.filter((w) => w.kind === 'session').map((w) => `${dayName(w.date)} ${fmtTime(w.start)}-${fmtTime(w.end)}`);
  return [open.join('; '), tours.length ? `TOURS (ticket): ${tours.join('; ')}` : ''].filter(Boolean).join(' | ') || 'times: see ohny.org';
}

function line(s) {
  const access = (s.access ?? []).join('/') || '?';
  const where = s.geo ? `${r5(s.geo.lat)},${r5(s.geo.lng)}${s.geo.conf === 'address' ? '' : '~'}` : 'no-location';
  const addr = s.address?.line1 ? [s.address.line1, s.address.zip].filter(Boolean).join(' ') : 'address given with ticket';
  return `- ${s.slug} | ${s.name} | ${s.neighborhood ?? ''} | ${addr} | ${where} | ${access} | ${whenText(s)} | tags: ${(s.tags ?? []).join(',')}${s.age && !/all ages/i.test(s.age) ? ` | ${s.age}` : ''} | ${clip(s.short ?? s.description ?? '', 90)} | LIVE: https://ohny.org/data/${s.id}.json`;
}

export async function buildFallback() {
  const snap = JSON.parse(await readFile(join(ROOT, 'data', 'lineup.json'), 'utf8'));
  const sites = snap.sites.filter((s) => s.slug);
  const asOf = snap.generated_at.slice(0, 16).replace('T', ' ');
  const files = {};

  files[PATHS.lineup] = `${JSON.stringify({ generated_at: snap.generated_at, festival: ['2026-10-16', '2026-10-17', '2026-10-18'], sites: sites.map(compactSite) })}\n`;
  files[PATHS.aliases] = `${JSON.stringify(INTEREST_ALIASES, null, 1)}\n`;

  // Small geographic cells: split each borough at the median along its longer axis until <= MAX_PER_FILE sites.
  const byBorough = {};
  for (const s of sites) (byBorough[s.geo ? (s.borough ?? 'Other') : 'Other'] ??= []).push(s);
  const cells = [];
  for (const [borough, list] of Object.entries(byBorough).sort()) {
    const parts = list.every((s) => s.geo) ? partition(list) : [list];
    parts
      .map((p) => ({ borough, list: p, center: p.every((s) => s.geo) ? p.reduce((a, s) => a + s.geo.lat, 0) / p.length : 0 }))
      .sort((a, b) => a.center - b.center)
      .forEach((c, i, arr) => cells.push({ ...c, file: `${slugify(borough)}${arr.length > 1 ? `-${i + 1}` : ''}.md` }));
  }
  const bbox = (list) => {
    const g = list.filter((s) => s.geo);
    if (!g.length) return null;
    const f = (k, fn) => r5(fn(...g.map((s) => s.geo[k])));
    return { lat: [f('lat', Math.min), f('lat', Math.max)], lng: [f('lng', Math.min), f('lng', Math.max)] };
  };
  const top = (list) => {
    const c = {};
    for (const s of list) if (s.neighborhood) c[s.neighborhood] = (c[s.neighborhood] ?? 0) + 1;
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([n]) => n).join(', ');
  };
  const index = [];
  for (const c of cells) {
    c.list.sort((a, b) => (a.neighborhood ?? '').localeCompare(b.neighborhood ?? '') || a.name.localeCompare(b.name));
    const box = bbox(c.list);
    const boxText = box ? `latitude ${box.lat[0]} to ${box.lat[1]}, longitude ${box.lng[0]} to ${box.lng[1]}` : 'no map position';
    index.push({ ...c, box, boxText, hoods: top(c.list) });
    files[join(PATHS.dir, c.file)] = `# OHNY Weekend 2026: ${c.borough}, area ${c.file.replace('.md', '')} (${c.list.length} sites)

Covers ${boxText}. Mostly: ${top(c.list)}.
SAVED COPY from ${asOf} UTC. OHNY changes things up to the last minute: cancellations, sold-out tours and new times will NOT show here. Before sending anyone to a site, open the LIVE link at the end of its line (a small file at ohny.org, always current).
Unofficial helper, not affiliated with Open House New York. Times are New York time.
Line format: slug | name | neighborhood | address | lat,lng (a trailing ~ means approximate position) | access | when | tags | short description | LIVE link
"when": drop-in hours are open without a ticket; TOURS need a ticket for that time slot.

${c.list.map(line).join('\n')}
`;
  }

  const hoodFiles = {};
  for (const c of index) for (const s of c.list) if (s.neighborhood) (hoodFiles[`${s.neighborhood} (${c.borough})`] ??= new Set()).add(c.file);
  files[join(PATHS.dir, 'neighborhoods.md')] = `# OHNY Weekend 2026: neighborhood -> list file(s)

Use this when the visitor names a neighborhood. Find the neighborhood below, then open the matching exact address from this legend (some chat apps only open web addresses written out in full; in an installed skill use the same file name under assets/lineup/):
${index.map((i) => `- ${i.file}: ${RAW_BASE}/${i.file}`).join('\n')}

Neighborhoods:
${Object.entries(hoodFiles).sort().map(([h, f]) => `- ${h}: ${[...f].join(', ')}`).join('\n')}
`;

  files[join(PATHS.dir, 'index.md')] = `# OHNY Weekend 2026: offline lineup lists

Use these when the live helper is unreachable. They are a SAVED COPY from ${asOf} UTC (not live). Each list is small (about 3,000 tokens): open only the one or two that cover where the visitor is, never all of them.

Lists (pick by the visitor's coordinates; if they are near an edge, open the neighbouring area too). Open the exact addresses below: some chat apps only open web addresses that are written out in full, so do not build them yourself.
${index.map((i) => `- ${i.file} | ${i.borough} | ${i.list.length} sites | ${i.boxText} | mostly ${i.hoods} | ${RAW_BASE}/${i.file}`).join('\n')}

If the visitor names a neighborhood instead of coordinates, open ${RAW_BASE}/neighborhoods.md

How to use:
1. Pick candidates by distance, interests (tags) and the times in the "when" column. "Open now" means the current New York time falls inside a listed drop-in window, or inside a tour slot (tours need a ticket).
2. Use the lat,lng to judge walking distance (about 12 minutes per kilometre in a straight line, plus a third for street grids; positions marked ~ are approximate).
3. Check the chosen site live before sending anyone: open the LIVE link at the end of its line. It shows the site's current status (access_type: Drop-In, Ticketed, Sold Out, Canceled) and times, and is a small file, always current.
4. Say plainly that you are working from a saved copy.
`;
  return files;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const files = await buildFallback();
  await mkdir(PATHS.dir, { recursive: true });
  for (const name of await readdir(PATHS.dir)) {                       // drop lists from older layouts
    const full = join(PATHS.dir, name);
    if (name.endsWith('.md') && !(full in files)) await rm(full);
  }
  for (const [path, text] of Object.entries(files)) await writeFile(path, text);
  console.log(`Wrote ${Object.keys(files).length} fallback files under skills/ohny/assets (lineup.json ${(files[PATHS.lineup].length / 1024).toFixed(0)} KB)`);
}
