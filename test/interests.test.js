import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRecord } from '../src/core/normalize.js';
import { wallMinutes } from '../src/core/time.js';
import { nearby } from '../src/core/search.js';
import { interpretInterests } from '../src/core/tags.js';

// Visitors say "garden" or "gardens", "rooftop" or "rooftops": both must mean the same thing.
// Live API 2026-10-07: interests=rooftops,gardens near Union Square gave sites 45-73 min away,
// interests=rooftop,garden gave 18-25 min ones.
const PAIRS = [
  ['garden', 'gardens', 'nature'], ['rooftop', 'rooftops', 'views'], ['park', 'parks', 'nature'],
  ['church', 'churches', 'sacred'], ['gallery', 'galleries', 'art'], ['ferry', 'ferries', 'waterfront'],
  ['factory', 'factories', 'industrial'], ['library', 'libraries', 'civic'], ['skyscraper', 'skyscrapers', 'architecture'],
  ['bridge', 'bridges', 'transit'], ['playground', 'playgrounds', 'kids'],
];

test('singular and plural interests give the same tags', () => {
  for (const [one, many, tag] of PAIRS) {
    const a = interpretInterests(one);
    const b = interpretInterests(many);
    assert.ok(a.tags.includes(tag), `${one} -> ${tag} (got ${a.tags})`);
    assert.deepEqual([...a.tags].sort(), [...b.tags].sort(), `${one} vs ${many}`);
  }
});

test('singular and plural interests give the same match words', () => {
  for (const [one, many] of PAIRS) {
    assert.deepEqual(interpretInterests(one).words, interpretInterests(many).words, `${one} vs ${many}`);
  }
  assert.deepEqual(interpretInterests('rooftops and gardens').words, interpretInterests('rooftop and garden').words);
});

test('words that only look plural are left alone', () => {
  assert.deepEqual(interpretInterests('glass').words, ['glass']);
  assert.deepEqual(interpretInterests('campus').words, ['campus']);
  assert.ok(interpretInterests('kids').tags.includes('kids'));
  assert.ok(interpretInterests('views').tags.includes('views'));
});

test('nearby ranks the same sites for singular and plural interests', () => {
  const at = (d, hhmm) => { const [h, m] = hhmm.split(':').map(Number); return wallMinutes(d, h * 60 + m); };
  const site = (slug, text, lat, lng) => ({ ...normalizeRecord({
    record_id: `rec${slug}`, slug, experience_name: slug, access_type: ['Drop-In'], borough: 'Manhattan', neighborhood: 'SoHo',
    address_1: '1 Main St', city: 'New York', state: 'NY', zip: '10012',
    saturday_open_access_date: 'Sat, Oct 17', sat_opening_time: '10:00 AM', sat_closing_time: '6:00 PM', short_description: text,
  }), geo: { lat, lng, conf: 'address' } });
  const sites = [
    site('near-roof', 'A rooftop with a small garden.', 40.7302, -73.9952),
    site('far-park', 'Community gardens, parks and a green house.', 40.80, -73.95),
    site('near-office', 'An office lobby.', 40.7301, -73.9951),
  ];
  const here = { lat: 40.7295, lng: -73.9965, nowAbs: at('2026-10-17', '13:30'), limit: 10 };
  const one = nearby(sites, { ...here, interests: 'rooftop,garden' });
  const many = nearby(sites, { ...here, interests: 'rooftops,gardens' });
  assert.deepEqual(many.results.map((r) => r.slug), one.results.map((r) => r.slug));
  assert.deepEqual(many.results.map((r) => r.fits_interests), one.results.map((r) => r.fits_interests));
  assert.equal(many.results[0].slug, 'near-roof');
});

test('a near site matching one interest outranks a far one matching two (live: 45-73 min walks ranked above 18 min)', () => {
  const at = (d, hhmm) => { const [h, m] = hhmm.split(':').map(Number); return wallMinutes(d, h * 60 + m); };
  const site = (slug, text, lat, lng) => ({ ...normalizeRecord({
    record_id: `rec${slug}`, slug, experience_name: slug, access_type: ['Drop-In'], borough: 'Manhattan', neighborhood: 'SoHo',
    address_1: '1 Main St', city: 'New York', state: 'NY', zip: '10012',
    saturday_open_access_date: 'Sat, Oct 17', sat_opening_time: '10:00 AM', sat_closing_time: '6:00 PM', short_description: text,
  }), geo: { lat, lng, conf: 'address' } });
  const here = { lat: 40.7359, lng: -73.9911, nowAbs: at('2026-10-17', '13:30'), limit: 10 };
  const sites = [
    site('far-both', 'Rooftop views over community gardens.', 40.7700, -73.9600),   // ~4.6 km, both interests
    site('near-one', 'Skyline views from the bell tower.', 40.7457, -73.9911),        // ~1.1 km (18 min), one tag, no words
  ];
  const r = nearby(sites, { ...here, interests: 'rooftops,gardens' });
  assert.deepEqual(r.results.map((x) => x.slug), ['near-one', 'far-both']);
});

test('at similar distances the better interest match still comes first', () => {
  const at = (d, hhmm) => { const [h, m] = hhmm.split(':').map(Number); return wallMinutes(d, h * 60 + m); };
  const site = (slug, text, lat, lng) => ({ ...normalizeRecord({
    record_id: `rec${slug}`, slug, experience_name: slug, access_type: ['Drop-In'], borough: 'Manhattan', neighborhood: 'SoHo',
    address_1: '1 Main St', city: 'New York', state: 'NY', zip: '10012',
    saturday_open_access_date: 'Sat, Oct 17', sat_opening_time: '10:00 AM', sat_closing_time: '6:00 PM', short_description: text,
  }), geo: { lat, lng, conf: 'address' } });
  const here = { lat: 40.7359, lng: -73.9911, nowAbs: at('2026-10-17', '13:30'), limit: 10 };
  const sites = [
    site('one', 'A church with a rooftop terrace.', 40.7400, -73.9911),             // ~0.46 km
    site('both', 'Rooftop views over community gardens.', 40.7405, -73.9911),      // ~0.51 km
  ];
  assert.deepEqual(nearby(sites, { ...here, interests: 'rooftops,gardens' }).results.map((x) => x.slug), ['both', 'one']);
});
