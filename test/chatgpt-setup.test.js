import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { landingHtml, LINKS } from '../src/landing.js';

// Interim ChatGPT setup (owner's decision, 2026-10-08): until Ask OHNY is approved in ChatGPT's plugin
// directory, visitors add the connector themselves on chatgpt.com: Plugins, Add, Add custom MCP server.
// No developer mode is needed (OpenAI docs, checked 2026-10-08). Use in the Android app was tested on 2026-10-08 (test/phone-voice.test.js);
// setting it up on the phone alone is still not verified.
const panel = () => { const h = landingHtml(); return h.slice(h.indexOf('id="panel-chatgpt"'), h.indexOf('id="panel-gemini"')); };

test('the ChatGPT tab gives the current custom-MCP-server steps with the server address to copy', () => {
  const p = panel();
  assert.equal(LINKS.chatgptPlugins, 'https://chatgpt.com/plugins');
  assert.ok(p.includes(`href="${LINKS.chatgptPlugins}"`));
  assert.ok(p.includes(LINKS.mcp));
  assert.match(p, /data-copy="mcp-chatgpt"/);
  for (const step of ['Add custom MCP server', 'No authentication', 'I understand and want to continue', 'Create as a plugin']) assert.ok(p.includes(step), step);
});

test('the ChatGPT tab is honest about the interim status and what is untested', () => {
  const p = panel();
  assert.match(p, /plugin directory/i);
  assert.match(p, /chatgpt\.com in a browser/i);
  assert.match(p, /set (it )?up[^.]*(on a computer|on chatgpt\.com)|chatgpt\.com in a browser/i);
  assert.doesNotMatch(p, /Developer Mode|Settings, Connectors|local project|npm /i);
  assert.match(p, /id="paste-chatgpt"/);               // the one-chat trial stays as a fallback
});

test('README and the ChatGPT mobile doc describe the interim setup', async () => {
  const md = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  assert.match(md, /Add custom MCP server/);
  const mobile = await readFile(new URL('../docs/chatgpt-mobile.md', import.meta.url), 'utf8');
  assert.match(mobile, /## Interim setup/);
  assert.match(mobile, /Add custom MCP server/);
});
