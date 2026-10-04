import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { handle, _resetCacheForTests } from '../src/handler.js';
import { _resetEnrichMemoForTests } from '../src/core/enrich.js';
import { normalizeRecord } from '../src/core/normalize.js';
import { TOOLS, INSTRUCTIONS } from '../src/mcp.js';

const rec = (o) => ({ access_type: ['Drop-In'], borough: 'Manhattan', neighborhood: 'SoHo', city: 'New York', state: 'NY',
  saturday_open_access_date: 'Sat, Oct 17', sat_opening_time: '10:00 AM', sat_closing_time: '5:00 PM', ...o });
const live = [rec({ record_id: 'recA', slug: 'a-26', experience_name: 'Alpha Hall', address_1: '1 Main St', zip: '10012' })];
const snapshot = { generated_at: '2026-10-01T00:00:00Z', sites: [
  { ...normalizeRecord(rec({ record_id: 'recA', slug: 'a-26', experience_name: 'Alpha Hall', address_1: '1 Main St', zip: '10012', short_description: 'Rooftop garden.' })), geo: { lat: 40.7301, lng: -73.9951, conf: 'address' } },
] };
const fetchImpl = async (url) => url.endsWith('/data/festival.json') ? Response.json({ records: live })
  : /\/data\/recA\.json$/.test(url) ? Response.json({ id: 'recA', data: { ...live[0], description: 'Fresh.' } }) : new Response('', { status: 404 });
const deps = { snapshot, fetchImpl, realNow: new Date('2026-10-17T18:30:00Z') };

const rpc = async (body, init = {}) => handle(new Request('https://x.test/mcp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), ...init }), deps);
const rpcJson = async (body) => (await rpc(body)).json();

beforeEach(() => { _resetCacheForTests(); _resetEnrichMemoForTests(); });

test('initialize negotiates the version and carries instructions', async () => {
  const r = await rpcJson({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 't', version: '1' } } });
  assert.equal(r.id, 1);
  assert.equal(r.result.protocolVersion, '2025-03-26');
  assert.ok(r.result.capabilities.tools);
  assert.equal(r.result.serverInfo.name, 'ohny-skills');
  assert.equal(r.result.instructions, INSTRUCTIONS);
  assert.match(INSTRUCTIONS, /NOT affiliated/);
  const unknown = await rpcJson({ jsonrpc: '2.0', id: 2, method: 'initialize', params: { protocolVersion: '1999-01-01' } });
  assert.equal(unknown.result.protocolVersion, '2025-06-18');                  // falls back to one we support
});

test('notifications get 202 and no body; GET is 405; bad JSON is a parse error', async () => {
  const n = await rpc({ jsonrpc: '2.0', method: 'notifications/initialized' });
  assert.equal(n.status, 202);
  assert.equal((await handle(new Request('https://x.test/mcp'), deps)).status, 405);
  const bad = await handle(new Request('https://x.test/mcp', { method: 'POST', body: '{nope' }), deps);
  assert.equal((await bad.json()).error.code, -32700);
  assert.equal((await handle(new Request('https://x.test/mcp', { method: 'OPTIONS' }), deps)).status, 204);
});

test('tools/list exposes the read-only tools with schemas', async () => {
  const r = await rpcJson({ jsonrpc: '2.0', id: 3, method: 'tools/list' });
  const names = r.result.tools.map((t) => t.name);
  assert.deepEqual(names, ['ohny_nearby', 'ohny_search', 'ohny_site', 'ohny_check_plan', 'ohny_changes', 'ohny_guide']);
  for (const t of r.result.tools) {
    assert.equal(t.inputSchema.type, 'object');
    assert.equal(t.annotations.readOnlyHint, true);
    assert.equal(t.path, undefined);                                           // internals are not leaked
  }
  assert.equal(TOOLS.length, 6);
});

test('tools/call runs the real routes: nearby, search, site, changes', async () => {
  const call = async (name, args) => (await rpcJson({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name, arguments: args } })).result;
  const nearby = await call('ohny_nearby', { lat: 40.73, lng: -73.996, max_walk_min: 15 });
  assert.equal(nearby.isError, undefined);
  const body = JSON.parse(nearby.content[0].text);
  assert.equal(body.live, true);
  assert.equal(body.results[0].slug, 'a-26');
  assert.equal(body.search.max_walk_min, 15);

  assert.equal(JSON.parse((await call('ohny_search', { q: 'alpha' })).content[0].text).results[0].slug, 'a-26');
  const site = JSON.parse((await call('ohny_site', { slug: 'a-26' })).content[0].text);
  assert.equal(site.site.description, 'Fresh.');
  assert.ok(JSON.parse((await call('ohny_changes', {})).content[0].text).changes);
});

