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
    assert.match(t, /property="og:image" content="https:\/\/naidionov\.com\/ohny\/skills\/[^"]+\.png"/);
  });
}

test('the preview image is a real PNG served at the advertised address', async () => {
  const r = await handle(new Request('https://naidionov.com/ohny/skills/icon.png'), deps);
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /image\/png/);
});

test('API clients and ordinary scripts still get JSON; ?format=json wins even for bots', async () => {
  assert.match((await get({ 'user-agent': 'curl/8.0', accept: '*/*' })).headers.get('content-type'), /json/);
  assert.match((await get({ 'user-agent': 'node', accept: '*/*' })).headers.get('content-type'), /json/);
  const forced = await handle(new Request('https://naidionov.com/ohny/skills?format=json', { headers: { 'user-agent': 'LinkedInBot/1.0', accept: '*/*' } }), deps);
  assert.match(forced.headers.get('content-type'), /json/);
});
