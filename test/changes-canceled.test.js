import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { handle, _resetCacheForTests } from '../src/handler.js';
import { _resetEnrichMemoForTests } from '../src/core/enrich.js';
import { normalizeRecord } from '../src/core/normalize.js';
import { TOOLS } from '../src/mcp.js';

// "Anything canceled?" must list every site canceled right now, not only sites canceled since the snapshot.
// On 2026-10-07 two sites were already canceled when the snapshot was taken, so /v1/changes said nothing
// was canceled and Gemini and Claude told visitors so.
const rec = (o) => ({ access_type: ['Drop-In'], borough: 'Manhattan', neighborhood: 'SoHo', city: 'New York', state: 'NY',
  sunday_open_access_date: 'Sun, Oct 18', sun_opening_time: '12:00 PM', sun_closing_time: '4:00 PM', ...o });
const old = rec({ record_id: 'recO', slug: 'old-26', experience_name: 'Long Canceled Lab', access_type: ['Canceled'] });
const fresh = rec({ record_id: 'recF', slug: 'fresh-26', experience_name: 'Just Canceled Hall' });
const open = rec({ record_id: 'recK', slug: 'open-26', experience_name: 'Still Open Hall' });
const gone = rec({ record_id: 'recG', slug: 'gone-26', experience_name: 'Vanished Tower' });
const snapshot = { generated_at: '2026-10-01T00:00:00Z', sites: [old, fresh, open, gone].map((r) => ({ ...normalizeRecord(r), geo: { lat: 40.73, lng: -73.99, conf: 'address' } })) };
const live = [old, { ...fresh, access_type: ['Canceled'] }, open];   // gone-26 dropped from the live list
const deps = () => ({ snapshot, realNow: new Date('2026-10-08T12:00:00Z'),
  fetchImpl: async (url) => url.endsWith('/festival.json') ? Response.json({ records: live }) : new Response('', { status: 404 }) });
const get = async (path) => handle(new Request(`https://x.test${path}`), deps());

beforeEach(() => { _resetCacheForTests(); _resetEnrichMemoForTests(); });

test('/v1/changes lists every site canceled now, including ones already canceled in the snapshot', async () => {
  const body = await (await get('/v1/changes')).json();
  const slugs = body.canceled_now.map((c) => c.slug).sort();
  assert.deepEqual(slugs, ['fresh-26', 'gone-26', 'old-26']);
  const oldOne = body.canceled_now.find((c) => c.slug === 'old-26');
  assert.equal(oldOne.name, 'Long Canceled Lab');
  assert.deepEqual(oldOne.days, ['Sun Oct 18']);
  assert.equal(oldOne.since_snapshot, false);
  assert.equal(body.canceled_now.find((c) => c.slug === 'fresh-26').since_snapshot, true);
  assert.equal(body.canceled_now.find((c) => c.slug === 'gone-26').removed, true);
  assert.ok(!slugs.includes('open-26'));
});

test('the existing since-snapshot diff is unchanged', async () => {
  const body = await (await get('/v1/changes')).json();
  assert.deepEqual(body.changes.removed.map((s) => s.slug), ['gone-26']);
  assert.deepEqual(body.changes.modified.map((s) => s.slug), ['fresh-26']);
});

test('the changes feed page lists all canceled sites, even when nothing else changed', async () => {
  const md = await (await get('/feed/changes.md')).text();
  assert.match(md, /## Canceled now/);
  assert.match(md, /Long Canceled Lab \(old-26\)/);
  assert.match(md, /Just Canceled Hall \(fresh-26\)/);
});

test('/v1/changes?format=text names the canceled sites first', async () => {
  const res = await get('/v1/changes?format=text');
  assert.match(res.headers.get('content-type'), /text\/plain/);
  const t = await res.text();
  assert.match(t, /CANCELED NOW: 3/);
  assert.ok(t.indexOf('Long Canceled Lab') < t.indexOf('CHANGED SINCE'));
});

test('the connector tool says it lists everything canceled now', () => {
  const tool = TOOLS.find((x) => x.name === 'ohny_changes');
  assert.match(tool.description, /canceled now|currently canceled/i);
});
