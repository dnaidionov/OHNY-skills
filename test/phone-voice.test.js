import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { landingHtml } from '../src/landing.js';

// Owner's manual test on an Android phone, 2026-10-08: Claude, ChatGPT and Gemini apps all used Ask OHNY in text mode.
// In voice mode Claude and ChatGPT used it; Gemini's voice mode cannot reach custom connected apps.
// Setup was still done on the web, so phone-only setup is NOT established.
const panel = (a, b) => { const h = landingHtml(); return h.slice(h.indexOf(`id="panel-${a}"`), h.indexOf(`id="panel-${b}"`)); };
const read = (f) => readFile(new URL(`../${f}`, import.meta.url), 'utf8');

test('Claude tab says voice works in the phone app', () => {
  assert.match(panel('claude', 'chatgpt'), /voice/i);
});

test('ChatGPT tab reports the Android phone-app test (text and voice) and keeps the web setup', () => {
  const p = panel('chatgpt', 'gemini');
  assert.match(p, /Android/);
  assert.match(p, /voice/i);
  assert.doesNotMatch(p, /not been tested yet|has not been tested/i);
  assert.match(p, /chatgpt\.com in a browser/i);          // setup is still on the web
});

test('Gemini tab says text works in the phone app but voice mode cannot use it', () => {
  const p = panel('gemini', 'others');
  assert.match(p, /Android/);
  assert.match(p, /voice[^.]*(cannot|can't|doesn't|does not)[^.]*(custom|connected|app)|(custom|connected)[^.]*voice/i);
  assert.match(p, /typ(e|ing)|text/i);
});

test('README records the phone results and the Gemini voice limit, with no stale "not tested" claims', async () => {
  const md = await read('README.md');
  assert.doesNotMatch(md, /Not yet tested in the phone app/);
  assert.doesNotMatch(md, /use in the ChatGPT phone app has not been tested/i);
  assert.match(md, /2026-10-08[^\n]*Android|Android[^\n]*2026-10-08/);
  assert.match(md, /Gemini[^\n]*voice[^\n]*(cannot|can't|doesn't|does not)/i);
});

test('test-results records the 2026-10-08 Android run exactly, including what was not recorded', async () => {
  const t = await read('docs/test-results.md');
  const i = t.indexOf('Android phone');
  assert.ok(i > 0, 'missing Android phone entry');
  const e = t.slice(i - 200);
  assert.match(e, /1\.0\.971139365/);
  assert.match(e, /Claude[\s\S]*ChatGPT[\s\S]*Gemini|Gemini[\s\S]*ChatGPT/);
  assert.match(e, /voice/i);
  assert.match(e, /NOT RUN|not recorded/i);
});

test('platform-tests no longer says the phone/voice coverage is entirely unrun', async () => {
  const t = await read('docs/platform-tests.md');
  assert.match(t, /2026-10-08[^\n]*Android|Android[^\n]*2026-10-08/);
});
