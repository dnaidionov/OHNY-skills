import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { handle, _resetCacheForTests } from '../src/handler.js';
import { _resetEnrichMemoForTests } from '../src/core/enrich.js';
import { normalizeRecord } from '../src/core/normalize.js';
import { wallMinutes } from '../src/core/time.js';
import { nearby } from '../src/core/search.js';
import { parseSpecs, resolveTicket, resolveTickets, checkPlan, travelMinutes, describeTickets, clock } from '../src/core/tickets.js';

const at = (d, hhmm) => { const [h, m] = hhmm.split(':').map(Number); return wallMinutes(d, h * 60 + m); };
const SAT = '2026-10-17';
const WSQ = { lat: 40.7308, lng: -73.9973 };                       // Washington Square
const GCT = { lat: 40.7527, lng: -73.9772, conf: 'name' };        // Midtown, approximate (no public address)

const drop = (o) => ({ access_type: ['Drop-In'], borough: 'Manhattan', neighborhood: 'Greenwich Village', city: 'New York', state: 'NY', address_1: '1 Main St', zip: '10012',
  saturday_open_access_date: 'Sat, Oct 17', sat_opening_time: '10:00 AM', sat_closing_time: '6:00 PM', ...o });
const tour = (o) => ({ access_type: ['Sold Out'], borough: 'Manhattan', neighborhood: 'Midtown', city: 'New York', state: 'NY',
  ticketed_session_day_1_date: 'Sat, Oct 17', ticketed_session_start_time_1: '4:00 PM', ticketed_session_end_time_1: '5:00 PM', ...o });
const mk = (r, geo) => ({ ...normalizeRecord(r, r.record_id), geo });
const g = (lat, lng, conf = 'address') => ({ lat, lng, conf });

const sites = [
  mk(drop({ record_id: 'a', slug: 'a', experience_name: 'Alpha Hall', short_description: 'History.' }), g(40.7310, -73.9970)),
  mk(drop({ record_id: 'b', slug: 'b', experience_name: 'Beta House', short_description: 'More history.' }), g(40.7360, -73.9960)),
  mk(tour({ record_id: 't', slug: 'gct', experience_name: 'Grand Central Terminal Tour' }), GCT),                   // SOLD OUT, session 4:00-5:00 PM
  mk(tour({ record_id: 't2', slug: 'noon', experience_name: 'Noon Tour', ticketed_session_start_time_1: '12:00 PM', ticketed_session_end_time_1: '1:00 PM' }), g(40.7330, -73.9950)),
  mk(drop({ record_id: 'c', slug: 'cx', experience_name: 'Canceled Place', access_type: ['Canceled'] }), g(40.7312, -73.9971)),
  mk(drop({ record_id: 'n', slug: 'near-t', experience_name: 'Midtown Gallery', neighborhood: 'Midtown', short_description: 'Art.' }), g(40.7520, -73.9780)),
];

test('parseSpecs reads slug@time, several items, optional coordinates, and spaces in slugs', () => {
  const one = parseSpecs('gct@2026-10-17T16:00');
  assert.equal(one.length, 1);
  assert.equal(one[0].startAbs, at(SAT, '16:00'));
  const many = parseSpecs('gct@2026-10-17T16:00@40.7527,-73.9772;noon@2026-10-17 12:00');
  assert.deepEqual(many.map((s) => s.slug), ['gct', 'noon']);
  assert.deepEqual(many[0].coords, { lat: 40.7527, lng: -73.9772 });
  assert.equal(many[1].startAbs, at(SAT, '12:00'));
  assert.equal(parseSpecs('mta-42 st-bryant park-26@2026-10-17T10:00')[0].slug, 'mta-42 st-bryant park-26');
  assert.deepEqual(parseSpecs('nonsense'), []);
  assert.deepEqual(parseSpecs(''), []);
});

