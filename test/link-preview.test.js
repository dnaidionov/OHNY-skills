import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../src/handler.js';

const deps = { snapshot: { generated_at: '2026-10-01T00:00:00Z', sites: [] }, fetchImpl: async () => new Response('', { status: 404 }), realNow: new Date('2026-10-08T15:00:00Z') };
const get = (headers) => handle(new Request('https://naidionov.com/ohny/skills', { headers }), deps);

// Link-preview crawlers ask for */* (or nothing) and never send text/html, so they used to get the JSON help page and no preview.
for (const ua of ['LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)', 'facebookexternalhit/1.1', 'Twitterbot/1.0', 'Slackbot-LinkExpanding 1.0', 'WhatsApp/2.23', 'TelegramBot (like TwitterBot)', 'Mozilla/5.0 (compatible; Discordbot/2.0)']) {
  test(`link-preview bot gets the landing page with preview tags: ${ua.split(/[\/ ]/)[0]}`, async () => {
    const r = await get({ 'user-agent': ua, accept: '*/*' });
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-type'), /text\/html/);
    const t = await r.text();
    for (const p of ['og:title', 'og:description', 'og:url', 'og:image', 'twitter:card']) assert.ok(t.includes(p), `missing ${p}`);
    assert.match(t, /property="og:image" content="https:\/\/naidionov\.com\/ohny\/skills\/og\.png"/);
    assert.match(t, /property="og:image:width" content="1200"/);
    assert.match(t, /property="og:image:height" content="630"/);
    assert.match(t, /name="twitter:card" content="summary_large_image"/);
  });
}

test('the share image is a 1200x630 PNG served at the advertised address (wide, so LinkedIn does not crop it)', async () => {
  const r = await handle(new Request('https://naidionov.com/ohny/skills/og.png'), deps);
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /image\/png/);
  const b = Buffer.from(await r.arrayBuffer());
  assert.equal(b.subarray(1, 4).toString(), 'PNG');
  assert.equal(b.readUInt32BE(16), 1200);
  assert.equal(b.readUInt32BE(20), 630);
  assert.ok(b.length < 300_000, 'keep the share image small');
});

test('API clients and ordinary scripts still get JSON; ?format=json wins even for bots', async () => {
  assert.match((await get({ 'user-agent': 'curl/8.0', accept: '*/*' })).headers.get('content-type'), /json/);
  assert.match((await get({ 'user-agent': 'node', accept: '*/*' })).headers.get('content-type'), /json/);
  const forced = await handle(new Request('https://naidionov.com/ohny/skills?format=json', { headers: { 'user-agent': 'LinkedInBot/1.0', accept: '*/*' } }), deps);
  assert.match(forced.headers.get('content-type'), /json/);
});
