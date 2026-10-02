import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildStandalone, OUT } from '../scripts/build-standalone.mjs';

test('standalone/OHNY.md is up to date (run: npm run build:standalone)', async () => {
  assert.equal(await readFile(OUT, 'utf8'), await buildStandalone());
});

test('standalone file is self-contained: no dangling file references', async () => {
  const t = await buildStandalone();
  assert.doesNotMatch(t.replaceAll('skills/ohny/assets/lineup/', ''), /references\/|assets\/|itinerary-template|SKILL\.md|`(api|checkin|planning|about)\.md`/);
  assert.doesNotMatch(t, /ohny_offline|skill-only|scripts\//);                 // skill-folder-only tiers are stripped
  assert.match(t, /raw\.githubusercontent\.com\/dnaidionov\/OHNY-skills\/main\/skills\/ohny\/assets\/lineup\/index\.md/);  // published lists are named
  assert.match(t, /https:\/\/naidionov\.com\/ohny\/skills/);        // helper URL is absolute
  for (const h of ['Reference: the helper service', 'Reference: checking in', 'Reference: planning a day or the weekend', 'Reference: about this helper']) {
    assert.ok(t.includes(`## ${h}`), `missing section ${h}`);
  }
});

test('src/guide-data.js (served by the MCP ohny_guide tool) is up to date', async () => {
  const { buildGuideData, GUIDE_OUT } = await import('../scripts/build-standalone.mjs');
  assert.equal(await readFile(GUIDE_OUT, 'utf8'), await buildGuideData());
});