test('a held ticket for a SOLD OUT tour is valid: sold out never applies to the holder', () => {
  const t = resolveTicket(sites, parseSpecs('gct@2026-10-17T16:00')[0]);
  assert.equal(t.ok, true);
  assert.equal(t.endAbs, at(SAT, '17:00'));
  assert.equal(t.issues.filter((i) => i.severity === 'blocking').length, 0);
  assert.ok(t.issues.some((i) => i.code === 'ticket_address_needed'), 'asks for the address on the ticket');
  const exact = resolveTicket(sites, parseSpecs('gct@2026-10-17T16:00@40.7527,-73.9772')[0]);
  assert.ok(!exact.issues.some((i) => i.code === 'ticket_address_needed'));
});

test('a ticket that matches no real session, a canceled site and an unknown site are all flagged blocking', () => {
  const wrong = resolveTicket(sites, parseSpecs('gct@2026-10-17T16:30')[0]);
  assert.equal(wrong.ok, false);
  const msg = wrong.issues.find((i) => i.code === 'no_session_at_that_time').message;
  assert.match(msg, /no tour of Grand Central Terminal Tour starting Sat 4:30 PM/);
  assert.match(msg, /Sat 4:00 PM/);                                            // lists what OHNY does have
  assert.equal(resolveTicket(sites, parseSpecs('cx@2026-10-17T11:00')[0]).issues.find((i) => i.code === 'canceled').severity, 'blocking');
  assert.equal(resolveTicket(sites, parseSpecs('nope@2026-10-17T11:00')[0]).issues[0].code, 'site_not_found');
});

const fixed = (s) => resolveTickets(sites, parseSpecs(s));
const base = (nowHHMM, extra = {}) => ({ ...WSQ, nowAbs: at(SAT, nowHHMM), limit: 10, interests: '', ...extra });

test('nearby with a held ticket: suggestions leave time to reach it, and say when to leave', () => {
  const tickets = fixed('gct@2026-10-17T16:00');
  const r = nearby(sites, base('13:30', { tickets }));
  const slugs = r.results.map((c) => c.slug);
  assert.ok(slugs.includes('a') && slugs.includes('b'));
  assert.ok(!slugs.includes('gct'), 'the ticket site is not suggested as something to visit');
  assert.ok(!slugs.includes('noon'), 'a sold-out tour you do not hold is still excluded');
  // leave-by maths: session 4:00 PM, 15 min early, travel from the ticket site's position
  const travel = travelMinutes(sites[0].geo, GCT, 'walk');
  const alpha = r.results.find((c) => c.slug === 'a');
  assert.equal(alpha.leave_by, clock(at(SAT, '16:00') - 15 - travel));
  assert.ok(alpha.time_before_your_ticket_min >= 30);
  const t = r.your_tickets[0];
  assert.equal(t.state, 'upcoming');
  assert.equal(t.ticket_ok, true);
  assert.equal(t.location_approximate, true);
  assert.equal(t.leave_by, clock(at(SAT, '16:00') - 15 - travelMinutes(WSQ, GCT, 'walk')));
  assert.ok(r.search.held_tickets);
});

test('nearby with a held ticket: places that would make you late are skipped, by name, with the reason', () => {
  const tickets = fixed('gct@2026-10-17T16:00');
  const early = nearby(sites, base('13:30', { tickets }));
  const late = nearby(sites, base('14:30', { tickets }));                       // ~48 min walk to Midtown: only ~26 min left before setting off
  assert.ok(early.results.length > late.results.length);
  assert.ok(!late.results.some((c) => c.slug === 'a'));
  const why = late.skipped.find((s) => s.reason === 'ticket_conflict');
  assert.ok(why);
  assert.match(why.why, /before you must set off for your Grand Central Terminal Tour tour at 4:00 PM/);
  assert.ok(late.in_range_breakdown.would_make_you_late_for_your_ticket >= 1);
});

test('exact coordinates from the ticket replace the rough position', () => {
  const roughLeave = nearby(sites, base('14:30', { tickets: fixed('gct@2026-10-17T16:00') })).your_tickets[0].leave_by;
  // the ticket says the tour meets 100 m from Washington Square instead
  const exact = nearby(sites, base('14:30', { tickets: fixed('gct@2026-10-17T16:00@40.7312,-73.9976') }));
  assert.equal(exact.your_tickets[0].location_approximate, undefined);
  assert.notEqual(exact.your_tickets[0].leave_by, roughLeave);
  assert.ok(exact.results.length >= 2);
});

