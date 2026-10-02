import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { normalizeRecord } from '../src/core/normalize.js';
import { nearby } from '../src/core/search.js';
import { wallMinutes } from '../src/core/time.js';
import { compactSite, buildFallback, PATHS } from '../scripts/build-fallback.mjs';

const PY = 'python3';
const SCRIPT = new URL('../skills/ohny/scripts/ohny_offline.py', import.meta.url).pathname;
const havePython = spawnSync(PY, ['--version']).status === 0;
const opts = { skip: !havePython && 'python3 not available' };

const rec = (o) => ({ access_type: ['Drop-In'], borough: 'Manhattan', neighborhood: 'Greenwich Village', city: 'New York', state: 'NY',
  address_1: '1 Main St', zip: '10012', saturday_open_access_date: 'Sat, Oct 17', sat_opening_time: '10:00 AM', sat_closing_time: '5:00 PM', ...o });
const tour = (o) => rec({ access_type: ['Ticketed'], address_1: undefined, zip: undefined, saturday_open_access_date: undefined, sat_opening_time: undefined, sat_closing_time: undefined,
  ticketed_session_day_1_date: 'Sat, Oct 17', ticketed_session_start_time_1: '1:00 PM', ticketed_session_end_time_1: '2:00 PM',
  ticketed_session_day_2_date: 'Sat, Oct 17', ticketed_session_start_time_2: '3:00 PM', ticketed_session_end_time_2: '4:00 PM', ticketed_session_url_1: 'https://tix.example/1', ...o });
const g = (lat, lng = -73.9950, conf = 'address') => ({ lat, lng, conf });
const mk = (r, geo, extra = {}) => ({ ...normalizeRecord(r, r.record_id), geo, ...extra });

const sites = [
  mk(rec({ record_id: 'r1', slug: 'roof', experience_name: 'Roof Garden', short_description: 'A rooftop terrace with skyline views.' }), g(40.7310), { related: ['quiet', 'kidsplace'] }),
  mk(rec({ record_id: 'r2', slug: 'quiet', experience_name: 'Quiet Office', short_description: 'An accounting office.' }), g(40.7320)),
  mk(rec({ record_id: 'r3', slug: 'closing', experience_name: 'Closing Soon Hall', short_description: 'History of the neighborhood.', sat_closing_time: '1:40 PM' }), g(40.7330)),
  mk(rec({ record_id: 'r4', slug: 'canceled', experience_name: 'Canceled Place', access_type: ['Canceled'], short_description: 'Rooftop views.' }), g(40.7305)),
  mk(tour({ record_id: 'r5', slug: 'tour', experience_name: 'Tower Tour', short_description: 'A skyscraper rooftop tour.' }), g(40.7340, -73.9960, 'name')),
  mk(tour({ record_id: 'r6', slug: 'soldout', experience_name: 'Sold Out Tour', access_type: ['Sold Out'] }), g(40.7305)),
  mk(rec({ record_id: 'r7', slug: 'adults', experience_name: 'Adults Only', age_restrictions: 'Ages 18+', short_description: 'Cocktails and rooftop views.' }), g(40.7315)),
  mk(rec({ record_id: 'r8', slug: 'steps', experience_name: 'Up The Stairs', wheelchair_accessibility: ['Not wheelchair accessible'], short_description: 'Rooftop access by stairs.' }), g(40.7318)),
  mk(rec({ record_id: 'r9', slug: 'kidsplace', experience_name: 'Kids Place', family_activities: 'Scavenger hunt', short_description: 'Hands-on fun for families.' }), g(40.7325)),
  mk(rec({ record_id: 'r10', slug: 'far', experience_name: 'Far Away Farm', short_description: 'A farm and garden.', borough: 'Queens' }), g(40.7600, -73.9200)),
];
const dir = mkdtempSync(join(tmpdir(), 'ohny-'));
const dataFile = join(dir, 'lineup.json');
writeFileSync(dataFile, JSON.stringify({ generated_at: '2026-10-01T00:00:00.000Z', sites: sites.map(compactSite) }));

