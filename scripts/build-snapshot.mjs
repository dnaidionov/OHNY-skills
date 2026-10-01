// Builds data/lineup.json: festival.json + every per-site detail file, normalised and geocoded.
// Run:  npm run build:data            (geocodes new addresses; ~1 request/second, cached)
//       npm run build:data:nogeo      (skips geocoding; reuses cache only)
// Nominatim etiquette: 1 req/s, identifying User-Agent. Set NOMINATIM_CONTACT to a URL or email of yours.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeRecord } from '../src/core/normalize.js';
import { inNyc, haversineKm } from '../src/core/geo.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.FESTIVAL_BASE ?? 'https://ohny.org';
const OUT = join(ROOT, 'data', 'lineup.json');
const CACHE = join(ROOT, 'data', 'geocode-cache.json');
const noGeo = process.argv.includes('--no-geocode');
const UA = `ohny-unofficial-skill/0.1 (festival lineup geocoder${process.env.NOMINATIM_CONTACT ? `; ${process.env.NOMINATIM_CONTACT}` : ''})`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = async (p, fallback) => { try { return JSON.parse(await readFile(p, 'utf8')); } catch { return fallback; } };

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return { json: await res.json(), headers: res.headers };
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}

// ---- geocoding -----------------------------------------------------------------------
const cache = await readJson(CACHE, {});
let lastCall = 0;
async function nominatim(q) {
  if (q in cache) return cache[q];
  if (noGeo) return null;
  const wait = 1100 - (Date.now() - lastCall);
  if (wait > 0) await sleep(wait);
  lastCall = Date.now();
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=us&viewbox=-74.3,41.0,-73.65,40.45&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(String(res.status));
    const [hit] = await res.json();
    cache[q] = hit && inNyc(+hit.lat, +hit.lon) ? { lat: +hit.lat, lng: +hit.lon, label: hit.display_name } : null;
  } catch (e) {
    console.warn(`  geocode error for "${q}": ${e.message}`);
    return null; // don't cache failures
  }
  return cache[q];
}

// "610 Fifth Avenue, 7th Floor" -> "610 Fifth Avenue"; "67 West Street, 527" -> "67 West Street"
const stripUnit = (line) => line
  .replace(/,?\s*(suite|ste\.?|floor|fl\.?|\d+(st|nd|rd|th)\s+floor|building|bldg\.?|room|unit|dock|#)\b.*$/i, '')
  .replace(/,\s*[\dA-Z]{1,5}$/, '')
  .trim();

const COUNTY = { Manhattan: 'New York County', Brooklyn: 'Kings County', Queens: 'Queens County', Bronx: 'Bronx County', 'Staten Island': 'Richmond County' };
// Reject hits that Nominatim places in a different borough than the lineup says.
const inBorough = (hit, borough) => !borough || !COUNTY[borough] || !hit.label || !/ County,/.test(hit.label) || hit.label.includes(COUNTY[borough]);

async function geocode(site) {
  const a = site.address;
  if (a?.line1) {
    const lines = [...new Set([a.line1, stripUnit(a.line1)])];
    for (const line of lines) {
      const hit = await nominatim([line, a.city, a.state, a.zip?.slice(0, 5)].filter(Boolean).join(', '));
      if (hit && inBorough(hit, site.borough)) return { lat: hit.lat, lng: hit.lng, conf: 'address', src: 'nominatim' };
    }
  }
  const names = [site.name, site.name?.split(':')[0], site.partner?.split(',')[0]].filter(Boolean);
  for (const n of [...new Set(names)]) {
    const hit = await nominatim(`${n}, ${site.borough ?? ''}, New York`.replace(/, ,/g, ','));
    if (hit && inBorough(hit, site.borough)) return { lat: hit.lat, lng: hit.lng, conf: 'name', src: 'nominatim' };
  }
  return null;
}

// ---- build ---------------------------------------------------------------------------
console.log(`Fetching ${BASE}/data/festival.json ...`);
const { json: fest, headers } = await getJson(`${BASE}/data/festival.json`);
const records = fest.records;
console.log(`${records.length} records. Fetching detail files ...`);

const details = await pool(records, 4, async (r) => {
  try { return (await getJson(`${BASE}/data/${r.record_id}.json`)).json.data; }
  catch (e) { console.warn(`  detail failed for ${r.slug}: ${e.message}`); return null; }
});

const sites = records.map((r, i) => {
  const site = normalizeRecord({ ...r, ...(details[i] ?? {}) }, r.record_id);
  site.slug = r.slug;
  return site;
});

if (!noGeo) console.log('Geocoding (cached results are reused; new lookups take ~1s each) ...');
let n = 0;
for (const site of sites) {
  site.geo = await geocode(site);
  if (!noGeo && ++n % 25 === 0) { await writeFile(CACHE, JSON.stringify(cache, null, 1)); console.log(`  ${n}/${sites.length}`); }
}
await mkdir(dirname(CACHE), { recursive: true });
await writeFile(CACHE, JSON.stringify(cache, null, 1));

// Fallback for sites we couldn't pin down: centre of their neighbourhood, then borough.
const centroid = (list) => list.length && {
  lat: list.reduce((s, x) => s + x.geo.lat, 0) / list.length,
  lng: list.reduce((s, x) => s + x.geo.lng, 0) / list.length,
};
// Name lookups can land on a namesake elsewhere. Drop any that sit far from the median
// position of exact-address sites in the same neighbourhood.
const median = (xs) => { const a = [...xs].sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
for (const site of sites.filter((s) => s.geo?.conf === 'name')) {
  const pool = sites.filter((s) => s.geo?.conf === 'address' && s.neighborhood === site.neighborhood && s.borough === site.borough);
  if (pool.length < 3) continue;
  const ref = { lat: median(pool.map((s) => s.geo.lat)), lng: median(pool.map((s) => s.geo.lng)) };
  if (haversineKm(site.geo, ref) > 5) { console.log(`  rejected far name match: ${site.name}`); site.geo = null; }
}
const { overrides = {} } = await readJson(join(ROOT, 'data', 'geo-overrides.json'), {});
for (const site of sites) {
  const o = overrides[site.slug];
  if (!o) continue;
  site.geo = o.fallback ? null : { lat: o.lat, lng: o.lng, conf: 'address', src: 'manual' };
}
const located = sites.filter((s) => s.geo);
for (const site of sites.filter((s) => !s.geo)) {
  const zip = site.address?.zip?.slice(0, 5);
  const zipArea = zip && centroid(located.filter((s) => s.address?.zip?.slice(0, 5) === zip && s.geo.conf === 'address'));
  if (zipArea) { site.geo = { ...zipArea, conf: 'zip', src: 'centroid' }; continue; }
  const hood =centroid(located.filter((s) => s.neighborhood === site.neighborhood && s.borough === site.borough));
  const boro = centroid(located.filter((s) => s.borough === site.borough));
  if (hood) site.geo = { ...hood, conf: 'neighborhood', src: 'centroid' };
  else if (boro) site.geo = { ...boro, conf: 'borough', src: 'centroid' };
}

const stats = sites.reduce((m, s) => { const k = s.geo?.conf ?? 'none'; m[k] = (m[k] ?? 0) + 1; return m; }, {});
const out = {
  generated_at: new Date().toISOString(),
  source: { festival_json_last_modified: headers.get('last-modified'), etag: headers.get('etag'), total_records: records.length },
  geo_stats: stats,
  sites,
};
await writeFile(OUT, JSON.stringify(out));
console.log(`Wrote ${OUT}  (${sites.length} sites)  geo: ${JSON.stringify(stats)}`);
