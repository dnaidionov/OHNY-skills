import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { landingHtml } from '../src/landing.js';

// Model and effort advice for visitors, based on the 2026-10-07/08 timing runs (docs/test-results.md).
// The model is the visitor's choice in their AI app; the helper service itself uses no model.
const panel = (id, next) => { const h = landingHtml(); return h.slice(h.indexOf(`id="panel-${id}"`), h.indexOf(`id="panel-${next}"`)); };

test('Claude tab: recommends Sonnet or Opus, warns off Haiku, keeps effort as is', () => {
  const p = panel('claude', 'chatgpt');
  assert.match(p, /Sonnet 5\.5/);
  assert.match(p, /Opus 5\.5/);
  assert.match(p, /Haiku/);
  assert.match(p, /effort/i);
});

test('ChatGPT tab: recommends Instant and says more thinking is slower, not more accurate', () => {
  const p = panel('chatgpt', 'gemini');
  assert.match(p, /Instant/);
  assert.match(p, /slower/i);
  assert.match(p, /same facts|not more accurate|doesn't make .* more accurate/i);
});

test('Gemini tab: recommends Flash and says Pro and Flash-Lite are slower', () => {
  const p = panel('gemini', 'others');
  assert.match(p, /3\.8 Flash|Flash \(the default\)/);
  assert.match(p, /Pro/);
  assert.match(p, /Flash-Lite/);
  assert.match(p, /slower/i);
});

test('the page says the model is the visitor’s choice and the helper uses none', () => {
  const h = landingHtml();
  assert.match(h, /helper (service )?(itself )?(doesn't|does not) use (an AI model|a model)/i);
});

test('the README has a model and effort section with the measured trade-offs', async () => {
  const md = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  assert.match(md, /## Choosing a model/);
  for (const w of ['Sonnet 5.5', 'Opus 5.5', 'Haiku 5.5', 'Instant', '3.8 Flash', '3.1 Pro', 'Flash-Lite']) assert.ok(md.includes(w), w);
});
