import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { handle, _resetCacheForTests } from '../src/handler.js';
import { _resetEnrichMemoForTests } from '../src/core/enrich.js';
import { normalizeRecord } from '../src/core/normalize.js';

// One call that plans a day around a held ticket. Opal's Get Webpage is a slow nested model call that can
// hang or come back empty, so a plan must not need 4-6 separate fetches (2026-10-07 owner report).
const base = { borough: 'Manhattan', city: 'New York', state: 'NY', neighborhood: 'Morningside Heights' };
const dropIn = (o) => normalizeRecord({ ...base, access_type: ['Drop-In'], address_1: '1 Main St', zip: '10025',
  saturday_open_access_date: 'Sat, Oct 17', sat_opening_time: '10:00 AM', sat_closing_time: '5:00 PM', ...o });
const tour = normalizeRecord({ ...base, record_id: 'recV', slug: 'vertical-26', experience_name: 'Cathedral of St. John the Divine: Vertical Tour',
  access_type: ['Sold Out'], short_description: 'Climb the cathedral for rooftop views.',
  ticketed_session_day_1_date: 'Sat, Oct 17', ticketed_session_start_time_1: '12:00 PM', ticketed_session_end_time_1: '1:30 PM',
  ticketed_session_day_2_date: 'Sat, Oct 17', ticketed_session_start_time_2: '2:00 PM', ticketed_session_end_time_2: '3:30 PM' });
const sites = [
  { ...tour, geo: { lat: 40.8038, lng: -73.9619, conf: 'name' } },
  { ...dropIn({ record_id: 'recM', slug: 'morning-hall-26', experience_name: 'Morning Hall', short_description: 'A historic architecture landmark.' }), geo: { lat: 40.7685, lng: -73.9822, conf: 'address' } },
  { ...dropIn({ record_id: 'recA', slug: 'after-garden-26', experience_name: 'After Garden', short_description: 'A historic garden and chapel.' }), geo: { lat: 40.8050, lng: -73.9600, conf: 'address' } },
];
const snapshot = { generated_at: '2026-10-01T00:00:00Z', sites };
const call = (qs) => handle(new Request(`https://x.test/v1/plan/day?${qs}`), {
  snapshot, fetchImpl: async () => new Response('', { status: 503 }), realNow: new Date('2026-10-17T14:30:00Z') });  // 10:30 AM NY
const from = 'from=40.7681,-73.9819';   // Columbus Circle

beforeEach(() => { _resetCacheForTests(); _resetEnrichMemoForTests(); });

test('finds the ticketed site by name, confirms the session, and plans before and after it in one call', async () => {
  const res = await call(`ticket=${encodeURIComponent('vertical tour st john the divine')}%402026-10-17T14:00&${from}&interests=history`);
  assert.equal(res.status, 200);
  const b = await res.json();
  assert.equal(b.ok, true);
  assert.equal(b.tickets[0].slug, 'vertical-26');
  assert.equal(b.tickets[0].ticket_ok, true);
  assert.ok(b.tickets[0].leave_by);
  assert.equal(b.before[0].slug, 'morning-hall-26');                 // nearest open place at the start
  assert.ok(b.before.every((r) => r.leave_by), 'each pre-ticket stop says when to leave');
  assert.equal(b.after[0].slug, 'after-garden-26');                   // nearest open place to the cathedral at 3:30
  assert.deepEqual(b.itinerary.map((s) => s.slug), ['morning-hall-26', 'vertical-26', 'after-garden-26']);
  assert.equal(typeof b.check.summary, 'string');
  assert.equal(b.live, false);                         // envelope is present (saved copy in this offline test)
});

test('a sold-out tour the visitor holds a ticket for is not treated as a problem', async () => {
  const b = await (await call(`ticket=vertical-26%402026-10-17T14:00&${from}`)).json();
  assert.equal(b.ok, true);
  assert.ok(!JSON.stringify(b.check).includes('sold_out_no_ticket'));
});

test('a time with no session says so, lists the real times, and plans nothing', async () => {
  const b = await (await call(`ticket=vertical-26%402026-10-17T13:30&${from}`)).json();
  assert.equal(b.ok, false);
  assert.equal(b.tickets[0].issues[0].code, 'no_session_at_that_time');
  assert.match(b.tickets[0].issues[0].message, /12:00 PM.*2:00 PM|2:00 PM.*12:00 PM/);
  assert.equal(b.itinerary, undefined);
  assert.equal(b.before, undefined);
});

test('an unknown site name is reported, not guessed', async () => {
  const b = await (await call(`ticket=${encodeURIComponent('empire state building')}%402026-10-17T14:00&${from}`)).json();
  assert.equal(b.ok, false);
  assert.equal(b.tickets[0].issues[0].code, 'site_not_found');
});

test('ticket is required; the hint explains the format', async () => {
  const res = await call(from);
  assert.equal(res.status, 400);
  assert.match((await res.json()).hint, /ticket=/);
});

test('format=text gives short plain lines with exact times, slugs and New York time', async () => {
  const res = await call(`ticket=vertical-26%402026-10-17T14:00&${from}&interests=history&format=text`);
  assert.match(res.headers.get('content-type'), /^text\/plain/);
  const t = await res.text();
  assert.doesNotMatch(t, /^\s*[{[]/);
  for (const s of ['vertical-26', '2:00 PM', 'LEAVE BY', 'BEFORE', 'AFTER', 'morning-hall-26', 'after-garden-26', 'New York']) assert.ok(t.includes(s), s);
  assert.ok(t.length < 4000, `${t.length} chars`);
});

test('format=text for a bad time states the listed times plainly', async () => {
  const t = await (await call(`ticket=vertical-26%402026-10-17T13:30&${from}&format=text`)).text();
  assert.match(t, /no tour .*1:30 PM/i);
  assert.match(t, /12:00 PM/);
  assert.match(t, /2:00 PM/);
});

const get = (path) => handle(new Request(`https://x.test${path}`), {
  snapshot, fetchImpl: async () => new Response('', { status: 503 }), realNow: new Date('2026-10-17T14:30:00Z') });

test('nearby and search also answer in format=text', async () => {
  const n = await get('/v1/nearby?lat=40.7681&lng=-73.9819&format=text');
  assert.match(n.headers.get('content-type'), /^text\/plain/);
  const nt = await n.text();
  assert.ok(nt.includes('morning-hall-26') && nt.includes('New York time'));
  const s = await (await get('/v1/search?q=vertical&format=text')).text();
  assert.ok(s.includes('vertical-26') && s.includes('SOLD OUT'));
  const none = await (await get('/v1/search?q=empire%20state&format=text')).text();
  assert.match(none, /NO MATCH: no site by that name/);
});

test('without format=text the JSON replies are unchanged', async () => {
  const n = await get('/v1/nearby?lat=40.7681&lng=-73.9819');
  assert.match(n.headers.get('content-type'), /^application\/json/);
});

test('no leave-by time is given for a ticket that is not confirmed', async () => {
  const t = await (await call(`ticket=vertical-26%402026-10-17T13:30&${from}&format=text`)).text();
  assert.doesNotMatch(t, /LEAVE BY/);
});
