import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { runSmoke, formatReport } from '../scripts/smoke-test.mjs';
import { handle, _resetCacheForTests } from '../src/handler.js';
import { _resetEnrichMemoForTests } from '../src/core/enrich.js';
import { normalizeRecord } from '../src/core/normalize.js';

// A tiny lineup that behaves like a busy Saturday, served by the real handler through a fake network.
const rec = (o) => ({ access_type: ['Drop-In'], borough: 'Manhattan', neighborhood: 'Greenwich Village', city: 'New York', state: 'NY',
  saturday_open_access_date: 'Sat, Oct 17', sat_opening_time: '10:00 AM', sat_closing_time: '6:00 PM', ...o });
const live = [
  rec({ record_id: 'recG', slug: 'grolier-26', experience_name: 'Grolier Club', address_1: '47 East 60th Street', zip: '10022', short_description: 'Books.', description: 'Fresh.' }),
  rec({ record_id: 'recV', slug: 'village-26', experience_name: 'Village Hall', address_1: '1 Main St', zip: '10012', short_description: 'History.', description: 'Fresh.' }),
  { record_id: 'recT', slug: 'gct-26', experience_name: 'Grand Central Terminal', access_type: ['Sold Out'], borough: 'Manhattan', neighborhood: 'Midtown', city: 'New York', state: 'NY',
    short_description: 'A tour of the terminal.', description: 'Fresh.',
    ticketed_session_day_1_date: 'Sat, Oct 17', ticketed_session_start_time_1: '4:00 PM', ticketed_session_end_time_1: '5:00 PM' },
];
const snapshot = { generated_at: '2026-10-01T00:00:00Z', sites: live.map((r, i) => ({ ...normalizeRecord(r), geo: i === 2 ? { lat: 40.7527, lng: -73.9772, conf: 'name' } : { lat: 40.73 + i * 0.002, lng: -73.997, conf: 'address' } })) };
const upstream = async (url) => url.endsWith('/festival.json') ? Response.json({ records: live })
  : /\/data\/rec(G|V|T)\.json$/.test(url) ? Response.json({ data: live.find((r) => url.includes(r.record_id)) }) : new Response('', { status: 404 });

const net = (broken) => (url, init) => {
  if (broken) return Promise.resolve(new Response('Bad gateway', { status: 502 }));
  return handle(new Request(url, init), { snapshot, fetchImpl: upstream, realNow: new Date('2026-10-17T18:30:00Z') });
};

beforeEach(() => { _resetCacheForTests(); _resetEnrichMemoForTests(); });

test('smoke test passes against a healthy service (all checks, including the connector)', async () => {
  const report = await runSmoke('https://smoke.test/ohny/skills', { fetchImpl: net(false), minSites: 2 });
  const failed = report.results.filter((r) => !r.ok);
  assert.deepEqual(failed, [], formatReport(report));
  assert.equal(report.ok, true);
  assert.ok(report.results.length >= 14);
});

test('smoke test fails loudly, with a readable report, when the service is down', async () => {
  const report = await runSmoke('https://smoke.test/ohny/skills', { fetchImpl: net(true), minSites: 2 });
  assert.equal(report.ok, false);
  assert.ok(report.results.every((r) => !r.ok));
  assert.match(formatReport(report), /^\nFAIL {2}https:\/\/smoke\.test/);
});

test('smoke test catches stale data and a lost live connection to ohny.org', async () => {
  const down = async (url, init) => handle(new Request(url, init), { snapshot, fetchImpl: async () => new Response('', { status: 503 }), realNow: new Date('2026-10-17T18:30:00Z') });
  const report = await runSmoke('https://smoke.test/ohny/skills', { fetchImpl: down, minSites: 2 });
  const fresh = report.results.find((r) => r.name.startsWith('freshness'));
  assert.equal(fresh.ok, false);
  assert.match(fresh.detail, /live is false/);
});
