import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const scripts = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).scripts;

function packageFixture(t, passes) {
  const dir = mkdtempSync(join(tmpdir(), 'ohny-package-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, 'skills/ohny/references'), { recursive: true });
  writeFileSync(join(dir, 'skills/ohny/SKILL.md'), '---\nname: ohny\ndescription: Test fixture\n---\n');
  writeFileSync(join(dir, 'skills/ohny/references/example.md'), 'Shared resource\n');
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ private: true, scripts: {
    prepackage: scripts.prepackage,
    package: scripts.package,
    test: `node -e "process.exit(${passes ? 0 : 1})"`,
  } }));
  const result = spawnSync('npm', ['run', 'package'], {
    cwd: dir, encoding: 'utf8', timeout: 30_000,
    env: { ...process.env, npm_config_cache: join(dir, '.npm-cache') },
  });
  return { dir, result, archive: join(dir, 'dist/ohny-skill.zip') };
}

test('packaging succeeds after passing tests and includes the shared skill resources', (t) => {
  const { archive, result } = packageFixture(t, true);
  assert.equal(result.status, 0, result.error?.message ?? result.stderr);
  const contents = spawnSync('unzip', ['-Z1', archive], { encoding: 'utf8' });
  assert.equal(contents.status, 0, contents.stderr);
  assert.deepEqual(contents.stdout.trim().split('\n').filter((p) => !p.endsWith('/')).sort(),
    ['ohny/SKILL.md', 'ohny/references/example.md']);
});

test('a failing test blocks packaging and creates no release archive', (t) => {
  const { archive, result } = packageFixture(t, false);
  assert.notEqual(result.status, 0, 'npm run package must fail when its tests fail');
  assert.equal(existsSync(archive), false, 'a failed check must not produce an installable archive');
});
