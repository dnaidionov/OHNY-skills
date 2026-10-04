// Tickets the visitor already holds are HARD constraints: a session at a fixed time, at a fixed place.
// This module turns them into arithmetic the server can check, instead of leaving it to the assistant:
//   - resolveTickets: does each held ticket match a real session in OHNY's live data?
//   - ticketLeg: if you visit X first, can you still make your ticket (and how long can you stay)?
//   - checkPlan: validate a whole itinerary, stop by stop, including travel between stops.
// "Sold Out" never applies here: it means nobody can buy more, not that a ticket holder can't go.
import { isCanceled, isSoldOut } from './status.js';
import { haversineKm, walkMinutes } from './geo.js';
import { parseNow, wallMinutes, fromWallMinutes, fmtTime } from './time.js';

export const TICKET_BUFFER_MIN = 15;      // arrive this early for a ticketed session (ID checks, queues)
export const NEARBY_MIN_STAY_MIN = 30;    // a suggested stop must leave at least this long before a ticket
export const DEFAULT_STAY_MIN = 45;       // assumed time at a drop-in stop when checking a plan
export const TIGHT_SLACK_MIN = 5;

export const clock = (abs) => fmtTime(fromWallMinutes(abs).minutes);
const dayName = (date) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
const whenText = (abs) => `${dayName(fromWallMinutes(abs).date)} ${clock(abs)}`;

/**
 * Rough travel time between two points. Walking uses the same estimate as everywhere else; "transit" and
 * "car" are cruder (street grid factor, an average speed that includes waiting, plus a fixed overhead).
 * Always approximate: when it matters, the assistant should confirm with a maps app.
 */
export function travelMinutes(a, b, mode = 'walk') {
  const km = haversineKm(a, b);
  const walk = walkMinutes(km);
  if (mode === 'transit') return Math.min(walk, Math.round(10 + ((km * 1.3) / 18) * 60));
  if (mode === 'car') return Math.min(walk, Math.round(8 + ((km * 1.3) / 20) * 60));
  return walk;
}

export const findSiteBySlug = (sites, key) => {
  const k = String(key).trim().toLowerCase();
  return sites.find((s) => s.slug?.toLowerCase() === k || s.id?.toLowerCase() === k);
};

/**
 * "slug@2026-10-17T11:30" items, separated by ; or ,. Each may end with @lat,lng to override the position
 * (use it when the visitor reads the exact address off their ticket).
 */
export function parseSpecs(input) {
  const specs = [];
  const re = /([^@;,\s][^@;]*?)@(\d{4}-\d{2}-\d{2}[T ]\d{1,2}:\d{2})(?:@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?))?(?=[;,]|$)/g;
  for (const m of String(input ?? '').matchAll(re)) {
    const t = parseNow(m[2]);
    if (!t) continue;
    specs.push({ slug: m[1].trim(), startAbs: t.abs, wall: t.wall, coords: m[3] != null ? { lat: Number(m[3]), lng: Number(m[4]) } : undefined });
  }
  return specs;
}

const issue = (severity, code, message) => ({ severity, code, message });
const listedTimes = (sessions) => sessions.slice(0, 6).map((w) => whenText(wallMinutes(w.date, w.start))).join(', ') || 'none listed';

/** Check one held ticket against the live lineup. */
export function resolveTicket(sites, spec) {
  const out = { slug: spec.slug, startAbs: spec.startAbs, issues: [] };
  const site = findSiteBySlug(sites, spec.slug);
  if (!site) {
    out.issues.push(issue('blocking', 'site_not_found', `No site "${spec.slug}" in OHNY's lineup. Search for the right slug.`));
    return { ...out, ok: false };
  }
  out.site = site;
  out.name = site.name;
  if (isCanceled(site)) out.issues.push(issue('blocking', 'canceled', `OHNY now lists ${site.name} as CANCELED. Tell the visitor first and check OHNY's official record.`));
  const sessions = (site.windows ?? []).filter((w) => w.kind === 'session');
  const win = sessions.find((w) => wallMinutes(w.date, w.start) === spec.startAbs);
  if (win) {
    out.win = win;
    out.endAbs = wallMinutes(win.date, win.end);
  } else {
    out.endAbs = spec.startAbs + 60;
    const near = [...sessions].sort((a, b) => Math.abs(wallMinutes(a.date, a.start) - spec.startAbs) - Math.abs(wallMinutes(b.date, b.start) - spec.startAbs));
    out.issues.push(issue('blocking', 'no_session_at_that_time',
      `OHNY lists no tour of ${site.name} starting ${whenText(spec.startAbs)}. Listed times: ${listedTimes(near)}. The time may have changed: ask to see the ticket.`));
  }
  out.geo = spec.coords ? { ...spec.coords, conf: 'address' } : site.geo;
  out.geoApprox = !spec.coords && (!site.geo || site.geo.conf !== 'address');
  if (out.geoApprox) out.issues.push(issue('warning', 'ticket_address_needed',
    `${site.name} publishes no street address (it comes with the ticket), so its position is only roughly known. Ask for the address on the ticket and pass it as lat,lng for exact timing.`));
  out.ok = !out.issues.some((i) => i.severity === 'blocking');
  return out;
}

