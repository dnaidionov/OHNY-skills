import { test } from 'node:test';
import assert from 'node:assert/strict';
import { realpathSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const canonical = join(root, 'skills/ohny');
const slug = JSON.parse(readFileSync(join(canonical, 'assets/lineup.json'), 'utf8')).sites[0].slug;

for (const host of ['.agents', '.claude']) {
  const skill = join(root, host, 'skills/ohny');
  const run = (args) => spawnSync('python3', [join(skill, 'scripts/ohny_offline.py'), ...args,
    '--now', '2026-10-17T14:30', '--no-live'], { cwd: tmpdir(), encoding: 'utf8', timeout: 10_000 });

  test(`${host}: skill and resources resolve to the canonical source`, () => {
    assert.equal(realpathSync(skill), realpathSync(canonical));
    for (const path of ['SKILL.md', 'references/api.md', 'assets/lineup/index.md', 'assets/itinerary-template.html']) {
      assert.equal(realpathSync(join(skill, path)), realpathSync(join(canonical, path)));
    }
  });

  test(`${host}: offline helper finds bundled data from outside the repository`, () => {
    const result = run(['site', slug]);
    assert.equal(result.status, 0, result.error?.message ?? result.stderr);
    const body = JSON.parse(result.stdout);
    assert.equal(body.site.slug, slug);
    assert.equal(body.source.live, false);
  });

  test(`${host}: missing location fails clearly without inventing nearby results`, () => {
    const result = run(['nearby']);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Need --lat and --lng/);
    assert.equal(result.stdout.trim(), '');
  });
}
