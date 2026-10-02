// Builds the offline fallback bundled inside the skill (no server needed):
//   skills/ohny/assets/lineup.json             compact lineup for scripts/ohny_offline.py
//   skills/ohny/assets/interest-aliases.json   interest words -> tags (shared with the offline tool)
//   skills/ohny/assets/lineup/<borough>.md     compact lists the assistant can simply READ
//   skills/ohny/assets/lineup/index.md         how to use them
// The same files are served from GitHub raw, an independent host, for chats without the skill installed.
// Run: npm run build:fallback   (a test fails if the committed files are out of date)
import { readFile, writeFile, mkdir } from 'node:fs/promises';
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
  return `- ${s.slug} (${s.id}) | ${s.name} | ${s.neighborhood ?? ''} | ${addr} | ${where} | ${access} | ${whenText(s)} | tags: ${(s.tags ?? []).join(',')}${s.age && !/all ages/i.test(s.age) ? ` | ${s.age}` : ''} | ${clip(s.short ?? s.description ?? '', 110)}`;
}

export async function buildFallback() {
  const snap = JSON.parse(await readFile(join(ROOT, 'data', 'lineup.json'), 'utf8'));
  const sites = snap.sites.filter((s) => s.slug);
  const asOf = snap.generated_at.slice(0, 16).replace('T', ' ');
  const files = {};

  files[PATHS.lineup] = `${JSON.stringify({ generated_at: snap.generated_at, festival: ['2026-10-16', '2026-10-17', '2026-10-18'], sites: sites.map(compactSite) })}\n`;
  files[PATHS.aliases] = `${JSON.stringify(INTEREST_ALIASES, null, 1)}\n`;

  const byBorough = {};
  for (const s of sites) (byBorough[s.borough ?? 'Other'] ??= []).push(s);
  const index = [];
  for (const [borough, list] of Object.entries(byBorough).sort()) {
    list.sort((a, b) => (a.neighborhood ?? '').localeCompare(b.neighborhood ?? '') || a.name.localeCompare(b.name));
    const file = `${slugify(borough)}.md`;
    index.push({ borough, file, count: list.length });
    files[join(PATHS.dir, file)] = `# OHNY Weekend 2026: ${borough} (${list.length} sites)

SAVED COPY from ${asOf} UTC. OHNY changes things up to the last minute: cancellations, sold-out tours and new times will NOT show here. Before sending anyone to a site, check its live record: https://ohny.org/data/<id>.json (the id is in brackets below; small file) or https://ohny.org/place/<slug>.
Unofficial helper, not affiliated with Open House New York. Times are New York time.
Line format: slug (id) | name | neighborhood | address | lat,lng (a trailing ~ means approximate position) | access | when | tags | short description
"when": drop-in hours are open without a ticket; TOURS need a ticket for that time slot.

${list.map(line).join('\n')}
`;
  }
  files[join(PATHS.dir, 'index.md')] = `# OHNY Weekend 2026: offline lineup lists

Use these when the live helper is unreachable. They are a SAVED COPY from ${asOf} UTC (not live).

Files (read only the borough(s) you need):
${index.map((i) => `- ${i.file}: ${i.borough}, ${i.count} sites. Raw link: ${RAW_BASE}/${i.file}`).join('\n')}

How to use:
1. Pick candidates by neighborhood, interests (tags) and the times in the "when" column. "Open now" means the current New York time falls inside a listed drop-in window, or inside a tour slot (tours need a ticket).
2. Use the lat,lng to judge walking distance (about 12 minutes per kilometre in a straight line plus a third for street grids; positions marked ~ are approximate).
3. Check the chosen site live before sending anyone: https://ohny.org/data/<id>.json shows its current status (access_type: Drop-In, Ticketed, Sold Out, Canceled) and times.
4. Say plainly that you are working from a saved copy.
`;
  return files;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const files = await buildFallback();
  await mkdir(PATHS.dir, { recursive: true });
  for (const [path, text] of Object.entries(files)) await writeFile(path, text);
  console.log(`Wrote ${Object.keys(files).length} fallback files under skills/ohny/assets (lineup.json ${(files[PATHS.lineup].length / 1024).toFixed(0)} KB)`);
}
