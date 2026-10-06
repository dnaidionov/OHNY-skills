import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOOLS } from '../src/mcp.js';
import { buildStandalone } from '../scripts/build-standalone.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const api = () => import('../scripts/build-chatgpt-plugin.mjs');
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'ohny-chatgpt-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const path of ['plugins/ask-ohny', 'skills/ohny', 'scripts', 'LICENSE']) {
    cpSync(join(root, path), join(dir, path), { recursive: true });
  }
  return dir;
}
function editManifest(root, fn) {
  const path = join(root, 'plugins/ask-ohny/plugin.json');
  const m = JSON.parse(readFileSync(path));
  fn(m);
  writeFileSync(path, JSON.stringify(m));
}
function files(dir, prefix = '') {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory()
    ? files(join(dir, e.name), prefix + e.name + '/') : [prefix + e.name]);
}

test('ChatGPT archive is self-contained and copies the canonical skill byte for byte', async t => {
  const { buildPlugin } = await api();
  const dir = fixture(t);
  const result = await buildPlugin({ root: dir });
  assert.ok(existsSync(result.archive));
  const unpack = join(dir, 'unpacked');
  mkdirSync(unpack);
  const zip = spawnSync('unzip', ['-q', result.archive, '-d', unpack], { encoding: 'utf8' });
  assert.equal(zip.status, 0, zip.stderr);
  assert.deepEqual(readdirSync(unpack), ['ask-ohny']);
  for (const file of files(join(dir, 'skills/ohny'))) {
    assert.deepEqual(readFileSync(join(unpack, 'ask-ohny/skills/ohny', file)), readFileSync(join(dir, 'skills/ohny', file)));
  }
  const members = files(unpack);
  assert.ok(members.includes('ask-ohny/plugin.json'));
  assert.ok(members.includes('ask-ohny/mcp.json'));
  assert.ok(members.includes('ask-ohny/assets/icon.png'));
  assert.ok(members.includes('ask-ohny/LICENSE'));
  assert.ok(members.every(p => !/\.app\.json|\.git\/|node_modules\/|AGENTS\.md|CLAUDE\.md|\.env/.test(p)));
  const manifest = JSON.parse(readFileSync(join(unpack, 'ask-ohny/plugin.json')));
  assert.equal(manifest.extensions['com.openai'].review.test_cases.positive.length, 5);
  assert.equal(manifest.extensions['com.openai'].review.test_cases.negative.length, 3);
  assert.deepEqual(manifest.extensions['com.openai'].publication.countries, []);
});

for (const [name, mutate] of [
  ['oversized subtitle', m => m.extensions['com.openai'].interface.shortDescription = 'x'.repeat(31)],
  ['private app binding', m => m.extensions['com.openai'].apps = './.app.json'],
  ['top-level private app binding', m => m.apps = './.app.json'],
  ['missing positive review case', m => m.extensions['com.openai'].review.test_cases.positive.pop()],
  ['missing negative review case', m => m.extensions['com.openai'].review.test_cases.negative.pop()],
  ['wrong case field type', m => m.extensions['com.openai'].review.test_cases.positive[0].tools_triggered = ['ohny_nearby']],
  ['icon path escape', m => m.extensions['com.openai'].interface.logo = '../secret.png'],
  ['credentials in public URL', m => m.extensions['com.openai'].interface.websiteURL = 'https://private:secret@example.com/'],
]) {
  test(`ChatGPT package rejects ${name} without overwriting an existing archive`, async t => {
    const { buildPlugin } = await api();
    const dir = fixture(t);
    const old = await buildPlugin({ root: dir });
    const bytes = readFileSync(old.archive);
    editManifest(dir, mutate);
    await assert.rejects(buildPlugin({ root: dir }));
    assert.deepEqual(readFileSync(old.archive), bytes);
  });
}

