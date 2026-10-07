import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { handle, _resetCacheForTests } from '../src/handler.js';
import { _resetEnrichMemoForTests } from '../src/core/enrich.js';
import { normalizeRecord } from '../src/core/normalize.js';
import { INSTRUCTIONS, TOOLS } from '../src/mcp.js';
import { landingHtml } from '../src/landing.js';

// /v1/plan/day reaches every route: the MCP connector (Claude and ChatGPT), the ChatGPT Actions schema,
// the API index, and the visitor manual on the landing page.
const base = { borough: 'Manhattan', city: 'New York', state: 'NY', neighborhood: 'Morningside Heights' };
const tourRec = { ...base, record_id: 'recV', slug: 'vertical-26', experience_name: 'Cathedral Vertical Tour', access_type: ['Sold Out'],
  ticketed_session_day_1_date: 'Sat, Oct 17', ticketed_session_start_time_1: '12:00 PM', ticketed_session_end_time_1: '1:30 PM',
  ticketed_session_day_2_date: 'Sat, Oct 17', ticketed_session_start_time_2: '2:00 PM', ticketed_session_end_time_2: '3:30 PM' };
const hallRec = { ...base, record_id: 'recH', slug: 'hall-26', experience_name: 'Near Hall', access_type: ['Drop-In'], address_1: '1 Main St', zip: '10025',
  saturday_open_access_date: 'Sat, Oct 17', sat_opening_time: '10:00 AM', sat_closing_time: '5:00 PM', short_description: 'Historic hall.' };
const snapshot = { generated_at: '2026-10-01T00:00:00Z', sites: [
  { ...normalizeRecord(tourRec), geo: { lat: 40.8038, lng: -73.9619, conf: 'name' } },
  { ...normalizeRecord(hallRec), geo: { lat: 40.8045, lng: -73.9625, conf: 'address' } },
] };
const deps = { snapshot, fetchImpl: async () => new Response('', { status: 503 }), realNow: new Date('2026-10-17T14:30:00Z') };
const rpc = async (method, params) => (await (await handle(new Request('https://x.test/mcp', { method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }), deps)).json());

beforeEach(() => { _resetCacheForTests(); _resetEnrichMemoForTests(); });

test('connector lists ohny_plan_day with a ticket-first schema and read-only annotations', async () => {
  const tool = (await rpc('tools/list')).result.tools.find((t) => t.name === 'ohny_plan_day');
  assert.ok(tool, 'ohny_plan_day listed');
  assert.deepEqual(tool.inputSchema.required, ['ticket']);
  for (const k of ['ticket', 'from', 'near', 'interests', 'mode', 'child_age', 'wheelchair', 'limit', 'now']) assert.ok(tool.inputSchema.properties[k], k);
  assert.equal(tool.annotations.readOnlyHint, true);
  assert.match(tool.description, /Open House New York/);
  assert.match(tool.description, /ticket/i);
});

test('ohny_plan_day calls /v1/plan/day and returns the plan as JSON with the reminder', async () => {
  const r = (await rpc('tools/call', { name: 'ohny_plan_day', arguments: { ticket: 'vertical tour@2026-10-17T14:00', from: '40.8040,-73.9630' } })).result;
  assert.equal(r.isError, undefined);
  const body = JSON.parse(r.content[0].text);
  assert.ok(body.ohny_reminder);
  assert.equal(body.ok, true);
  assert.equal(body.tickets[0].slug, 'vertical-26');
  assert.ok(Array.isArray(body.itinerary));
});

test('ohny_plan_day without a ticket is an isError result that explains the format', async () => {
  const r = (await rpc('tools/call', { name: 'ohny_plan_day', arguments: {} })).result;
  assert.equal(r.isError, true);
  assert.match(r.content[0].text, /ticket/);
});

test('connector instructions point to ohny_plan_day for planning around held tickets', () => {
  assert.match(INSTRUCTIONS, /ohny_plan_day/);
  assert.ok(TOOLS.some((t) => t.name === 'ohny_plan_day' && t.path === '/v1/plan/day'));
});

test('after the festival ohny_plan_day is not offered', async () => {
  const after = { ...deps, realNow: new Date('2026-10-25T18:30:00Z') };
  const list = await (await handle(new Request('https://x.test/mcp', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }) }), after)).json();
  assert.ok(!list.result.tools.some((t) => t.name === 'ohny_plan_day'));
});

test('ChatGPT Actions schema documents /v1/plan/day (operationId planDay, ticket required)', async () => {
  const y = await readFile(new URL('../openapi.yaml', import.meta.url), 'utf8');
  const block = y.slice(y.indexOf('/v1/plan/day:'), y.indexOf('/v1/search:'));
  assert.ok(y.includes('/v1/plan/day:'), 'path present');
  assert.match(block, /operationId: planDay/);
  assert.match(block, /name: ticket, in: query, required: true/);
  for (const p of ['from', 'near', 'interests', 'mode', 'child_age', 'wheelchair', 'limit', 'now']) assert.match(block, new RegExp(`name: ${p},`), p);
});

test('the API index lists plan/day', async () => {
  const body = await (await handle(new Request('https://x.test/v1'), deps)).json();
  assert.ok(Object.keys(body.endpoints).some((k) => k.startsWith('GET /v1/plan/day')));
});

test('the landing-page manual explains planning around a ticket you hold, including a wrong time', () => {
  const html = landingHtml();
  const plan = html.slice(html.indexOf('id="m-plan"'), html.indexOf('id="m-directions"'));
  assert.match(plan, /St\. John the Divine|vertical tour/i);
  assert.match(plan, /one step|in one go|straight away/i);
  assert.match(plan, /real (session )?times|listed times/i);
});
