import { normalizeRecord } from './normalize.js';
import { inNyc } from './geo.js';

// Sites the saved snapshot can't fully describe: added after it was built, or moved to a new address.
// We (1) pull their live detail file for the description, and (2) give them a map position:
// exact via a cached address lookup if possible, otherwise the centre of their neighbourhood.

const detailMemo = new Map();   // id -> { at, fresh }
const geoMemo = new Map();      // query -> { at, hit }
const DETAIL_TTL = 60_000;
const GEO_TTL = 6 * 3600_000;
const MAX_LOOKUPS = 5;

export const _resetEnrichMemoForTests = () => { detailMemo.clear(); geoMemo.clear(); };

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Centre of the exact-address sites in the same neighbourhood, else borough. */
export function fallbackGeo(site, knownSites) {
  const exact = knownSites.filter((s) => s.geo?.conf === 'address');
  const pick = (list) => list.length ? { lat: mean(list.map((s) => s.geo.lat)), lng: mean(list.map((s) => s.geo.lng)) } : null;
  const hood = pick(exact.filter((s) => s.neighborhood && s.neighborhood === site.neighborhood && s.borough === site.borough));
  if (hood) return { ...hood, conf: 'neighborhood', src: 'centroid' };
  const boro = pick(exact.filter((s) => s.borough && s.borough === site.borough));
  return boro ? { ...boro, conf: 'borough', src: 'centroid' } : null;
}

async function lookup(deps, site) {
  const a = site.address;
  if (!a?.line1) return null;
  const q = [a.line1, a.city, a.state, a.zip?.slice(0, 5)].filter(Boolean).join(', ');
  const hit = geoMemo.get(q);
  if (hit && Date.now() - hit.at < GEO_TTL) return hit.value;
  try {
    const res = await deps.fetchImpl(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=us&viewbox=-74.3,41.0,-73.65,40.45&q=${encodeURIComponent(q)}`,
      { headers: { 'User-Agent': 'ohny-unofficial-skill/0.1 (live lookup for late-added festival sites)' }, cf: { cacheTtl: 86400, cacheEverything: true } },
    );
    if (!res.ok) throw new Error(String(res.status));
    const [h] = await res.json();
    const value = h && inNyc(+h.lat, +h.lon) ? { lat: +h.lat, lng: +h.lon, conf: 'address', src: 'nominatim-live' } : null;
    geoMemo.set(q, { at: Date.now(), value });
    return value;
  } catch {
    return null;
  }
}

async function freshDetail(deps, site) {
  const m = detailMemo.get(site.id);
  if (m && Date.now() - m.at < DETAIL_TTL) return m.fresh;
  try {
    const res = await deps.fetchImpl(`${deps.base}/data/${site.id}.json`, { cf: { cacheTtl: 30, cacheEverything: true } });
    if (!res.ok) throw new Error(String(res.status));
    const fresh = normalizeRecord((await res.json()).data, site.id);
    detailMemo.set(site.id, { at: Date.now(), fresh });
    return fresh;
  } catch {
    return null;
  }
}

/** Mutates `sites` in place. `knownSites` are the snapshot sites with trustworthy positions. */
export async function enrichSites(sites, knownSites, deps) {
  const todo = sites.filter((s) => (s.is_new || !s.geo) && !s.removed);
  let lookups = 0;
  for (const site of todo) {
    if (site.is_new) {
      const fresh = await freshDetail(deps, site);
      if (fresh) {
        for (const [k, v] of Object.entries(fresh)) {
          if (v !== undefined && !(Array.isArray(v) && v.length === 0) && k !== 'windows' && k !== 'access') site[k] = v;
        }
        // keep ticket urls from the detail file on live windows
        site.windows = site.windows.map((w) => {
          const m = fresh.windows.find((f) => f.kind === w.kind && f.date === w.date && f.start === w.start);
          return m?.url ? { ...w, url: m.url } : w;
        });
      }
    }
    if (!site.geo || site.geo_stale) {
      let g = null;
      if (site.address?.line1 && lookups < MAX_LOOKUPS) { lookups++; g = await lookup(deps, site); }
      site.geo = g ?? fallbackGeo(site, knownSites) ?? undefined;
      site.geo_note = g ? 'looked up live' : 'estimated from neighborhood (new or moved site)';
    }
  }
  return sites;
}