test('tool errors come back as isError results, not protocol errors', async () => {
  const call = async (name, args) => (await rpcJson({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name, arguments: args } }));
  const noLoc = (await call('ohny_nearby', {})).result;
  assert.equal(noLoc.isError, true);
  assert.match(noLoc.content[0].text, /cross street/);
  assert.equal((await call('ohny_site', { slug: 'nope' })).result.isError, true);
  assert.equal((await call('ohny_site', {})).result.isError, true);
  assert.equal((await call('ohny_nearby', { lat: 40.7, lng: -74, now: 'soon' })).result.isError, true);
  assert.equal((await call('no_such_tool', {})).error.code, -32602);
});

test('ohny_guide serves each playbook topic; prompts and unknown methods behave', async () => {
  const guide = async (topic) => (await rpcJson({ jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'ohny_guide', arguments: { topic } } })).result;
  assert.match((await guide('overview')).content[0].text, /Starting a conversation/);
  assert.match((await guide('checkin')).content[0].text, /cannot check visitors in/i);
  assert.match((await guide('planning')).content[0].text, /Interview/);
  assert.match((await guide('api')).content[0].text, /ohny_nearby/);
  assert.equal((await guide('bogus')).isError, true);

  const prompts = (await rpcJson({ jsonrpc: '2.0', id: 7, method: 'prompts/list' })).result.prompts;
  assert.equal(prompts[0].name, 'ohny');
  const got = (await rpcJson({ jsonrpc: '2.0', id: 8, method: 'prompts/get', params: { name: 'ohny' } })).result;
  assert.match(got.messages[0].content.text, /NOT affiliated/);
  assert.equal((await rpcJson({ jsonrpc: '2.0', id: 9, method: 'nope/nope' })).error.code, -32601);
  assert.deepEqual((await rpcJson({ jsonrpc: '2.0', id: 10, method: 'ping' })).result, {});
  const batch = await (await rpc([{ jsonrpc: '2.0', id: 11, method: 'ping' }, { jsonrpc: '2.0', id: 12, method: 'tools/list' }])).json();
  assert.equal(batch.length, 2);
});

test('works under a path prefix on a custom domain (/ohny/skills/mcp, /ohny/skills/v1/...)', async () => {
  const init = { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }) };
  const viaPrefix = await handle(new Request('https://naidionov.com/ohny/skills/mcp', init), deps);
  assert.equal((await viaPrefix.json()).result.tools.length, 6);
  const v1 = await handle(new Request('https://naidionov.com/ohny/skills/v1/search?q=alpha'), deps);
  assert.equal((await v1.json()).results[0].slug, 'a-26');
  assert.equal((await handle(new Request('https://naidionov.com/ohny/skills'), deps)).status, 200);       // help page
  assert.equal((await handle(new Request('https://naidionov.com/ohny/skills/'), deps)).status, 200);
  assert.equal((await handle(new Request('https://naidionov.com/ohny/skillsfoo'), deps)).status, 404);     // not a prefix match
});

test('help page carries a correct one-tap Claude install link', async () => {
  const r = await (await handle(new Request('https://naidionov.com/ohny/skills'), deps)).json();
  const u = new URL(r.install.claude_one_tap);
  assert.equal(u.origin + u.pathname, 'https://claude.ai/customize/connectors');
  assert.equal(u.searchParams.get('modal'), 'add-custom-connector');
  assert.equal(u.searchParams.get('connectorUrl'), r.install.mcp_url);
  assert.equal(r.install.mcp_url, 'https://naidionov.com/ohny/skills/mcp');
});

