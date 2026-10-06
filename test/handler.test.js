import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { handle, _resetCacheForTests } from '../src/handler.js';
import { _resetEnrichMemoForTests } from '../src/core/enrich.js';
import { normalizeRecord } from '../src/core/normalize.js';

const rec = (o) => ({ access_type: ['Drop-In'], borough: 'Manhattan', neighborhood: 'SoHo', city: 'New York', state: 'NY',
  saturday_open_access_date: 'Sat, Oct 17', sat_opening_time: '10:00 AM', sat_closing_time: '5:00 PM', ...o });

const liveRecords = [
  rec({ record_id: 'recA', slug: 'a-26', experience_name: 'Alpha Hall', address_1: '1 Main St', zip: '10012' }),
  rec({ record_id: 'recB', slug: 'b-26', experience_name: 'Beta Roof', address_1: '2 Main St', zip: '10012', access_type: ['Canceled'] }),
];
const snapshot = {
  generated_at: '2026-10-01T00:00:00Z',
  sites: [
    { ...normalizeRecord(rec({ record_id: 'recA', slug: 'a-26', experience_name: 'Alpha Hall', address_1: '1 Main St', zip: '10012', short_description: 'Rooftop garden.', description: 'Long.' })),
      geo: { lat: 40.7301, lng: -73.9951, conf: 'address' } },
    { ...normalizeRecord(rec({ record_id: 'recB', slug: 'b-26', experience_name: 'Beta Roof', address_1: '2 Main St', zip: '10012', short_description: 'Rooftop.' })),
      geo: { lat: 40.7302, lng: -73.9952, conf: 'address' } },
  ],
};

const mkFetch = (over = {}) => async (url) => {
  if (over.fail) return new Response('nope', { status: 503 });
  if (url.endsWith('/data/festival.json')) return Response.json({ records: over.records ?? liveRecords });
  const id = /\/data\/(rec\w+)\.json$/.exec(url)?.[1];
  if (id) return Response.json({ id, data: { ...liveRecords.find((r) => r.record_id === id), description: `Fresh text for ${id}`, access_notes: 'Bring ID.' } });
  return new Response('', { status: 404 });
};
const call = (path, over) => handle(new Request(`https://x.test${path}`), { snapshot, fetchImpl: mkFetch(over), realNow: new Date('2026-10-17T18:30:00Z') });

beforeEach(() => { _resetCacheForTests(); _resetEnrichMemoForTests(); });

test('nearby uses live status: canceled upstream means never recommended', async () => {
  const body = await (await call('/v1/nearby?lat=40.73&lng=-73.996')).json();
  assert.equal(body.live, true);
  assert.deepEqual(body.results.map((r) => r.slug), ['a-26']);
  assert.equal(body.now.source, 'real');
  assert.equal(body.now.new_york_time, '2026-10-17T14:30');
});

test('now override is honoured and reported', async () => {
  const body = await (await call('/v1/nearby?lat=40.73&lng=-73.996&now=2026-10-17T18:00')).json();
  assert.equal(body.results.length, 0);                    // closed at 6 PM
  assert.equal(body.now.source, 'override');
  const bad = await call('/v1/nearby?lat=40.73&lng=-73.996&now=soon');
  assert.equal(bad.status, 400);
});

test('nearby needs a location and explains how to get one', async () => {
  const r = await call('/v1/nearby');
  assert.equal(r.status, 400);
  assert.match((await r.json()).hint, /cross street/);
});

test('near=<slug> works', async () => {
  const body = await (await call('/v1/nearby?near=b-26')).json();
  assert.deepEqual(body.results.map((r) => r.slug), ['a-26']);
});

test('falls back to the saved copy, and says so, when ohny.org is unreachable', async () => {
  const body = await (await call('/v1/nearby?lat=40.73&lng=-73.996', { fail: true })).json();
  assert.equal(body.live, false);
  assert.match(body.warning, /saved copy/);
  assert.ok(body.results.length > 0);
});

test('site detail is fetched fresh and includes directions and check-in info', async () => {
  const body = await (await call('/v1/site/a-26')).json();
  assert.equal(body.detail_fetched_live, true);
  assert.equal(body.site.description, 'Fresh text for recA');
  assert.equal(body.site.status.state, 'open_now');
  assert.match(body.site.maps.google_transit, /google\.com\/maps/);
  assert.equal(body.site.checkin.record_id, 'recA');
  assert.equal((await call('/v1/site/nope')).status, 404);
});

