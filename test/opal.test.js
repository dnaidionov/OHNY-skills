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

test('the prompt has no "@" (Opal turns "@" into a tool-picker shortcut); it writes %40 instead', async () => {
  const t = await buildOpalPrompt();
  assert.doesNotMatch(t, /@/);
  assert.match(t, /fixed=<slug>%40<YYYY-MM-DDTHH:MM>/);
});

test('the Worker reads %40 in fixed= and stops= exactly like @', async () => {
  const { normalizeRecord } = await import('../src/core/normalize.js');
  const rec = { record_id: 'recA', slug: 'a-26', experience_name: 'Alpha Hall', access_type: ['Ticketed'], borough: 'Manhattan', neighborhood: 'SoHo', city: 'New York', state: 'NY', address_1: '1 Main St',
    saturday_open_access_date: 'Sat, Oct 17', sat_opening_time: '10:00 AM', sat_closing_time: '5:00 PM' };
  const snapshot = { generated_at: '2026-10-01T00:00:00Z', sites: [{ ...normalizeRecord(rec), geo: { lat: 40.73, lng: -73.99, conf: 'address' } }] };
  const deps = { snapshot, fetchImpl: async () => new Response('', { status: 503 }), realNow: new Date('2026-10-17T14:00:00Z') };
  for (const [a, b] of [
    ['/v1/nearby?lat=40.73&lng=-73.99&fixed=a-26@2026-10-17T14:00', '/v1/nearby?lat=40.73&lng=-73.99&fixed=a-26%402026-10-17T14:00'],
    ['/v1/plan/check?stops=a-26@2026-10-17T11:00', '/v1/plan/check?stops=a-26%402026-10-17T11:00'],
  ]) {
    _resetCacheForTests();
    const x = await (await handle(new Request(`https://x.test${a}`), deps)).json();
    _resetCacheForTests();
    const y = await (await handle(new Request(`https://x.test${b}`), deps)).json();
    delete x.as_of; delete y.as_of;
    assert.deepEqual(y, x, b);
  }
});

test('as_of is UTC: the agent converts it to New York time before saying it (Opal run said "5:24 AM" for 1:24 AM)', async () => {
  const t = await buildOpalPrompt();
  assert.match(t, /as_of[^.]*UTC/);
  assert.match(t, /convert[^.]*New York time/i);
});

test('site names, addresses and hours come only from the service; named places are found with /v1/search, not Maps', async () => {
  const t = await buildOpalPrompt();
  assert.match(t, /Every site name, address, hour and status[^.]*must come from[^.]*service/i);
  assert.match(t, /names a place[^.]*\/v1\/search[^.]*first/i);
  assert.match(t, /never use Search Maps[^.]*(identify|find)[^.]*(site|place)/i);
});

test('the agent holds a conversation: asks for missing details, then keeps helping until the visitor is done', async () => {
  const t = await buildOpalPrompt();
  assert.doesNotMatch(t, /one go|does not chat back/i);
  assert.match(t, /ask (one|a) (short )?question at a time/i);
  assert.match(t, /Anything else\?/);
  assert.match(t, /until the visitor (says|is) (they're |they are )?done/i);
  assert.match(t, /earlier in (this|the) (chat|conversation)[^.]*(location|tickets|interests)/i);
  assert.match(t, /(re-?check|call the service again|fetch again)[^.]*(every|each) (answer|time)/i);  // facts stay live on later turns
});

test('memory is opt-in: ask first, keep only listed preferences, support forget, never personal identifiers', async () => {
  const t = await buildOpalPrompt();
  assert.match(t, /Use Memory/);
  assert.match(t, /only (after|if) (they|the visitor) (say|says|agree|agrees) yes|ask(ing)? first/i);
  assert.match(t, /interests[^.]*tickets/i);
  assert.match(t, /forget/i);
  assert.match(t, /never (remember|save|store)[^.]*(email|name|zip)/i);
  assert.match(t, /never (remember|save|store)[^.]*(hours|status)/i);   // live facts are never remembered
});

test('the agent pauses in the chat for replies instead of ending with a question (first Opal run ended the workflow on "Anything else?")', async () => {
  const t = await buildOpalPrompt();
  assert.match(t, /use the chat to ask[^.]*wait for (their|the visitor's) reply/i);
  assert.match(t, /Only finish[^.]*(says|say) (they're|they are) done/i);
  assert.match(t, /Never end[^.]*with a question/i);
  // the chat rule is the last section, so it can be inserted just before Opal's tool and input chips
  assert.match(t.trim(), /HOW THIS CHAT WORKS[\s\S]*$/);
  assert.ok(t.lastIndexOf('HOW THIS CHAT WORKS') > t.lastIndexOf('HELPER SERVICE REFERENCE'));
});

test('the goodbye asks nothing more, and the visitor\'s location is never offered for memory (Opal multi-turn run)', async () => {
  const t = await buildOpalPrompt();
  const chat = t.slice(t.lastIndexOf('HOW THIS CHAT WORKS'));
  assert.match(chat, /done[^.]*(summary|goodbye)[^.]*(no|without)[^.]*question/i);
  assert.match(chat, /(Don't|Never) (offer to )?remember where (they are|the visitor is)/i);
});

test('chat rules from the memory re-test: recall at the start, offer only allowed items, unofficial line once', async () => {
  const t = await buildOpalPrompt();
  const chat = t.slice(t.lastIndexOf('HOW THIS CHAT WORKS'));
  assert.match(chat, /start of (each|every) chat[^.]*Use Memory/i);
  assert.match(chat, /offer(ing)? to remember[^.]*only[^.]*interests/i);
  assert.match(chat, /unofficial[^.]*only in your first message/i);
});

test('planning uses the one-call /v1/plan/day, fetches ask for format=text and the page verbatim, at most two per answer', async () => {
  const t = await buildOpalPrompt();
  assert.match(t, /\/v1\/plan\/day/);
  assert.match(t, /format=text/);
  assert.match(t, /verbatim|word for word/i);
  assert.match(t, /at most two (Get Webpage )?(calls|fetches)/i);
  assert.match(t, /reuse[^.]*slug/i);
});

test('the API reference documents /v1/plan/day and format=text (single source for every route)', async () => {
  const api = await (await import('node:fs/promises')).readFile(new URL('../skills/ohny/references/api.md', import.meta.url), 'utf8');
  assert.match(api, /\/v1\/plan\/day\?ticket=/);
  assert.match(api, /format=text/);
});
