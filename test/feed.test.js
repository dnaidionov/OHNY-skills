import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { handle, _resetCacheForTests } from '../src/handler.js';
import { _resetEnrichMemoForTests } from '../src/core/enrich.js';
import { normalizeRecord } from '../src/core/normalize.js';

// Markdown feed for chatbots that can only read public web pages (Gemini): data only, no visitor input,
// no "open now" (the page can't know the visitor's time), always labeled live or saved.
const rec = (o) => ({ access_type: ['Drop-In'], borough: 'Manhattan', neighborhood: 'SoHo', city: 'New York', state: 'NY',
  saturday_open_access_date: 'Sat, Oct 17', sat_opening_time: '10:00 AM', sat_closing_time: '5:00 PM', ...o });

const liveRecords = [
  rec({ record_id: 'recA', slug: 'a-26', experience_name: 'Alpha Hall', address_1: '1 Main St', zip: '10012' }),
  rec({ record_id: 'recB', slug: 'b-26', experience_name: 'Beta Roof', address_1: '2 Main St', zip: '10012', access_type: ['Canceled'] }),
  rec({ record_id: 'recC', slug: 'c-26', experience_name: 'Gamma | Works', address_1: '3 Main St', zip: '10012', access_type: ['Ticketed'] }),
];
const snapshot = {
  generated_at: '2026-10-01T00:00:00Z',
  sites: [
    { ...normalizeRecord(rec({ record_id: 'recA', slug: 'a-26', experience_name: 'Alpha Hall', address_1: '1 Main St', zip: '10012', short_description: 'Rooftop garden.', description: 'Long.' })), geo: { lat: 40.7301, lng: -73.9951, conf: 'address' } },
    { ...normalizeRecord(rec({ record_id: 'recB', slug: 'b-26', experience_name: 'Beta Roof', address_1: '2 Main St', zip: '10012', short_description: 'Rooftop.' })), geo: { lat: 40.7302, lng: -73.9952, conf: 'address' } },
    { ...normalizeRecord(rec({ record_id: 'recC', slug: 'c-26', experience_name: 'Gamma | Works', address_1: '3 Main St', zip: '10012', access_type: ['Ticketed'], short_description: 'A | pipe.' })), geo: { lat: 40.7303, lng: -73.9953, conf: 'address' } },
  ],
};

const mkFetch = (over = {}) => async (url) => {
  if (over.fail) return new Response('nope', { status: 503 });
  if (url.endsWith('/data/festival.json')) return Response.json({ records: over.records ?? liveRecords });
  const id = /\/data\/(rec\w+)\.json$/.exec(url)?.[1];
  if (id) return Response.json({ id, data: { ...liveRecords.find((r) => r.record_id === id), description: `Fresh text for ${id}`, access_notes: 'Bring ID.' } });
  return new Response('', { status: 404 });
};
const call = (path, over, init) => handle(new Request(`https://x.test${path}`, init), { snapshot, fetchImpl: mkFetch(over), realNow: new Date('2026-10-17T18:30:00Z') });
const text = async (path, over) => (await call(path, over)).text();

beforeEach(() => { _resetCacheForTests(); _resetEnrichMemoForTests(); });

test('index.md is public plain-text markdown, under the custom-domain prefix too', async () => {
  for (const path of ['/feed/index.md', '/feed/index.md/', '/ohny/skills/feed/index.md']) {
    const res = await call(path);
    assert.equal(res.status, 200, path);
    assert.match(res.headers.get('content-type'), /^text\/(plain|markdown)/);
    assert.match(res.headers.get('cache-control'), /max-age=\d+/);
    assert.equal(res.headers.get('access-control-allow-origin'), '*');
  }
});

test('index.md starts with a live freshness label and an as-of time', async () => {
  const md = await text('/feed/index.md');
  assert.match(md.split('\n').slice(0, 8).join('\n'), /Live from ohny\.org/i);
  assert.match(md, /as of \d{4}-\d\d-\d\dT\d\d:\d\d/i);
});

test('index.md says plainly when it is the saved copy', async () => {
  const md = await text('/feed/index.md', { fail: true });
  assert.match(md.split('\n').slice(0, 8).join('\n'), /Saved copy/i);
  assert.match(md, /2026-10-01T00:00:00Z/);
  assert.doesNotMatch(md.split('\n').slice(0, 8).join('\n'), /Live from/i);
});