test('changes lists upstream edits since the snapshot', async () => {
  const body = await (await call('/v1/changes')).json();
  assert.equal(body.changes.modified.length, 1);
  assert.equal(body.changes.modified[0].slug, 'b-26');
});

test('search finds by name', async () => {
  const body = await (await call('/v1/search?q=alpha')).json();
  assert.equal(body.results[0].slug, 'a-26');
});

test('a site added after the snapshot is found, described and placed (no rebuild needed)', async () => {
  const added = rec({ record_id: 'recNEW', slug: 'new-26', experience_name: 'Newly Added Hall', address_1: '9 Fresh St', zip: '10012' });
  const records = [...liveRecords, added];
  const base = mkFetch({ records });
  const fetchImpl = async (url, init) => {
    if (String(url).startsWith('https://nominatim.')) return Response.json([{ lat: '40.7310', lon: '-73.9960' }]);
    if (url.endsWith('/data/recNEW.json')) return Response.json({ id: 'recNEW', data: { ...added, short_description: 'Opened to visitors at the last minute.', description: 'Fresh.' } });
    return base(url, init);
  };
  const r = await (await handle(new Request('https://x.test/v1/nearby?lat=40.7295&lng=-73.9965&limit=10'),
    { snapshot, fetchImpl, realNow: new Date('2026-10-17T18:30:00Z') })).json();
  const n = r.results.find((c) => c.slug === 'new-26');
  assert.ok(n, 'new site should appear in nearby');
  assert.equal(n.summary, 'Opened to visitors at the last minute.');
  assert.equal(n.distance_approx, undefined);              // exact: looked up live
  const ch = await (await handle(new Request('https://x.test/v1/changes'), { snapshot, fetchImpl, realNow: new Date('2026-10-17T18:30:00Z') })).json();
  assert.equal(ch.changes.added[0].slug, 'new-26');
});

test('a late-added site with no usable address still appears, flagged approximate', async () => {
  const added = rec({ record_id: 'recNEW2', slug: 'new2-26', experience_name: 'Mystery Tour' });   // no address
  const fetchImpl = async (url, init) => url.startsWith('https://nominatim.') ? new Response('', { status: 500 }) : mkFetch({ records: [...liveRecords, added] })(url, init);
  const r = await (await handle(new Request('https://x.test/v1/nearby?lat=40.7295&lng=-73.9965&limit=10'),
    { snapshot, fetchImpl, realNow: new Date('2026-10-17T18:30:00Z') })).json();
  const n = r.results.find((c) => c.slug === 'new2-26');
  assert.ok(n);
  assert.equal(n.distance_approx, true);
});

test('max_walk_min is passed through', async () => {
  const body = await (await call('/v1/nearby?lat=40.73&lng=-73.996&max_walk_min=3')).json();
  assert.equal(body.search.max_walk_min, 3);
});

test('fetch is never called as a method (Cloudflare throws "Illegal invocation" otherwise)', async () => {
  const strict = function (url, init) {
    if (this !== undefined && this !== globalThis) throw new TypeError('Illegal invocation');
    return mkFetch()(url, init);
  };
  const body = await (await handle(new Request('https://x.test/v1/nearby?lat=40.73&lng=-73.996'),
    { snapshot, fetchImpl: strict, realNow: new Date('2026-10-17T18:30:00Z') })).json();
  assert.equal(body.live, true);
});

test('/guide serves the standalone guide as plain text, also under the custom-domain prefix', async () => {
  const { buildStandalone } = await import('../scripts/build-standalone.mjs');
  const expected = await buildStandalone();
  for (const path of ['/guide', '/guide/', '/guide.md', '/ohny/skills/guide', '/ohny/skills/guide.md']) {
    const res = await call(path);
    assert.equal(res.status, 200, path);
    assert.match(res.headers.get('content-type'), /^text\/plain/);
    assert.equal(await res.text(), expected, path);
  }
});

test('/guide needs no live data and rejects non-GET', async () => {
  const res = await call('/guide', { fail: true });
  assert.equal(res.status, 200);
  const post = await handle(new Request('https://x.test/guide', { method: 'POST' }), { snapshot, fetchImpl: mkFetch(), realNow: new Date() });
  assert.equal(post.status, 405);
  assert.equal((await call('/guides')).status, 404);
});
