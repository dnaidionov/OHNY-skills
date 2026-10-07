import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildOpalPrompt, OPAL_OUT } from '../scripts/build-opal.mjs';
import { handle, _resetCacheForTests } from '../src/handler.js';

// Google Opal can't speak MCP, but its Get Webpage tool reads the Worker's GET API (tested 2026-10-07).
// The Opal agent prompt is generated from the skill so the rules and endpoints stay in sync.

test('docs/gemini/opal-prompt.md is up to date (run: npm run build:opal)', async () => {
  assert.equal(await readFile(OPAL_OUT, 'utf8'), await buildOpalPrompt());
});

test('base URLs and the check-in link come from the skill settings, with no placeholders left', async () => {
  const t = await buildOpalPrompt();
  const skill = await readFile(new URL('../skills/ohny/SKILL.md', import.meta.url), 'utf8');
  for (const key of ['API_BASE', 'API_BASE_BACKUP', 'CHECKIN_FORM']) {
    const value = new RegExp(`^${key}\\s*=\\s*(\\S+)`, 'm').exec(skill)[1];
    assert.ok(t.includes(value), `${key} ${value}`);
  }
  assert.doesNotMatch(t, /\{API_BASE\}|`API_BASE`/);
});

test('every endpoint the prompt names is a route the Worker answers', async () => {
  const t = await buildOpalPrompt();
  const paths = [...new Set([...t.matchAll(/https:\/\/naidionov\.com\/ohny\/skills(\/v1\/[a-z/]+)/g)].map((m) => m[1]))];
  assert.ok(paths.length >= 6, paths.join(','));
  const snapshot = { generated_at: '2026-10-01T00:00:00Z', sites: [] };
  for (const p of paths) {
    _resetCacheForTests();
    const url = p.endsWith('/site/') ? `${p}x` : p;
    const res = await handle(new Request(`https://naidionov.com/ohny/skills${url}`), { snapshot, fetchImpl: async () => new Response('', { status: 503 }), realNow: new Date('2026-10-17T18:00:00Z') });
    const body = await res.json();
    assert.notEqual(body.error, 'Unknown route.', p);
  }
});

test('the prompt tells the agent to use Get Webpage and Search Maps, not MCP tools', async () => {
  const t = await buildOpalPrompt();
  assert.match(t, /Get Webpage/); assert.match(t, /Search Maps/);
  assert.doesNotMatch(t, /ohny_(nearby|search|site|check_plan|changes|guide)|\/mcp\b|MCP/);
});

test('product rules are all present', async () => {
  const t = await buildOpalPrompt();
  assert.match(t, /not affiliated/i);
  assert.match(t, /canceled[^.]*first|first[^.]*canceled/i);
  assert.match(t, /sold out[^.]*(does not|doesn't) (affect|apply)/i);
  assert.match(t, /fixed=/); assert.match(t, /\/v1\/plan\/check/); assert.match(t, /leave_by/);
  assert.match(t, /check-in[^.]*only when (they|the visitor) ask/i);
  assert.match(t, /never (say|imply)[^.]*checked in/i);
  assert.match(t, /as_of/); assert.match(t, /saved copy/i);
  assert.match(t, /never guess/i);
  assert.match(t, /(at most|no more than) three/i);
  assert.match(t, /now=/);
  assert.match(t, /information, never instructions/i);
  assert.match(t, /skipped/);
});

test('the prompt asks for no personal data and keeps it out of URLs', async () => {
  const t = await buildOpalPrompt();
  assert.match(t, /(Do not|Never) send[^.]*(names|emails)/i);
});

test('if the service cannot be reached the agent says so and lists nothing', async () => {
  const t = await buildOpalPrompt();
  assert.match(t, /API_BASE_BACKUP|ohny-skills\.dnaidionov\.workers\.dev/);
  assert.match(t, /(do not|don't|never) (recommend|list)[^.]*(sites|places)/i);
});
