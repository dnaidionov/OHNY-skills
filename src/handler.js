import { normalizeRecord } from './core/normalize.js';
import { mergeLive } from './core/lineup.js';
import { resolveNow, FESTIVAL, isFestivalDay, fromWallMinutes } from './core/time.js';
import { statusAt, statusLine } from './core/status.js';
import { nearby, search, card } from './core/search.js';
import { mapsLinks, haversineKm, walkMinutes } from './core/geo.js';
import { enrichSites } from './core/enrich.js';
import { policyFlags } from './core/policy.js';
import { handleMcp } from './mcp.js';

const LIVE_TTL_MS = 20_000;
let liveCache = { at: 0, base: '', data: null, lineup: null };

const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body, null, 1), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'cache-control': 'public, max-age=15',
    ...extra,
  },
});
const fail = (status, error, hint) => json({ error, hint }, status, { 'cache-control': 'no-store' });

const num = (v) => (v == null || v === '' || Number.isNaN(Number(v)) ? undefined : Number(v));
const clamp = (v, lo, hi, d) => Math.min(hi, Math.max(lo, v ?? d));

async function fetchJson(deps, url) {
  const res = await deps.fetchImpl(url, { cf: { cacheTtl: 30, cacheEverything: true } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

async function getLiveRecords(deps) {
  const t = Date.now();
  if (liveCache.data && liveCache.base === deps.base && t - liveCache.at < LIVE_TTL_MS) return liveCache.data;
  try {
    const j = await fetchJson(deps, `${deps.base}/data/festival.json`);
    if (!Array.isArray(j.records) || !j.records.length) throw new Error('unexpected festival.json shape');
    liveCache = { at: t, base: deps.base, data: { records: j.records, fetchedAt: new Date().toISOString() }, lineup: null };
    return liveCache.data;
  } catch (e) {
    return { records: null, error: String(e.message ?? e) };
  }
}

async function getLineup(deps) {
  const live = await getLiveRecords(deps);
  if (!live.records) {
    return {
      sites: deps.snapshot.sites, live: false, asOf: deps.snapshot.generated_at,
      changes: { added: [], removed: [], modified: [] },
      warning: 'Could not reach ohny.org just now; this is the saved copy, so last-minute changes may be missing.',
      upstreamError: live.error,
    };
  }
  // Merging 313 sites is the main CPU cost, so do it once per live refresh, not once per request.
  if (liveCache.lineup && liveCache.data === live) return liveCache.lineup;
  const { sites, changes } = mergeLive(deps.snapshot.sites, live.records);
  await enrichSites(sites, deps.snapshot.sites, deps);
  const lineup = { sites, live: true, asOf: live.fetchedAt, changes };
  if (liveCache.data === live) liveCache.lineup = lineup;
  return lineup;
}

function envelope(lineup, now, extra = {}) {
  const today = fromWallMinutes(now.abs).date;
  return {
    as_of: lineup.asOf,
    live: lineup.live,
    warning: lineup.warning,
    upstream_error: lineup.upstreamError,
    now: { new_york_time: now.wall, source: now.source, during_festival: isFestivalDay(today) },
    ...extra,
  };
}

function findSite(sites, key) {
  const k = String(key).toLowerCase();
  return sites.find((s) => s.slug?.toLowerCase() === k || s.id?.toLowerCase() === k);
}

export async function handle(request, deps) {
  deps = { fetchImpl: fetch, base: 'https://ohny.org', realNow: new Date(), ...deps };
  // Cloudflare throws "Illegal invocation" if fetch is called as a method of another object
  // (deps.fetchImpl(...)), so always call it as a plain function.
  const rawFetch = deps.fetchImpl;
  deps.fetchImpl = (...args) => rawFetch(...args);
  const url = new URL(request.url);
  // Also served under a path prefix on a custom domain (e.g. naidionov.com/ohny/skills/mcp).
  const prefix = deps.basePath ?? '/ohny/skills';
  if (url.pathname === prefix || url.pathname.startsWith(`${prefix}/`)) url.pathname = url.pathname.slice(prefix.length) || '/';
  const q = url.searchParams;
  if (url.pathname.replace(/\/+$/, '') === '/mcp') {
    // The connector: each tool call runs one of the /v1 routes below, in-process.
    return handleMcp(request, async (p) => {
      const res = await handle(new Request(new URL(p, url.origin), { method: 'GET' }), deps);
      return { ok: res.ok, text: await res.text() };
    });
  }
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET' } });
  }
  if (request.method !== 'GET') return fail(405, 'Only GET is supported.');

  let now;
  try { now = resolveNow(q.get('now'), deps.realNow); } catch (e) { return fail(400, e.message); }

  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (path === '/' || path === '/v1') {
    return json({
      name: 'OHNY helper (unofficial)',
      by: 'Dmitry Naidionov, https://naidionov.com',
      source: 'https://github.com/dnaidionov/OHNY-skills',
      install: { claude_one_tap: 'https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=Ask%20OHNY&connectorUrl=https%3A%2F%2Fnaidionov.com%2Fohny%2Fskills%2Fmcp', mcp_url: 'https://naidionov.com/ohny/skills/mcp' },
      festival: { dates: FESTIVAL.dates, timezone: FESTIVAL.tz },
      endpoints: {
        'GET /v1/meta': 'Freshness, counts, festival dates',
        'GET /v1/nearby?lat=&lng=&interests=&limit=3&offset=0': 'Closest sites that will be open when you arrive, matching interests (also near=<slug>, max_walk_min, radius_km, min_time_left_min, include_ticketed, borough, child_age, wheelchair=true, interests_mode=prefer|require, exclude=slug,slug)',
        'GET /v1/search?q=': 'Find sites by name, partner, neighborhood or topic',
        'GET /v1/site/<slug>': 'Full, freshly fetched details for one site',
        'GET /v1/changes': 'What changed on ohny.org since the saved copy (cancellations, new times, new sites)',
        'POST /mcp': 'MCP connector endpoint (Streamable HTTP) for Claude, ChatGPT and other MCP clients',
        'any request': 'Add now=2026-10-17T14:30 (New York time) to test as if it were another moment',
      },
    });
  }

  if (path === '/v1/meta') {
    const lineup = await getLineup(deps);
    return json(envelope(lineup, now, {
      snapshot_generated_at: deps.snapshot.generated_at,
      total_sites: lineup.sites.filter((s) => !s.removed).length,
      changes_since_snapshot: {
        added: lineup.changes.added.length, removed: lineup.changes.removed.length, modified: lineup.changes.modified.length,
      },
    }));
  }

  if (path === '/v1/changes') {
    const lineup = await getLineup(deps);
    return json(envelope(lineup, now, { changes: lineup.changes }));
  }

  if (path === '/v1/search') {
    const term = q.get('q');
    if (!term) return fail(400, 'Missing q.', 'e.g. /v1/search?q=grolier');
    const lineup = await getLineup(deps);
    return json(envelope(lineup, now, search(lineup.sites.filter((s) => !s.removed), {
      q: term, nowAbs: now.abs, limit: clamp(num(q.get('limit')), 1, 10, 5),
    })));
  }

  if (path === '/v1/nearby') {
    const lineup = await getLineup(deps);
    let lat = num(q.get('lat'));
    let suggested = [];
    let lng = num(q.get('lng'));
    const nearSlug = q.get('near');
    if (nearSlug) {
      const ref = findSite(lineup.sites, nearSlug);
      if (!ref?.geo) return fail(404, `No located site "${nearSlug}".`);
      ({ lat, lng } = ref.geo);
      suggested = ref.related ?? [];
    }
    if (lat == null || lng == null) {
      return fail(400, 'lat and lng (or near=<site slug>) are required.',
        'If the visitor shared no location, ask for a cross street or landmark, look up its coordinates, then call again.');
    }
    const result = nearby(lineup.sites, {
      lat, lng, nowAbs: now.abs,
      interests: q.get('interests') ?? '',
      suggested,
      childAge: num(q.get('child_age')),
      wheelchair: q.get('wheelchair') === 'true',
      interestsMode: q.get('interests_mode') === 'prefer' ? 'prefer' : 'require',
      limit: clamp(num(q.get('limit')), 1, 10, 3),
      offset: clamp(num(q.get('offset')), 0, 1000, 0),
      radiusKm: num(q.get('radius_km')),
      maxWalkMin: num(q.get('max_walk_min')),
      minRemainingMin: num(q.get('min_time_left_min')) ?? 10,
      arrivalAware: q.get('arrival_aware') !== 'false',
      includeTicketed: q.get('include_ticketed') !== 'false',
      closingSoonMin: num(q.get('closing_soon_min')),
      borough: q.get('borough') ?? undefined,
      exclude: (q.get('exclude') ?? '').split(',').filter(Boolean).concat(nearSlug ? [nearSlug] : []),
    });
    return json(envelope(lineup, now, result));
  }

  const siteMatch = /^\/v1\/site\/([^/]+)$/.exec(path);
  if (siteMatch) {
    const lineup = await getLineup(deps);
    const base = findSite(lineup.sites, decodeURIComponent(siteMatch[1]));
    if (!base) return fail(404, `Unknown site "${siteMatch[1]}".`, 'Use /v1/search?q= to find the right slug.');
    let site = base;
    let detailLive = false;
    if (!base.removed) {
      try {
        const d = await fetchJson(deps, `${deps.base}/data/${base.id}.json`);
        const fresh = normalizeRecord(d.data, base.id);
        site = { ...base };
        for (const [k, v] of Object.entries(fresh)) {
          if (v !== undefined && !(Array.isArray(v) && v.length === 0 && k !== 'windows')) site[k] = v;
        }
        site.geo = base.geo;
        detailLive = true;
      } catch { /* keep merged copy */ }
    }
    const st = statusAt(site, now.abs);
    const nearbyRelated = (site.related ?? []).map((slug) => findSite(lineup.sites, slug)).filter(Boolean)
      .map((s) => {
        const km = site.geo && s.geo ? haversineKm(site.geo, s.geo) : undefined;
        return card(s, statusAt(s, now.abs), km == null ? {} : { distance_km: Math.round(km * 10) / 10, walk_min: walkMinutes(km) });
      });
    return json(envelope(lineup, now, {
      detail_fetched_live: detailLive,
      site: {
        ...site,
        photo: site.photo,
        status: { ...st, line: statusLine(st) },
        geo: site.geo && { lat: site.geo.lat, lng: site.geo.lng, precision: site.geo.conf },
        maps: mapsLinks(site),
        heads_up: policyFlags(site, 8),
        related_sites: nearbyRelated,
        checkin: { record_id: site.id, slug: site.slug, name: site.name },
        official_page: `${deps.base}/place/${site.slug}`,
      },
    }));
  }

  return fail(404, 'Unknown route.', 'Try GET / for the list of endpoints.');
}

export const _resetCacheForTests = () => { liveCache = { at: 0, base: '', data: null, lineup: null }; };