test('index.md has one table row per site with slug, name, area, coordinates, access and times', async () => {
  const md = await text('/feed/index.md');
  const row = md.split('\n').find((l) => l.includes('a-26'));
  assert.ok(row, 'row for a-26');
  for (const part of ['Alpha Hall', 'SoHo', 'Manhattan', '40.7301', '-73.9951', 'Drop-In', '10:00 AM', '5:00 PM']) assert.ok(row.includes(part), part);
  assert.match(row, /Sat.*10\/17|2026-10-17/);
  assert.ok(md.split('\n').some((l) => l.includes('b-26')) && md.split('\n').some((l) => l.includes('c-26')));
});

test('canceled sites are marked canceled and listed first, before the table', async () => {
  const md = await text('/feed/index.md');
  const canceled = md.indexOf('Beta Roof');
  assert.ok(canceled > -1 && canceled < md.indexOf('| Slug'), 'canceled listed above the table');
  assert.match(md.split('\n').find((l) => l.includes('b-26') && l.startsWith('|')), /CANCELED/);
  assert.doesNotMatch(md.split('\n').find((l) => l.includes('a-26') && l.startsWith('|')), /CANCELED/);
});

test('pipes in names do not break table rows', async () => {
  const row = (await text('/feed/index.md')).split('\n').find((l) => l.includes('c-26') && l.startsWith('|'));
  const cols = row.replace(/\\\|/g, '').split('|').length;
  const header = (await text('/feed/index.md')).split('\n').find((l) => l.startsWith('| Slug')).split('|').length;
  assert.equal(cols, header);
});

test('feed never claims "open now" or takes visitor input', async () => {
  assert.equal((await call('/feed/index.md')).status, 200);
  const md = await text('/feed/index.md?lat=40.7&lng=-74&now=2026-10-17T12:00&interests=art');
  assert.doesNotMatch(md, /open now/i);
  assert.equal(md, await text('/feed/index.md'), 'query string must not change the output');
});

test('index.md stays compact (no descriptions, no ticket URLs)', async () => {
  assert.equal((await call('/feed/index.md')).status, 200);
  const md = await text('/feed/index.md');
  assert.doesNotMatch(md, /Fresh text|Long\./);
  assert.ok(md.length < 20_000);
});

test('changes.md lists cancellations, new and changed sites with the freshness label', async () => {
  const md = await text('/feed/changes.md', { records: [liveRecords[0], liveRecords[1], rec({ record_id: 'recN', slug: 'n-26', experience_name: 'Newcomer', address_1: '9 Main St' })] });
  assert.match(md.split('\n').slice(0, 8).join('\n'), /Live from ohny\.org/i);
  assert.match(md, /Newcomer/);
  assert.match(md, /Removed|Canceled/i);
});

test('changes.md says so when nothing changed', async () => {
  const same = [rec({ record_id: 'recA', slug: 'a-26', experience_name: 'Alpha Hall', address_1: '1 Main St', zip: '10012' }), rec({ record_id: 'recB', slug: 'b-26', experience_name: 'Beta Roof', address_1: '2 Main St', zip: '10012' }), liveRecords[2]];
  assert.match(await text('/feed/changes.md', { records: same }), /no changes/i);
});

test('changes.md works from the saved copy and says it is saved', async () => {
  const res = await call('/feed/changes.md', { fail: true });
  assert.equal(res.status, 200);
  assert.match((await res.text()).split('\n').slice(0, 8).join('\n'), /Saved copy/i);
});

test('feed rejects non-GET and unknown paths; no site pages yet', async () => {
  assert.equal((await call('/feed/index.md')).status, 200);
  assert.equal((await call('/feed/index.md', undefined, { method: 'POST' })).status, 405);
  assert.equal((await call('/feed/nope.md')).status, 404);
  assert.equal((await call('/feed')).status, 404);
});

test('HEAD works like GET without a body, for the feed and the guide (fetchers often probe with HEAD)', async () => {
  for (const path of ['/feed/index.md', '/feed/changes.md', '/guide']) {
    const get = await call(path);
    const head = await call(path, undefined, { method: 'HEAD' });
    assert.equal(head.status, 200, path);
    assert.equal(head.headers.get('content-type'), get.headers.get('content-type'), path);
    assert.equal(await head.text(), '', path);
  }
  assert.equal((await call('/feed/nope.md', undefined, { method: 'HEAD' })).status, 404);
  assert.equal((await call('/feed/index.md', undefined, { method: 'PUT' })).status, 405);
});
