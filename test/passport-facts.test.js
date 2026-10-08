import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GUIDE } from '../src/guide-data.js';

// The Passport question sent Opal on a 4-minute web search that ended in a wrong answer (2026-10-08), and made
// Claude stop to ask permission to fetch ohny.org. The checked facts (ohny.org/festival/passport, 2026-10-08)
// now ship with the guide and the Opal prompt, so no assistant has to search for them.
const facts = (text) => {
  assert.match(text, /you and a guest/i);
  assert.match(text, /about 150/);
  assert.match(text, /concierge/i);
  assert.match(text, /not (cover|include) ticketed|doesn't cover ticketed|not for ticketed/i);
  assert.match(text, /non-refundable/i);
  assert.match(text, /tax-deductible/i);
};

test('the guide (about topic) states what a Weekend Passport gets you', () => facts(GUIDE.about));

test('the Opal prompt states the Passport facts and says not to search the web for them', async () => {
  const p = await readFile(new URL('../docs/gemini/opal-prompt.md', import.meta.url), 'utf8');
  facts(p);
  assert.match(p, /Passport[^\n]*(don't|do not) search/i);
});
