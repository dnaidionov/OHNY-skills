import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { landingHtml, LINKS } from '../src/landing.js';

// Gemini accepts our MCP server as a "custom app" (Settings, Connected Apps). Verified on gemini.google.com
// on 2026-10-07: no sign-in needed, all seven tools listed. There is no prefilled link, so the page gives the
// settings link, a copy button for the address, and the short steps.
const panel = () => { const h = landingHtml(); return h.slice(h.indexOf('id="panel-gemini"'), h.indexOf('id="panel-others"')); };

test('the Gemini tab links straight to Connected Apps and offers the server address to copy', () => {
  const p = panel();
  assert.equal(LINKS.geminiApps, 'https://gemini.google.com/apps');
  assert.ok(p.includes(`href="${LINKS.geminiApps}"`));
  assert.ok(p.includes(LINKS.mcp));
  assert.match(p, /data-copy="mcp-gemini"/);
  assert.match(p, /Add a custom app/);
});

test('the Gemini tab states who can use it and that setup happens on gemini.google.com', () => {
  const p = panel();
  assert.match(p, /18/);
  assert.match(p, /\bUS\b/);
  assert.match(p, /personal Google account/i);
  assert.match(p, /phone app/i);
  assert.doesNotMatch(p, /can't add connectors/);
});

test('troubleshooting no longer says Gemini only has the pasted message', () => {
  const h = landingHtml();
  const t = h.slice(h.indexOf('id="m-trouble"'));
  assert.doesNotMatch(t, /Gemini uses a pasted message/);
  assert.match(t, /Connected Apps/);
});

test('the README describes the Gemini custom-app route', async () => {
  const md = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  assert.match(md, /Gemini[^\n]*custom app/i);
  assert.match(md, /gemini\.google\.com\/apps/);
});