export const resolveTickets = (sites, specs) => specs.map((s) => resolveTicket(sites, s));

/** Where does the visitor stand relative to each ticket, and when must they leave? */
export function describeTickets(tickets, { here, nowAbs, mode = 'walk', buffer = TICKET_BUFFER_MIN }) {
  return tickets.map((t) => {
    const base = {
      slug: t.slug, name: t.name, ticket_ok: t.ok, issues: t.issues.length ? t.issues : undefined,
      session: t.win ? { date: t.win.date, from: fmtTime(t.win.start), to: fmtTime(t.win.end) } : { starts: whenText(t.startAbs) },
      official_record: t.site?.id ? `https://ohny.org/data/${t.site.id}.json` : undefined,
    };
    if (!t.site) return base;
    let state;
    if (t.endAbs <= nowAbs) state = 'over';
    else if (nowAbs >= t.startAbs) state = 'in_progress';
    else if (fromWallMinutes(t.startAbs).date !== fromWallMinutes(nowAbs).date) state = 'later';
    else state = 'upcoming';
    const out = { ...base, state };
    if (here && t.geo && state !== 'over') {
      const travel = travelMinutes(here, t.geo, mode);
      const leaveBy = t.startAbs - buffer - travel;
      out.travel_min_from_here = travel;
      out.travel_mode = mode;
      out.leave_by = clock(leaveBy);
      out.minutes_until_leave = leaveBy - nowAbs;
      if (state === 'upcoming' && leaveBy <= nowAbs) { out.state = 'go_now'; }
      if (t.geoApprox) out.location_approximate = true;
    }
    return out;
  });
}

/** The ticket that currently constrains what the visitor can do: the earliest one not yet over. */
export function nextTicket(tickets, nowAbs) {
  return tickets.filter((t) => t.ok && t.site && t.endAbs > nowAbs).sort((a, b) => a.startAbs - b.startAbs)[0];
}

/**
 * Could a visitor who walks to `site` (arriving at `arrivalAbs`) still make `ticket`?
 * Returns { ok, availableMin, leaveByAbs }: availableMin is how long they can stay there.
 */
export function ticketLeg(ticket, site, arrivalAbs, { mode = 'walk', buffer = TICKET_BUFFER_MIN } = {}) {
  if (!ticket?.geo || !site.geo) return { ok: true, availableMin: Infinity };
  const travel = travelMinutes(site.geo, ticket.geo, mode);
  const leaveByAbs = ticket.startAbs - buffer - travel;
  return { travel, leaveByAbs, availableMin: leaveByAbs - arrivalAbs };
}

/**
 * Validate an itinerary. `stops`: [{ slug, startAbs, coords? }] in visiting order, where startAbs is the planned
 * arrival (drop-in) or the session start (tour). `held`: slugs the visitor already holds tickets for.
 */