test('landing page for browsers, JSON for everyone else', async () => {
  const html = await handle(new Request('https://naidionov.com/ohny/skills', { headers: { accept: 'text/html,application/xhtml+xml' } }), deps);
  assert.equal(html.status, 200);
  assert.match(html.headers.get('content-type'), /text\/html/);
  const t = await html.text();
  for (const needle of ['Not affiliated with, endorsed by or sponsored by Open House New York', 'https://claude.ai/customize/connectors?modal=add-custom-connector',
    'https://naidionov.com/ohny/skills/mcp', 'https://naidionov.com', 'releases/latest/download/ohny-skill.zip', 'width=device-width']) {
    assert.ok(t.includes(needle), `landing page missing: ${needle}`);
  }
  assert.doesNotMatch(t, /<script[^>]+src=|<link[^>]+href="https?:\/\/(?!naidionov)/);       // no third-party loads
  const json = await handle(new Request('https://naidionov.com/ohny/skills', { headers: { accept: '*/*' } }), deps);
  assert.match(json.headers.get('content-type'), /json/);
  const forced = await handle(new Request('https://naidionov.com/ohny/skills?format=json', { headers: { accept: 'text/html' } }), deps);
  assert.match(forced.headers.get('content-type'), /json/);
  const v1 = await handle(new Request('https://naidionov.com/ohny/skills/v1', { headers: { accept: 'text/html' } }), deps);
  assert.match(v1.headers.get('content-type'), /json/);
});

test('landing page links match the install link in the help JSON', async () => {
  const { LINKS } = await import('../src/landing.js');
  const r = await (await handle(new Request('https://naidionov.com/ohny/skills?format=json'), deps)).json();
  assert.equal(LINKS.claude, r.install.claude_one_tap);
  assert.equal(LINKS.mcp, r.install.mcp_url);
});

test('landing page shows the OHNY logo (dark-mode safe) and the Claude icon on the Claude button, with trademark notes', async () => {
  const t = await (await handle(new Request('https://naidionov.com/ohny/skills', { headers: { accept: 'text/html' } }), deps)).text();
  assert.match(t, /<svg[^>]+aria-label="Open House New York logo"/);
  assert.ok(t.includes('#2952CC') && t.includes('currentColor'));
  assert.doesNotMatch(t, /#1A1A1A/);                                              // lettering adapts to dark mode
  assert.match(t, /<a class="btn" href="https:\/\/claude\.ai[^>]*><svg[^>]*class="ico"[^>]*>.*<\/svg>Add to Claude<\/a>/s);
  assert.match(t, /name and logo belong to OHNY[^<]*not affiliated with OHNY/);
  assert.match(t, /Claude is a trademark of Anthropic/);
  assert.doesNotMatch(t, /<img[^>]+src=/);                                         // all artwork is inline
});

test('serverInfo advertises an icon on the same origin and mount path as the request', async () => {
  const init = { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25' } };
  const mounted = await (await handle(new Request('https://naidionov.com/ohny/skills/mcp', { method: 'POST', body: JSON.stringify(init) }), deps)).json();
  assert.equal(mounted.result.serverInfo.icons[0].src, 'https://naidionov.com/ohny/skills/icon.png');
  assert.equal(mounted.result.serverInfo.icons[0].mimeType, 'image/png');
  const bare = await (await handle(new Request('https://x.workers.dev/mcp', { method: 'POST', body: JSON.stringify(init) }), deps)).json();
  assert.equal(bare.result.serverInfo.icons[0].src, 'https://x.workers.dev/icon.png');
});

test('icon and favicon routes serve SVG, also under the mount path', async () => {
  for (const u of ['https://x.test/icon.svg', 'https://x.test/favicon.svg', 'https://naidionov.com/ohny/skills/icon.svg']) {
    const res = await handle(new Request(u), deps);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'image/svg+xml');
    assert.match(await res.text(), /^<svg /);
  }
});

test('PNG and ICO icon routes serve real image bytes', async () => {
  const magic = { '/icon.png': [0x89, 0x50, 0x4e, 0x47], '/favicon.png': [0x89, 0x50, 0x4e, 0x47], '/favicon.ico': [0, 0, 1, 0] };
  for (const [path, bytes] of Object.entries(magic)) {
    const res = await handle(new Request(`https://x.test${path}`), deps);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /^image\/(png|x-icon)$/);
    assert.deepEqual([...new Uint8Array(await res.arrayBuffer()).slice(0, 4)], bytes);
  }
});

test('check-in is disabled: the assistant gives the form link and asks nothing first', async () => {
  const FORM = 'https://ohny.fillout.com/26weekend';
  // connector instructions
  assert.ok(INSTRUCTIONS.includes(FORM));
  assert.match(INSTRUCTIONS, /you cannot check anyone in/i);
  assert.match(INSTRUCTIONS, /Ask nothing first/);
  assert.doesNotMatch(INSTRUCTIONS, /read(ing)? back|getting a clear yes|never check anyone in without/i);
  // the playbook topic served by the connector
  const guide = async (topic) => (await rpcJson({ jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'ohny_guide', arguments: { topic } } })).result.content[0].text;
  const checkin = await guide('checkin');
  assert.ok(checkin.includes(FORM));
  assert.match(checkin, /Ask nothing first/);
  assert.match(checkin, /Never say or imply they are checked in/);
  assert.ok(checkin.length < 3000, 'the check-in playbook should stay short');
  // the old flow's questions must be gone from the instructions everywhere
  for (const topic of ['overview', 'planning', 'about']) {
    const t = await guide(topic);
    assert.doesNotMatch(t, /check-in profile|anonymous or email|leave an email or stay anonymous|read(s)? (you )?(back|out) the (photo|waiver)|CHECKIN_MODE/i, `${topic} still describes the old check-in flow`);
  }
  // the site record carries the link too, so it can't be misremembered
  const site = (await (await handle(new Request('https://x.test/v1/site/a-26'), deps)).json()).site;
  assert.equal(site.checkin.form_url, FORM);
  const help = await (await handle(new Request('https://x.test/?format=json'), deps)).json();
  assert.equal(help.checkin_form, FORM);
});

test('landing page describes the link-only check-in honestly', async () => {
  const t = await (await handle(new Request('https://naidionov.com/ohny/skills', { headers: { accept: 'text/html' } }), deps)).text();
  assert.match(t, /can't do the check-in for you/);
  assert.match(t, /No questions first/);
  assert.doesNotMatch(t, /reads you the photo and risk waiver|asks whether you want to leave an email/i);
});