const runPy = (args) => {
  const r = spawnSync(PY, [SCRIPT, '--data', dataFile, ...args, '--no-live'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
};
const summarize = (body) => ({
  total: body.total,
  results: body.results.map((c) => ({ slug: c.slug, walk: c.walk_min, km: c.distance_km, status: c.status, notes: c.group_notes ?? null,
    fits: c.fits_interests ?? null, sug: c.ohny_suggests ?? null, kid: c.kid_friendly ?? null, left: c.time_left_on_arrival_min })),
  skipped: (body.skipped ?? []).map((s) => ({ slug: s.slug, reason: s.reason, why: s.why, walk: s.walk_min })),
  off: (body.ohny_suggests_but_not_your_interests ?? []).map((s) => s.slug),
});

const scenarios = [
  ['plain, busy Saturday', { now: '2026-10-17T13:30', lat: 40.7300, lng: -73.9950 }, ['--now', '2026-10-17T13:30', '--lat', '40.73', '--lng', '-73.995', '--limit', '10']],
  ['interests + 20 min walk', { now: '2026-10-17T13:30', lat: 40.73, lng: -73.995, interests: 'rooftops', maxWalkMin: 20 }, ['--now', '2026-10-17T13:30', '--lat', '40.73', '--lng', '-73.995', '--limit', '10', '--interests', 'rooftops', '--max-walk-min', '20']],
  ['near a site (OHNY picks first, off-interest listed)', { now: '2026-10-17T13:30', near: 'roof', interests: 'history' }, ['--now', '2026-10-17T13:30', '--near', 'roof', '--limit', '10', '--interests', 'history']],
  ['child and wheelchair', { now: '2026-10-17T13:30', lat: 40.73, lng: -73.995, childAge: 7, wheelchair: true }, ['--now', '2026-10-17T13:30', '--lat', '40.73', '--lng', '-73.995', '--limit', '10', '--child-age', '7', '--wheelchair']],
  ['late afternoon, arrival-aware', { now: '2026-10-17T16:48', lat: 40.73, lng: -73.995 }, ['--now', '2026-10-17T16:48', '--lat', '40.73', '--lng', '-73.995', '--limit', '10']],
  ['no ticketed, paged', { now: '2026-10-17T13:30', lat: 40.73, lng: -73.995, includeTicketed: false, limit: 2, offset: 1 }, ['--now', '2026-10-17T13:30', '--lat', '40.73', '--lng', '-73.995', '--no-ticketed', '--limit', '2', '--offset', '1']],
];
for (const [name, jsOpts, pyArgs] of scenarios) {
  test(`offline tool matches the live service logic: ${name}`, opts, () => {
    const [d, t] = jsOpts.now.split('T');
    const [h, m] = t.split(':').map(Number);
    let ref = jsOpts;
    if (jsOpts.near) { const s = sites.find((x) => x.slug === jsOpts.near); ref = { ...jsOpts, lat: s.geo.lat, lng: s.geo.lng, suggested: s.related, exclude: [s.slug] }; }
    const js = nearby(sites, { limit: 10, ...ref, nowAbs: wallMinutes(d, h * 60 + m) });
    assert.deepEqual(summarize(runPy(['nearby', ...pyArgs])), summarize(js));
  });
}

test('offline tool: search and site commands work and say when data is not live', opts, () => {
  const s = runPy(['search', 'roof', '--now', '2026-10-17T13:30']);
  assert.equal(s.results[0].slug, 'roof');
  assert.equal(s.source.live, false);
  assert.match(s.source.warning, /SAVED COPY/);
  const site = runPy(['site', 'roof', '--now', '2026-10-17T13:30']);
  assert.equal(site.site.status.state, 'open_now');
  assert.match(site.site.maps.google_transit, /google\.com\/maps/);
  assert.deepEqual(site.site.related_sites.map((x) => x.slug), ['quiet', 'kidsplace']);
});

test('offline tool: friendly errors', opts, () => {
  const r = spawnSync(PY, [SCRIPT, '--data', dataFile, 'nearby', '--no-live'], { encoding: 'utf8' });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /cross street/);
});

test('bundled offline files are up to date (run: npm run build:fallback) and consistent', async () => {
  const files = await buildFallback();
  for (const [path, text] of Object.entries(files)) assert.equal(readFileSync(path, 'utf8'), text, `${path} is stale`);
  const bundled = JSON.parse(readFileSync(PATHS.lineup, 'utf8'));
  assert.ok(bundled.sites.length >= 300);
  assert.ok(bundled.sites.every((s) => s.slug && s.name && Array.isArray(s.windows)));
});

test('bundled assets work end to end with the real offline tool', opts, () => {
  const r = spawnSync(PY, [SCRIPT, 'nearby', '--lat', '40.7308', '--lng', '-73.9973', '--max-walk-min', '20', '--now', '2026-10-17T14:30', '--no-live'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const body = JSON.parse(r.stdout);
  assert.ok(body.results.length > 0 && body.results.every((c) => c.name && c.walk_min && c.status));
});

test('saved lists are phone-sized, complete, and cross-referenced (no stale files)', async () => {
  const { readdirSync, statSync } = await import('node:fs');
  const files = await buildFallback();
  const expected = Object.keys(files).filter((p) => p.endsWith('.md')).map((p) => p.split('/').pop()).sort();
  assert.deepEqual(readdirSync(PATHS.dir).sort(), expected, 'unexpected or stale file in assets/lineup');

  const areas = expected.filter((f) => !['index.md', 'neighborhoods.md'].includes(f));
  const index = readFileSync(join(PATHS.dir, 'index.md'), 'utf8');
  const hoods = readFileSync(join(PATHS.dir, 'neighborhoods.md'), 'utf8');
  const seen = [];
  for (const f of areas) {
    const full = join(PATHS.dir, f);
    assert.ok(statSync(full).size < 20 * 1024, `${f} is too big to read comfortably on a phone`);
    assert.ok(index.includes(`- ${f} |`), `${f} missing from index.md`);
    seen.push(...[...readFileSync(full, 'utf8').matchAll(/^- (.+?) \(rec\w+\) \|/gm)].map((m) => m[1]));
  }
  assert.ok(statSync(join(PATHS.dir, 'index.md')).size < 6 * 1024, 'index must stay small');
  const bundled = JSON.parse(readFileSync(PATHS.lineup, 'utf8')).sites.map((s) => s.slug).sort();
  assert.deepEqual([...seen].sort(), bundled, 'every site must appear in exactly one area list');
  for (const [, list] of hoods.matchAll(/^- .*?: (.+)$/gm)) for (const f of list.split(', ')) assert.ok(areas.includes(f), `neighborhoods.md points at missing ${f}`);
});