test('a ticket in progress occupies the visitor; a ticket on another day, or already over, adds no constraint', () => {
  const during = nearby(sites, base('16:20', { tickets: fixed('gct@2026-10-17T16:00') }));
  assert.equal(during.your_tickets[0].state, 'in_progress');
  assert.equal(during.results.length, 0);                                       // busy: nothing fits
  const later = nearby(sites, base('11:00', { tickets: fixed('gct@2026-10-18T16:00') }));
  assert.equal(later.your_tickets[0].ticket_ok, false);                         // Sunday has no such session in this fixture
  const over = nearby(sites, base('17:30', { tickets: fixed('gct@2026-10-17T16:00') }));
  assert.equal(over.your_tickets[0].state, 'over');
  assert.ok(over.results.length >= 1);
});

test('a ticket that does not match OHNY data does not silently shape the suggestions, but is reported', () => {
  const r = nearby(sites, base('14:30', { tickets: fixed('gct@2026-10-17T16:30') }));
  assert.equal(r.your_tickets[0].ticket_ok, false);
  assert.ok(r.your_tickets[0].issues.some((i) => i.code === 'no_session_at_that_time'));
  assert.ok(r.results.length >= 2);
});

test('describeTickets: go_now when the leave-by time has passed', () => {
  const [t] = describeTickets(fixed('gct@2026-10-17T16:00'), { here: WSQ, nowAbs: at(SAT, '15:40'), mode: 'walk' });
  assert.equal(t.state, 'go_now');
  assert.ok(t.minutes_until_leave < 0);
});

const plan = (stops, held = [], extra = {}) => checkPlan(sites, { specs: parseSpecs(stops), held, ...extra });

test('plan check: a workable day passes, with the tightest gap in the summary', () => {
  const r = plan('a@2026-10-17T10:00;b@2026-10-17T11:00;gct@2026-10-17T16:00', ['gct']);
  assert.equal(r.ok, true, JSON.stringify(r.stops.map((s) => s.issues)));
  assert.match(r.summary, /The plan works: 3 stops, tightest gap \d+ min/);
  assert.equal(r.stops[2].kind, 'tour');
  assert.equal(r.stops[2].ticket_held, true);
});

