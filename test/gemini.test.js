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

test('instructions send the Gem to the mirrored gist page, changes file first', async () => {
  const t = await body();
  const wf = await readFile(new URL('../.github/workflows/mirror-feed.yml', import.meta.url), 'utf8');
  const id = /GIST_ID: (\w+)/.exec(wf)[1];
  assert.ok(t.includes(`https://gist.github.com/dnaidionov/${id}`), 'the gist page URL the mirror writes to');
  assert.ok(t.indexOf('ohny-feed-changes.md') > -1 && t.indexOf('ohny-feed-changes.md') < t.indexOf('ohny-feed-index.md'));
  assert.match(t, /before (answering|every answer)|every (time|answer)/i);
});

test('the Gem is not sent to hosts Gemini refused to read', async () => {
  const t = await body();
  assert.doesNotMatch(t, /naidionov\.com\/ohny\/skills\/feed|gist\.githubusercontent|workers\.dev/);
});

test('the file names in the instructions are the ones the mirror writes', async () => {
  const { FILES } = await import('../scripts/mirror-feed.mjs');
  const t = await body();
  for (const name of Object.values(FILES)) assert.ok(t.includes(name), name);
});

test('the Gem says the copy can be up to 30 minutes old', async () => {
  assert.match(await body(), /30 minutes/);
});

test('check-in link is given only when the visitor asks', async () => {
  assert.match(await body(), /(only|just) when (they|the visitor) ask/i);
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

test('when the feed cannot be read, the Gem must not recommend sites or quote hours from anywhere else', async () => {
  const t = await body();
  assert.match(t, /(can't|cannot|unable to) read[^.]*(do not|don't|never)[^.]*(recommend|list|suggest)|(do not|don't|never) (recommend|list|suggest)[^.]*(without|unless)[^.]*(feed|pages)/i);
  assert.match(t, /(Google Maps|maps|search results)[^.]*(hours|status)|(hours|status)[^.]*(Google Maps|maps|search results)/i);
});