export function checkPlan(sites, { specs, held = [], mode = 'walk', stayMin = DEFAULT_STAY_MIN, buffer = TICKET_BUFFER_MIN, nowAbs }) {
  const heldSet = new Set(held.map((h) => h.trim().toLowerCase()));
  const stops = [];
  let prev = null;
  for (const spec of specs) {
    const stop = { slug: spec.slug, at: whenText(spec.startAbs), issues: [] };
    const site = findSiteBySlug(sites, spec.slug);
    stops.push(stop);
    if (!site) {
      stop.issues.push(issue('blocking', 'site_not_found', `No site "${spec.slug}" in OHNY's lineup.`));
      prev = null;
      continue;
    }
    stop.name = site.name;
    const isHeld = heldSet.has(site.slug.toLowerCase()) || heldSet.has(spec.slug.toLowerCase());
    const sessions = (site.windows ?? []).filter((w) => w.kind === 'session');
    const opens = (site.windows ?? []).filter((w) => w.kind === 'open');
    const isTour = isHeld || (sessions.length > 0 && opens.length === 0);
    stop.kind = isTour ? 'tour' : 'drop-in';
    stop.ticket_held = isHeld || undefined;
    if (prev && spec.startAbs < prev.at) stop.issues.push(issue('blocking', 'out_of_order', `${site.name} is planned before the previous stop ends; list stops in time order.`));
    if (nowAbs != null && spec.startAbs < nowAbs) stop.issues.push(issue('warning', 'in_the_past', `${whenText(spec.startAbs)} is already past.`));
    if (isCanceled(site)) stop.issues.push(issue('blocking', 'canceled', `OHNY lists ${site.name} as CANCELED.`));

    let requiredArrival = spec.startAbs;
    let leaveAbs;
    if (isTour) {
      const win = sessions.find((w) => wallMinutes(w.date, w.start) === spec.startAbs);
      if (!win) {
        const near = [...sessions].sort((a, b) => Math.abs(wallMinutes(a.date, a.start) - spec.startAbs) - Math.abs(wallMinutes(b.date, b.start) - spec.startAbs));
        stop.issues.push(issue('blocking', 'no_session_at_that_time', `OHNY lists no tour of ${site.name} starting ${whenText(spec.startAbs)}. Listed times: ${listedTimes(near)}.`));
        leaveAbs = spec.startAbs + 60;
      } else {
        leaveAbs = wallMinutes(win.date, win.end);
        stop.session = { from: fmtTime(win.start), to: fmtTime(win.end) };
      }
      requiredArrival = spec.startAbs - buffer;
      if (!isHeld) {
        if (isSoldOut(site)) stop.issues.push(issue('blocking', 'sold_out_no_ticket', `${site.name} is sold out and no ticket is held for it.`));
        else stop.issues.push(issue('warning', 'needs_ticket', `${site.name} needs a ticket; confirm availability on its ticket page.`));
      }
    } else {
      const win = opens.find((w) => wallMinutes(w.date, w.start) <= spec.startAbs && spec.startAbs < wallMinutes(w.date, w.end));
      if (!win) {
        const next = opens.map((w) => wallMinutes(w.date, w.start)).filter((s) => s > spec.startAbs).sort((a, b) => a - b)[0];
        stop.issues.push(issue('blocking', 'closed_at_arrival', `${site.name} is not open at ${whenText(spec.startAbs)}${next != null ? `; next opening ${whenText(next)}` : ' and has no later hours'}.`));
        leaveAbs = spec.startAbs + stayMin;
      } else {
        const closes = wallMinutes(win.date, win.end);
        if (closes - spec.startAbs < stayMin) stop.issues.push(issue('warning', 'closes_soon_after_arrival', `${site.name} closes at ${clock(closes)}, only ${closes - spec.startAbs} min after you arrive.`));
        leaveAbs = Math.min(spec.startAbs + stayMin, closes);
      }
    }
    stop.leave = clock(leaveAbs);

    const geo = spec.coords ? { ...spec.coords, conf: 'address' } : site.geo;
    const approx = !spec.coords && (!geo || geo.conf !== 'address');
    if (isTour && approx && isHeld) stop.issues.push(issue('warning', 'ticket_address_needed', `${site.name}'s exact address is on the ticket; travel times to and from it are rough until you have it.`));
    if (prev?.geo && geo) {
      const travel = travelMinutes(prev.geo, geo, mode);
      const earliest = prev.leaveAbs + travel;
      const slack = requiredArrival - earliest;
      stop.leg = { from: prev.slug, travel_min: travel, mode, leave_previous_at: clock(prev.leaveAbs), earliest_arrival: clock(earliest), slack_min: slack, approximate: true };
      if (slack < 0) stop.issues.push(issue('blocking', 'cannot_make_it', `From ${prev.name} (leaving ${clock(prev.leaveAbs)}) it's about ${travel} min by ${mode}, so you'd be ${-slack} min late for ${site.name}${isTour ? ` (aim to be there ${buffer} min before the ${clock(spec.startAbs)} start)` : ''}.`));
      else if (slack < TIGHT_SLACK_MIN) stop.issues.push(issue('warning', 'very_tight', `Only ${slack} min to spare between ${prev.name} and ${site.name}.`));
      if (travel > 30) stop.issues.push(issue('warning', 'long_leg_check_maps', `${travel} min is a long hop and this estimate is rough: confirm with a maps app.`));
    }
    prev = { slug: site.slug, name: site.name, at: spec.startAbs, leaveAbs, geo };
  }
  const blocking = stops.flatMap((s) => s.issues.filter((i) => i.severity === 'blocking').map((i) => ({ stop: s.name ?? s.slug, ...i })));
  const warnings = stops.reduce((n, s) => n + s.issues.filter((i) => i.severity === 'warning').length, 0);
  const tight = stops.filter((s) => s.leg).map((s) => s.leg.slack_min);
  return {
    ok: blocking.length === 0,
    stops,
    blocking_count: blocking.length,
    warning_count: warnings,
    summary: blocking.length
      ? `The plan doesn't work: ${blocking[0].message}${blocking.length > 1 ? ` (and ${blocking.length - 1} more problem${blocking.length > 2 ? 's' : ''})` : ''}`
      : `The plan works: ${stops.length} stops${tight.length ? `, tightest gap ${Math.min(...tight)} min` : ''}${warnings ? `, ${warnings} thing${warnings > 1 ? 's' : ''} to double-check` : ''}.`,
  };
}