test('plan check: not enough time to reach a held ticket is blocking, and says by how much', () => {
  const r = plan('a@2026-10-17T15:30;gct@2026-10-17T16:00', ['gct']);
  assert.equal(r.ok, false);
  const m = r.stops[1].issues.find((i) => i.code === 'cannot_make_it');
  assert.ok(m);
  assert.match(m.message, /late for Grand Central Terminal Tour/);
  assert.match(r.summary, /doesn't work/);
});

test('plan check: closed at arrival, wrong session time, out of order, unknown site', () => {
  assert.equal(plan('a@2026-10-17T21:00').stops[0].issues[0].code, 'closed_at_arrival');
  assert.equal(plan('gct@2026-10-17T16:30', ['gct']).stops[0].issues.find((i) => i.code === 'no_session_at_that_time').severity, 'blocking');
  assert.ok(plan('b@2026-10-17T12:00;a@2026-10-17T11:00').stops[1].issues.some((i) => i.code === 'out_of_order'));
  assert.equal(plan('nope@2026-10-17T12:00').stops[0].issues[0].code, 'site_not_found');
});

test('plan check: a sold-out tour is blocking unless a ticket is held; an available tour just needs a ticket', () => {
  assert.ok(plan('gct@2026-10-17T16:00').stops[0].issues.some((i) => i.code === 'sold_out_no_ticket'));
  assert.ok(!plan('gct@2026-10-17T16:00', ['gct']).stops[0].issues.some((i) => i.code === 'sold_out_no_ticket'));
  const open = [...sites, mk(tour({ record_id: 'o', slug: 'open-tour', experience_name: 'Open Tour', access_type: ['Ticketed'] }), g(40.7340, -73.9950))];
  const r = checkPlan(open, { specs: parseSpecs('open-tour@2026-10-17T16:00'), held: [] });
  assert.equal(r.ok, true);
  assert.ok(r.stops[0].issues.some((i) => i.code === 'needs_ticket' && i.severity === 'warning'));
});

test('plan check: a very tight hop warns, and a long hop asks for a maps check', () => {
  // leave A at 10:45 (45-minute stay from 10:00); the Midtown gallery is ~45 min away on foot
  const walkTime = travelMinutes(sites[0].geo, sites[5].geo, 'walk');
  const tight = plan(`a@2026-10-17T10:00;near-t@2026-10-17T${String(Math.floor((10 * 60 + 45 + walkTime + 2) / 60)).padStart(2, '0')}:${String((10 * 60 + 45 + walkTime + 2) % 60).padStart(2, '0')}`);
  assert.ok(tight.stops[1].issues.some((i) => i.code === 'very_tight'));
  assert.ok(tight.stops[1].issues.some((i) => i.code === 'long_leg_check_maps'));
  assert.ok(travelMinutes(sites[0].geo, sites[5].geo, 'transit') < walkTime);     // transit estimate is faster over this distance
});

// ---- through the HTTP API and the connector ------------------------------------------------------------------
const rec = (r) => r;
const liveRecords = [
  drop({ record_id: 'a', slug: 'a', experience_name: 'Alpha Hall', short_description: 'History.' }),
  tour({ record_id: 't', slug: 'gct', experience_name: 'Grand Central Terminal Tour' }),
];
const snapshot = { generated_at: '2026-10-01T00:00:00Z', sites: [
  { ...normalizeRecord(liveRecords[0], 'a'), geo: g(40.7310, -73.9970) },
  { ...normalizeRecord(liveRecords[1], 't'), geo: GCT },
] };
const fetchImpl = async (url) => url.endsWith('/festival.json') ? Response.json({ records: liveRecords }) : new Response('', { status: 404 });
const deps = { snapshot, fetchImpl, realNow: new Date('2026-10-17T18:30:00Z') };
const api = async (path) => handle(new Request(`https://x.test${path}`), deps);
beforeEach(() => { _resetCacheForTests(); _resetEnrichMemoForTests(); });

test('API: /v1/plan/check and nearby?fixed=, including helpful errors', async () => {
  const bad = await api('/v1/plan/check');
  assert.equal(bad.status, 400);
  assert.match((await bad.json()).hint, /slug>@YYYY-MM-DDTHH:MM/);
  const ok = await (await api('/v1/plan/check?stops=a@2026-10-17T10:00;gct@2026-10-17T16:00&held=gct&now=2026-10-04T09:00')).json();
  assert.equal(ok.ok, true);
  assert.equal(ok.live, true);
  const nb = await (await api('/v1/nearby?lat=40.7308&lng=-73.9973&fixed=gct@2026-10-17T16:00&now=2026-10-17T14:30')).json();
  assert.equal(nb.your_tickets[0].slug, 'gct');
  assert.ok(nb.results.every((c) => c.slug !== 'gct'));
  const garbled = await api('/v1/nearby?lat=40.7&lng=-73.9&fixed=gct-tomorrow-at-four');
  assert.equal(garbled.status, 400);
  assert.match((await garbled.json()).hint, /fixed=<site-slug>@/);
});

test('connector: ohny_check_plan and ohny_nearby with fixed', async () => {
  const call = async (name, args) => (await (await handle(new Request('https://x.test/mcp', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }) }), deps)).json()).result;
  const check = await call('ohny_check_plan', { stops: 'a@2026-10-17T10:00;gct@2026-10-17T16:00', held: 'gct' });
  assert.equal(JSON.parse(check.content[0].text).ok, true);
  assert.equal((await call('ohny_check_plan', {})).isError, true);
  const nb = await call('ohny_nearby', { lat: 40.7308, lng: -73.9973, fixed: 'gct@2026-10-17T16:00', now: '2026-10-17T14:30' });
  assert.equal(JSON.parse(nb.content[0].text).your_tickets[0].ticket_ok, true);
});
