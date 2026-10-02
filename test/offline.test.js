import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { normalizeRecord } from '../src/core/normalize.js';
import { nearby } from '../src/core/search.js';
import { wallMinutes } from '../src/core/time.js';
import { compactSite, buildFallback, PATHS, RAW_BASE } from '../scripts/build-fallback.mjs';

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
  range: body.in_range_total,
  breakdown: body.in_range_breakdown,
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
    assert.ok(index.includes(`${RAW_BASE}/${f}`), `${f}: index.md must give the full literal address`);
    assert.ok(hoods.includes(`- ${f}: ${RAW_BASE}/${f}`), `${f}: neighborhoods.md legend must give the full literal address`);
    const text = readFileSync(full, 'utf8');
    const lines = text.split('\n').filter((l) => l.startsWith('- '));
    for (const l of lines) assert.match(l, /\| LIVE: https:\/\/ohny\.org\/data\/rec\w+\.json$/, `${f}: line without a literal LIVE link`);
    seen.push(...lines.map((l) => l.slice(2).split(' | ')[0]));
  }
  assert.ok(statSync(join(PATHS.dir, 'index.md')).size < 6 * 1024, 'index must stay small');
  assert.ok(statSync(join(PATHS.dir, 'neighborhoods.md')).size < 8 * 1024, 'neighborhood map must stay small');
  const bundled = JSON.parse(readFileSync(PATHS.lineup, 'utf8')).sites.map((s) => s.slug).sort();
  assert.deepEqual([...seen].sort(), bundled, 'every site must appear in exactly one area list');
  for (const [, list] of hoods.split('Neighborhoods:')[1].matchAll(/^- .*?: (.+)$/gm)) for (const f of list.split(', ')) assert.ok(areas.includes(f), `neighborhoods.md points at missing ${f}`);
});

test('search: a name that is not in the lineup is an explicit no_match, in JS and in the offline tool', opts, async () => {
  const { search } = await import('../src/core/search.js');
  const nowAbs = wallMinutes('2026-10-17', 14 * 60 + 30);
  const js = search(sites, { q: 'zebra tower', nowAbs });
  assert.equal(js.no_match, true);
  assert.equal(js.results.length, 0);
  assert.equal(js.searched_sites, sites.length);
  assert.ok(js.partial_matches.some((c) => c.slug === 'tour'));                  // "Tower Tour" is only a partial match
  assert.match(js.message, /no site by that name/);
  const py = runPy(['search', 'zebra tower', '--now', '2026-10-17T14:30']);
  assert.equal(py.no_match, true);
  assert.deepEqual(py.partial_matches.map((c) => c.slug), js.partial_matches.map((c) => c.slug));
  // a real name still works, and filler words don't break it
  assert.equal(search(sites, { q: 'the Roof Garden', nowAbs }).results[0].slug, 'roof');
  assert.equal(runPy(['search', 'the Roof Garden', '--now', '2026-10-17T14:30']).results[0].slug, 'roof');
});

test('nearby reports how many places were in range, in JS and in the offline tool', opts, () => {
  const [d, t] = ['2026-10-17', '13:30'];
  const js = nearby(sites, { lat: 40.73, lng: -73.995, nowAbs: wallMinutes(d, 13 * 60 + 30), limit: 10, maxWalkMin: 20 });
  const py = runPy(['nearby', '--now', '2026-10-17T13:30', '--lat', '40.73', '--lng', '-73.995', '--limit', '10', '--max-walk-min', '20']);
  assert.ok(js.in_range_total >= js.total && js.in_range_total > 0);
  assert.equal(py.in_range_total, js.in_range_total);
});

test('in_range_breakdown accounts for every place in range (JS and offline tool)', opts, () => {
  const now = '2026-10-17T16:48';
  const [h, m] = [16, 48];
  const js = nearby(sites, { lat: 40.73, lng: -73.995, nowAbs: wallMinutes('2026-10-17', h * 60 + m), limit: 10 });
  const sum = Object.values(js.in_range_breakdown).reduce((a, b) => a + b, 0);
  assert.equal(sum, js.in_range_total, JSON.stringify(js.in_range_breakdown));
  assert.ok(js.in_range_breakdown.closes_before_you_arrive >= 1 || js.in_range_breakdown.no_more_times >= 1);
  const py = runPy(['nearby', '--now', now, '--lat', '40.73', '--lng', '-73.995', '--limit', '10']);
  assert.deepEqual(py.in_range_breakdown, js.in_range_breakdown);
});

test('results carry the exact OHNY record link for each site', opts, () => {
  const js = nearby(sites, { lat: 40.73, lng: -73.995, nowAbs: wallMinutes('2026-10-17', 13 * 60 + 30), limit: 10 });
  assert.ok(js.results.length > 0 && js.results.every((c) => /^https:\/\/ohny\.org\/data\/r\d+\.json$/.test(c.official_record)));
  const py = runPy(['nearby', '--now', '2026-10-17T13:30', '--lat', '40.73', '--lng', '-73.995', '--limit', '10']);
  assert.deepEqual(py.results.map((c) => c.official_record), js.results.map((c) => c.official_record));
});
