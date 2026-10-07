import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveTags } from '../src/core/tags.js';
import snapshot from '../data/lineup.json' with { type: 'json' };

// Tags drive interest matching. "View rarely seen historic maps" and "the Blackwell Farm map" made
// Original Maps of Manhattan a rooftops-and-gardens match, ranked second at a 45-minute walk.
const tags = (o) => deriveTags({ name: 'Somewhere', ...o });

test('"view" as a verb or "on view" is not a views site', () => {
  for (const d of ['View rarely seen historic maps.', 'See where the best in preservation is on view.', 'On this tour you will view original finishes.']) {
    assert.ok(!tags({ description: d }).includes('views'), d);
  }
});

test('real views still count', () => {
  for (const d of ['Panoramic views of the harbor.', 'Views from the 40th floor.', 'A rooftop terrace.', 'A skyline view at sunset.',
    'Take in the view over Central Park.', 'An observation deck.', 'Sweeping city views.']) {
    assert.ok(tags({ description: d }).includes('views'), d);
  }
});

test('a single passing "park" or "farm" in the description is not a nature site', () => {
  for (const d of ['Including the Blackwell Farm map.', 'Run by the National Park Service.', 'Headquarters of the City Bank Farmers Trust Company.',
    'Located in Sunset Park.']) {
    assert.ok(!tags({ description: d }).includes('nature'), d);
  }
});

test('real nature still counts: strong words once, park or farm in the name or twice', () => {
  assert.ok(tags({ name: 'School-Based Hydroponic Farm' }).includes('nature'));
  assert.ok(tags({ name: 'Brooklyn Grange Sunset Park' }).includes('nature'));
  assert.ok(tags({ description: 'Explore the public gardens.' }).includes('nature'));
  assert.ok(tags({ description: 'A roof garden.' }).includes('nature'));
  assert.ok(tags({ description: 'The urban farm grows greens; the farm hosts a market.' }).includes('nature'));
  assert.ok(tags({ short: 'A walk through the park.' }).includes('nature'));
  assert.ok(tags({ description: 'Wildlife habitat and wetlands.' }).includes('nature'));
});

test('Original Maps of Manhattan (real record) is no longer tagged views or nature', () => {
  const site = snapshot.sites.find((s) => s.slug === 'maps-of-manhattan-26');
  const t = deriveTags(site);
  assert.ok(!t.includes('views') && !t.includes('nature'), t.join(','));
  assert.ok(t.includes('history'));
});

test('saved lineup tags match the current rules (run: npm run retag)', () => {
  const stale = snapshot.sites.filter((s) => JSON.stringify(s.tags ?? []) !== JSON.stringify(deriveTags(s))).map((s) => s.slug);
  assert.deepEqual(stale, []);
});

test('interest words that are tag aliases are matched by the tag rules, not as raw words ("views" must not hit "on view")', async () => {
  const { interpretInterests } = await import('../src/core/tags.js');
  assert.deepEqual(interpretInterests('views').words, []);
  assert.deepEqual(interpretInterests('rooftops and gardens').words, []);
  assert.deepEqual(interpretInterests('gothic churches').words, ['gothic']);
  assert.deepEqual(interpretInterests('stained glass').words, ['stained', 'glass']);
});
