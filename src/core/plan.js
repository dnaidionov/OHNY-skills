import { parseSpecs, resolveTickets, describeTickets, checkPlan, findSiteBySlug, clock, TICKET_BUFFER_MIN } from './tickets.js';
import { nearby, search } from './search.js';
import { fromWallMinutes } from './time.js';

/**
 * Plan a day around tickets the visitor holds, in one call: find each ticketed site (slug or name), confirm the
 * session, suggest places before the first ticket (from where they start) and after the last one (from that
 * site, when the tour ends), and check the suggested order. If a ticket can't be confirmed, nothing is planned.
 */
export function planDay(sites, { ticket, from, nowAbs, interests, mode = 'walk', childAge, wheelchair = false, limit = 3 }) {
  const specs = parseSpecs(ticket);
  const lookups = [];
  for (const spec of specs) {
    if (findSiteBySlug(sites, spec.slug)) continue;
    const hit = search(sites, { q: spec.slug, nowAbs, limit: 1 });
    if (hit.results?.length) { lookups.push({ asked: spec.slug, found: hit.results[0].slug }); spec.slug = hit.results[0].slug; }
  }
  const tickets = resolveTickets(sites, specs);
  const here = from ? { lat: from.lat, lng: from.lng } : undefined;
  const described = describeTickets(tickets, { here, nowAbs, mode, buffer: TICKET_BUFFER_MIN });
  const out = { ticket_lookups: lookups.length ? lookups : undefined, tickets: described };
  if (!tickets.length || tickets.some((t) => !t.ok)) return { ok: false, ...out };

  const common = { interests, mode, childAge, wheelchair, limit, interestsMode: 'prefer' };
  const held = tickets.map((t) => t.site.slug);
  const sorted = [...tickets].sort((a, b) => a.startAbs - b.startAbs);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  let before = [];
  if (here && nowAbs < first.startAbs) {
    before = nearby(sites, { ...common, lat: here.lat, lng: here.lng, nowAbs, tickets, exclude: held }).results;
  }
  const after = last.geo
    ? nearby(sites, { ...common, lat: last.geo.lat, lng: last.geo.lng, nowAbs: last.endAbs, exclude: held }).results
    : [];

  const stops = [];
  if (before[0]) stops.push({ slug: before[0].slug, startAbs: nowAbs + before[0].walk_min });
  for (const t of sorted) stops.push({ slug: t.site.slug, startAbs: t.startAbs });
  if (after[0]) stops.push({ slug: after[0].slug, startAbs: last.endAbs + after[0].walk_min });
  const check = checkPlan(sites, { specs: stops, held, mode, nowAbs });
  const itinerary = stops.map((s) => {
    const site = findSiteBySlug(sites, s.slug);
    return { at: clock(s.startAbs), date: fromWallMinutes(s.startAbs).date, slug: site.slug, name: site.name, kind: held.includes(site.slug) ? 'your ticket' : 'drop-in' };
  });
  return { ok: true, ...out, before, after, itinerary, check: { ok: check.ok, summary: check.summary, stops: check.stops } };
}
