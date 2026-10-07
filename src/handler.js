import { normalizeRecord } from './core/normalize.js';
import { mergeLive } from './core/lineup.js';
import { resolveNow, FESTIVAL, isFestivalDay, fromWallMinutes, phaseAt } from './core/time.js';
import { statusAt, statusLine } from './core/status.js';
import { nearby, search, card } from './core/search.js';
import { mapsLinks, haversineKm, walkMinutes } from './core/geo.js';
import { enrichSites } from './core/enrich.js';
import { policyFlags } from './core/policy.js';
import { handleMcp } from './mcp.js';
import { parseSpecs, resolveTickets, checkPlan, TICKET_BUFFER_MIN, DEFAULT_STAY_MIN, NEARBY_MIN_STAY_MIN } from './core/tickets.js';
import { renderIndex, renderChanges } from './feed.js';
import { planDay } from './core/plan.js';
import { planText, nearbyText, searchText } from './text.js';
import { landingHtml } from './landing.js';
import { ICON_SVG } from './icon.js';
import { STANDALONE } from './standalone-data.js';
import { ICON_PNG_512, ICON_PNG_48, FAVICON_ICO } from './icon-data.js';

const b64bytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

const ICONS = {
  '/icon.svg': ['image/svg+xml', ICON_SVG], '/favicon.svg': ['image/svg+xml', ICON_SVG],
  '/icon.png': ['image/png', b64bytes(ICON_PNG_512)], '/favicon.png': ['image/png', b64bytes(ICON_PNG_48)],
  '/favicon.ico': ['image/x-icon', b64bytes(FAVICON_ICO)],
};

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
const asText = (body) => new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=15', 'x-content-type-options': 'nosniff' } });
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
  // HEAD is GET without the body (some page fetchers probe with it before reading).
  if (request.method === 'HEAD') {
    const res = await handle(new Request(request.url, { method: 'GET', headers: request.headers }), deps);
    return new Response(null, { status: res.status, headers: res.headers });
  }
  deps = { fetchImpl: fetch, base: 'https://ohny.org', realNow: new Date(), ...deps };
  // Cloudflare throws "Illegal invocation" if fetch is called as a method of another object
  // (deps.fetchImpl(...)), so always call it as a plain function.
  const rawFetch = deps.fetchImpl;
  deps.fetchImpl = (...args) => rawFetch(...args);
  const url = new URL(request.url);
  // Also served under a path prefix on a custom domain (e.g. naidionov.com/ohny/skills/mcp).
  const prefix = deps.basePath ?? '/ohny/skills';
  const mounted = url.pathname === prefix || url.pathname.startsWith(`${prefix}/`);
  if (mounted) url.pathname = url.pathname.slice(prefix.length) || '/';
  const q = url.searchParams;
  if (url.pathname.replace(/\/+$/, '') === '/mcp') {
    // The connector: each tool call runs one of the /v1 routes below, in-process.
    return handleMcp(request, async (p) => {
      const res = await handle(new Request(new URL(p, url.origin), { method: 'GET' }), deps);
      return { ok: res.ok, text: await res.text() };
    }, `${url.origin}${mounted ? prefix : ''}`, phaseAt(deps.realNow));
  }
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET' } });
  }
  if (request.method !== 'GET') return fail(405, 'Only GET is supported.');

  let now;
  try { now = resolveNow(q.get('now'), deps.realNow); } catch (e) { return fail(400, e.message); }

  const path = url.pathname.replace(/\/+$/, '') || '/';

  // Connector icon and favicons (same artwork). Static, so cache hard.
  if (ICONS[path]) {
    return new Response(ICONS[path][1], {
      headers: { 'content-type': ICONS[path][0], 'cache-control': 'public, max-age=86400', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' },
    });
  }

  // The standalone guide as plain text: the link visitors paste into chatbots that can read web pages
  // (GitHub's raw host is refused by some of them, e.g. Gemini). Static, needs no live data.
  if (path === '/guide' || path === '/guide.md') {
    return new Response(STANDALONE, {
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=300', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' },
    });
  }

  // Markdown feed for chatbots that can only read public web pages (Gemini). Public data only, rendered per request.
  const FEED = { '/feed/index.md': renderIndex, '/feed/changes.md': renderChanges };
  if (FEED[path]) {
    const lineup = await getLineup(deps);
    return new Response(FEED[path](lineup), {
      headers: { 'content-type': 'text/markdown; charset=utf-8', 'cache-control': 'public, max-age=60', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' },
    });
  }

  // Browsers get the human page at the root; scripts and API clients (and ?format=json) get JSON.
  if (path === '/' && q.get('format') !== 'json' && (request.headers.get('accept') ?? '').includes('text/html')) {
    return new Response(landingHtml(), {
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300', 'x-content-type-options': 'nosniff' },
    });
  }

  if (path === '/' || path === '/v1') {
    return json({
      name: 'OHNY helper (unofficial)',
      by: 'Dmitry Naidionov, https://naidionov.com',
      source: 'https://github.com/dnaidionov/OHNY-skills',
      install: { claude_one_tap: 'https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=Ask%20OHNY&connectorUrl=https%3A%2F%2Fnaidionov.com%2Fohny%2Fskills%2Fmcp', mcp_url: 'https://naidionov.com/ohny/skills/mcp' },
      checkin_form: 'https://ohny.fillout.com/26weekend',
      connector_phase: phaseAt(deps.realNow),
      festival: { dates: FESTIVAL.dates, timezone: FESTIVAL.tz },
      endpoints: {
        'GET /v1/meta': 'Freshness, counts, festival dates',
        'GET /v1/nearby?lat=&lng=&interests=&limit=3&offset=0': 'Closest sites that will be open when you arrive, matching interests (also near=<slug>, max_walk_min, radius_km, min_time_left_min, include_ticketed, borough, child_age, wheelchair=true, interests_mode=prefer|require, exclude=slug,slug)',
        'GET /v1/nearby ... &fixed=<slug>@<date-time>[;...][@lat,lng]': 'Tickets the visitor already holds are hard constraints: suggestions leave time to reach them; the reply has your_tickets with leave_by (also mode=walk|transit|car, min_stay_min, ticket_buffer_min)',
        'GET /v1/plan/check?stops=<slug>@<date-time>;...&held=<slug>,...': 'Validate an itinerary: open at arrival, session times exist, travel between stops, tickets held (also mode, stay_min, buffer_min)',
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
      phase: phaseAt(deps.realNow),
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
    const body = envelope(lineup, now, search(lineup.sites.filter((s) => !s.removed), {
      q: term, nowAbs: now.abs, limit: clamp(num(q.get('limit')), 1, 10, 5),
    }));
    return q.get('format') === 'text' ? asText(searchText(body)) : json(body);
  }

  const MODES = ['walk', 'transit', 'car'];
  const travelMode = MODES.includes(q.get('mode')) ? q.get('mode') : 'walk';
  const FIXED_HINT = 'Use fixed=<site-slug>@YYYY-MM-DDTHH:MM (the session start, New York time); separate several with ";"; add @lat,lng to use the exact address from the ticket, e.g. fixed=grand-central-26@2026-10-17T16:00@40.7527,-73.9772';

  if (path === '/v1/plan/check') {
    const specs = parseSpecs(q.get('stops'));
    if (!specs.length) {
      return fail(400, 'stops is required.', `List the stops in time order: stops=<slug>@YYYY-MM-DDTHH:MM;<slug>@... (arrival time for a free site, session start for a tour). Add held=<slug>,<slug> for tickets already held. ${FIXED_HINT}`);
    }
    const lineup = await getLineup(deps);
    const result = checkPlan(lineup.sites, {
      specs, held: (q.get('held') ?? '').split(/[;,]/).filter(Boolean), mode: travelMode,
      stayMin: num(q.get('stay_min')) ?? DEFAULT_STAY_MIN, buffer: num(q.get('buffer_min')) ?? TICKET_BUFFER_MIN, nowAbs: now.abs,
    });
    return json(envelope(lineup, now, result));
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
    let tickets = [];
    if (q.get('fixed')) {
      const specs = parseSpecs(q.get('fixed'));
      if (!specs.length) return fail(400, `Could not read fixed="${q.get('fixed')}".`, FIXED_HINT);
      tickets = resolveTickets(lineup.sites, specs);
    }
    const result = nearby(lineup.sites, {
      lat, lng, nowAbs: now.abs,
      tickets, mode: travelMode,
      minStayMin: num(q.get('min_stay_min')) ?? NEARBY_MIN_STAY_MIN,
      ticketBuffer: num(q.get('ticket_buffer_min')) ?? TICKET_BUFFER_MIN,
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
    const body = envelope(lineup, now, result);
    return q.get('format') === 'text' ? asText(nearbyText(body)) : json(body);
  }

  if (path === '/v1/plan/day') {
    if (!q.get('ticket')) {
      return fail(400, 'ticket is required.', `ticket=<site slug or name>@YYYY-MM-DDTHH:MM (the session start, New York time; several separated by ";"), plus from=lat,lng (where the visitor starts) or near=<slug>. Optional: interests, mode=walk|transit|car, child_age, wheelchair=true, limit, format=text.`);
    }
    const lineup = await getLineup(deps);
    const live = lineup.sites.filter((s) => !s.removed);
    let from;
    const fromParam = /^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/.exec(q.get('from') ?? '');
    if (fromParam) from = { lat: Number(fromParam[1]), lng: Number(fromParam[2]) };
    else if (num(q.get('lat')) != null && num(q.get('lng')) != null) from = { lat: num(q.get('lat')), lng: num(q.get('lng')) };
    else if (q.get('near')) { const ref = findSite(live, q.get('near')); if (ref?.geo) from = { lat: ref.geo.lat, lng: ref.geo.lng }; }
    const result = planDay(live, {
      ticket: q.get('ticket'), from, nowAbs: now.abs, interests: q.get('interests') ?? '', mode: travelMode,
      childAge: num(q.get('child_age')), wheelchair: q.get('wheelchair') === 'true', limit: clamp(num(q.get('limit')), 1, 5, 3),
    });
    const body = envelope(lineup, now, result);
    return q.get('format') === 'text' ? asText(planText(body)) : json(body);
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
        checkin: { form_url: 'https://ohny.fillout.com/26weekend', record_id: site.id, slug: site.slug, name: site.name, note: "You can't check the visitor in: give them form_url as a tappable link, asking nothing first." },
        official_record: site.id ? `${deps.base}/data/${site.id}.json` : undefined,
        official_page: `${deps.base}/place/${site.slug}`,
      },
    }));
  }

  return fail(404, 'Unknown route.', 'Try GET / for the list of endpoints.');
}

export const _resetCacheForTests = () => { liveCache = { at: 0, base: '', data: null, lineup: null }; };