test('ChatGPT package refuses linked or secret skill files', async t => {
  const { buildPlugin } = await api();
  const dir = fixture(t);
  writeFileSync(join(dir, 'secret.txt'), 'private test fixture');
  symlinkSync(join(dir, 'secret.txt'), join(dir, 'skills/ohny/references/linked.md'));
  await assert.rejects(buildPlugin({ root: dir }), /symbolic|symlink/i);
  rmSync(join(dir, 'skills/ohny/references/linked.md'));
  writeFileSync(join(dir, 'skills/ohny/.env'), 'SECRET=fixture');
  await assert.rejects(buildPlugin({ root: dir }), /hidden|secret|unexpected/i);
  assert.equal(existsSync(join(dir, 'dist/ask-ohny-chatgpt-0.1.0.zip')), false);
});

test('ChatGPT package rejects private bindings hidden beside the manifest', async t => {
  const { buildPlugin } = await api();
  const dir = fixture(t);
  writeFileSync(join(dir, 'plugins/ask-ohny/.app.json'), '{"apps":{}}');
  await assert.rejects(buildPlugin({ root: dir }), /private|app|unexpected|hidden/i);
});

test('ChatGPT package refuses invalid remote transport and malformed PNG icons', async t => {
  const { buildPlugin } = await api();
  const dir = fixture(t);
  const path = join(dir, 'plugins/ask-ohny/mcp.json');
  const original = readFileSync(path);
  const m = JSON.parse(original);
  m.mcpServers.ohny.type = 'stdio';
  writeFileSync(path, JSON.stringify(m));
  await assert.rejects(buildPlugin({ root: dir }), /transport|streamable-http/i);
  writeFileSync(path, original);
  writeFileSync(join(dir, 'plugins/ask-ohny/assets/icon.png'), 'not an image');
  await assert.rejects(buildPlugin({ root: dir }), /PNG/i);
});

test('submission readiness lists missing policy URLs and recording instead of calling a draft ready', async t => {
  const { buildPlugin } = await api();
  const dir = fixture(t);
  editManifest(dir, m => {
    delete m.extensions['com.openai'].interface.privacyPolicyURL;
    delete m.extensions['com.openai'].interface.termsOfServiceURL;
    delete m.extensions['com.openai'].review.demo_recording_url;
  });
  const { readiness } = await buildPlugin({ root: dir });
  assert.equal(readiness.submissionReady, false);
  for (const key of ['privacyPolicyURL', 'termsOfServiceURL', 'demo_recording_url']) {
    assert.ok(readiness.missing.includes(key), key);
  }
});

test('npm ChatGPT packaging is blocked by a failing test', async t => {
  await api();
  const dir = fixture(t);
  const scripts = JSON.parse(readFileSync(join(root, 'package.json'))).scripts;
  assert.equal(scripts['prepackage:chatgpt'], 'npm test');
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ type: 'module', private: true, scripts: {
    test: 'node -e "process.exit(1)"',
    'prepackage:chatgpt': scripts['prepackage:chatgpt'],
    'package:chatgpt': scripts['package:chatgpt'],
  } }));
  const run = spawnSync('npm', ['run', 'package:chatgpt'], { cwd: dir, encoding: 'utf8', timeout: 30000,
    env: { ...process.env, npm_config_cache: join(dir, '.npm-cache') } });
  assert.notEqual(run.status, 0);
  assert.equal(existsSync(join(dir, 'dist/ask-ohny-chatgpt-0.1.0.zip')), false);
});

test('packaged instructions describe link-only check-in and do not promise untested voice support', async () => {
  const skill = readFileSync(join(root, 'skills/ohny/SKILL.md'), 'utf8');
  const description = skill.match(/^description: (.*)$/m)?.[1];
  assert.match(description, /check-in (?:form )?link/i);
  assert.doesNotMatch(description, /Checks visitors in|Works by voice on a phone/i);
  assert.match(skill, /connected OHNY tools/i);
  const standalone = await buildStandalone();
  assert.doesNotMatch(standalone.match(/OHNY profile:[^\n]+/)?.[0] ?? '', /zip|10022/);
});

test('reviewed MCP tools declare read-only and external-access boundaries', () => {
  for (const tool of TOOLS) {
    assert.equal(tool.annotations.readOnlyHint, true, tool.name);
    assert.equal(tool.annotations.destructiveHint, false, tool.name);
    assert.equal(tool.annotations.openWorldHint, tool.name !== 'ohny_guide', tool.name);
  }
});
