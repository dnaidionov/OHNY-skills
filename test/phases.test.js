import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { handle, _resetCacheForTests } from '../src/handler.js';
import { _resetEnrichMemoForTests } from '../src/core/enrich.js';
import { normalizeRecord } from '../src/core/normalize.js';
import { phaseAt } from '../src/core/time.js';
import { INSTRUCTIONS, AFTER_INSTRUCTIONS, ENDED_INSTRUCTIONS } from '../src/mcp.js';

test('seasons: festival until midnight Oct 18, Q&A-only for a month, then quiet (New York time, across the Nov 1 clock change)', () => {
  assert.equal(phaseAt(new Date('2026-10-04T12:00:00-04:00')), 'festival');
  assert.equal(phaseAt(new Date('2026-10-18T23:59:00-04:00')), 'festival');
  assert.equal(phaseAt(new Date('2026-10-19T00:00:00-04:00')), 'after');
  assert.equal(phaseAt(new Date('2026-11-18T23:59:00-05:00')), 'after');      // EST by then
  assert.equal(phaseAt(new Date('2026-11-19T00:00:00-05:00')), 'ended');
  assert.equal(phaseAt(new Date('2027-03-01T12:00:00-05:00')), 'ended');
});

const rec = { record_id: 'a', slug: 'a-26', experience_name: 'Alpha Hall', access_type: ['Drop-In'], borough: 'Manhattan', neighborhood: 'SoHo', city: 'New York', state: 'NY',
  address_1: '1 Main St', zip: '10012', saturday_open_access_date: 'Sat, Oct 17', sat_opening_time: '10:00 AM', sat_closing_time: '5:00 PM', short_description: 'A hall.' };
const snapshot = { generated_at: '2026-10-01T00:00:00Z', sites: [{ ...normalizeRecord(rec, 'a'), geo: { lat: 40.7301, lng: -73.9951, conf: 'address' } }] };
const fetchImpl = async (url) => url.endsWith('/festival.json') ? Response.json({ records: [rec] }) : new Response('', { status: 404 });
const at = (iso) => ({ snapshot, fetchImpl, realNow: new Date(iso) });
const rpc = async (iso, method, params) => (await (await handle(new Request('https://x.test/mcp', { method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }), at(iso))).json());
const FEST = '2026-10-17T18:30:00Z', AFTER = '2026-10-25T18:30:00Z', ENDED = '2026-12-01T18:30:00Z';
beforeEach(() => { _resetCacheForTests(); _resetEnrichMemoForTests(); });

test('connector tool list by season: all seven, then only the Q&A tools, then none', async () => {
  const names = async (iso) => (await rpc(iso, 'tools/list')).result.tools.map((t) => t.name);
  assert.deepEqual(await names(FEST), ['ohny_nearby', 'ohny_search', 'ohny_site', 'ohny_check_plan', 'ohny_plan_day', 'ohny_changes', 'ohny_guide']);
  assert.deepEqual(await names(AFTER), ['ohny_search', 'ohny_site', 'ohny_guide']);
  assert.deepEqual(await names(ENDED), []);
});

test('connector instructions follow the season, and say the festival is over afterwards', async () => {
  const ins = async (iso) => (await rpc(iso, 'initialize', { protocolVersion: '2025-06-18' })).result.instructions;
  assert.equal(await ins(FEST), INSTRUCTIONS);
  assert.equal(await ins(AFTER), AFTER_INSTRUCTIONS);
  assert.equal(await ins(ENDED), ENDED_INSTRUCTIONS);
  assert.match(AFTER_INSTRUCTIONS, /is over/);
  assert.match(AFTER_INSTRUCTIONS, /NOT affiliated/);
  assert.match(AFTER_INSTRUCTIONS, /Nothing is "open now"/);
  assert.match(ENDED_INSTRUCTIONS, /https:\/\/ohny\.org/);
});

test('after the festival: removed tools answer politely, the Q&A tools still work, the guide carries a note', async () => {
  const call = async (iso, name, args) => (await rpc(iso, 'tools/call', { name, arguments: args })).result;
  const gone = await call(AFTER, 'ohny_nearby', { lat: 40.73, lng: -73.99 });
  assert.equal(gone.isError, true);
  assert.match(gone.content[0].text, /festival is over/);
  assert.equal((await call(AFTER, 'ohny_check_plan', { stops: 'a-26@2026-10-17T10:00' })).isError, true);
  const found = await call(AFTER, 'ohny_search', { q: 'alpha' });
  assert.equal(found.isError, undefined);
  assert.equal(JSON.parse(found.content[0].text).results[0].slug, 'a-26');
  assert.equal((await call(AFTER, 'ohny_site', { slug: 'a-26' })).isError, undefined);
  const guide = (await call(AFTER, 'ohny_guide', { topic: 'about' })).content[0].text;
  assert.match(guide, /^NOTE: the festival ended on Oct 18, 2026/);
  assert.equal(((await call(FEST, 'ohny_guide', { topic: 'about' })).content[0].text).startsWith('NOTE'), false);
  assert.equal((await call(ENDED, 'ohny_search', { q: 'alpha' })).isError, true);
});

test('the plain web API keeps working after the festival, and reports the season', async () => {
  const meta = await (await handle(new Request('https://x.test/v1/meta'), at(AFTER))).json();
  assert.equal(meta.phase, 'after');
  assert.equal((await (await handle(new Request('https://x.test/v1/meta'), at(FEST))).json()).phase, 'festival');
  assert.equal((await handle(new Request('https://x.test/v1/search?q=alpha'), at(ENDED))).status, 200);
  assert.equal((await (await handle(new Request('https://x.test/?format=json'), at(ENDED))).json()).connector_phase, 'ended');
});
