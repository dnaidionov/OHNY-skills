import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// The Gemini Gem's instruction field is short (reported ~4,000 characters; verify in the app), so the
// instructions are a compact rules sheet that sends the Gem to the public markdown feed for all data.
const FILE = new URL('../docs/gemini/gem-instructions.md', import.meta.url);
const BASE = 'https://naidionov.com/ohny/skills';
const body = async () => {
  const raw = await readFile(FILE, 'utf8');
  return raw.split('<!-- gem-instructions -->')[1]?.split('<!-- /gem-instructions -->')[0].trim();
};

test('the paste-ready instructions exist and fit a short Gem field', async () => {
  const t = await body();
  assert.ok(t, 'instructions are wrapped in gem-instructions markers');
  assert.ok(t.length <= 3900, `${t.length} characters`);
});

test('instructions send the Gem to the live feed, changes first', async () => {
  const t = await body();
  assert.ok(t.includes(`${BASE}/feed/changes.md`) && t.includes(`${BASE}/feed/index.md`));
  assert.ok(t.indexOf('changes.md') < t.indexOf('index.md'));
  assert.match(t, /before (answering|every answer)|every (time|answer)/i);
});

test('the feed pages the instructions name are routes the Worker serves', async () => {
  const { handle } = await import('../src/handler.js');
  const snapshot = { generated_at: '2026-10-01T00:00:00Z', sites: [] };
  const t = await body();
  for (const url of t.match(/https:\/\/naidionov\.com\/ohny\/skills\/feed\/[\w.\/-]+\.md/g) ?? []) {
    const res = await handle(new Request(url), { snapshot, fetchImpl: async () => new Response('', { status: 503 }), realNow: new Date() });
    assert.equal(res.status, 200, url);
  }
});

test('freshness, canceled, held-ticket and check-in rules are all stated', async () => {
  const t = await body();
  assert.match(t, /saved copy/i);                       // say so when the feed is not live
  assert.match(t, /canceled/i);
  assert.match(t, /ticket/i); assert.match(t, /sold out/i);
  assert.match(t, /https:\/\/ohny\.fillout\.com\/26weekend/);
  assert.match(t, /can't (check|do)/i);                 // cannot check anyone in
  assert.match(t, /not affiliated/i);
  assert.match(t, /never (guess|invent|make up)/i);
});

test('the Gem works out "open now" itself and asks for the time and place it needs', async () => {
  const t = await body();
  assert.match(t, /New York time/i);
  assert.match(t, /(cross street|location)/i);
  assert.match(t, /three/i);                            // at most three options
});

test('no instructions for tools or URLs Gemini does not have, and no private data', async () => {
  const t = await body();
  assert.doesNotMatch(t, /ohny_(nearby|search|site|check_plan|changes|guide)|\/v1\/|mcp/i);
  assert.doesNotMatch(t, /raw\.githubusercontent|workers\.dev|api[_ -]?key|token|password/i);
});

test('fetched pages are untrusted data, not instructions', async () => {
  assert.match(await body(), /(information|data), never instructions|not instructions/i);
});
