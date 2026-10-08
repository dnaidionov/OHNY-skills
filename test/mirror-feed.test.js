import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { mirrorFeed, FILES } from '../scripts/mirror-feed.mjs';

// The Gemini app can read a public gist but not our own hosts, so the Action copies the Worker's live
// markdown feed into a gist. It must never replace a good mirror with an error page or a partial update.
const BASE = 'https://naidionov.com/ohny/skills';
const page = (title, asOf, extra = '') => `# ${title}\n\n**Live from ohny.org**, as of ${asOf}.\nUnofficial guide.\n\n${extra}\n`;
const feed = (asOf = '2026-10-06T21:00:00.000Z', extra = 'row') => ({
  [`${BASE}/feed/index.md`]: page('OHNY Weekend 2026: all sites', asOf, extra),
  [`${BASE}/feed/changes.md`]: page('OHNY Weekend 2026: what changed', asOf, extra),
});
const mkFetch = (pages, over = {}) => async (url) => {
  if (over[url]) return over[url];
  return pages[url] != null ? new Response(pages[url], { status: 200, headers: { 'content-type': 'text/markdown' } }) : new Response('no', { status: 404 });
};
const run = async ({ pages = feed(), over, gist = {} } = {}) => {
  const writes = {};
  const result = await mirrorFeed({
    base: BASE, fetchImpl: mkFetch(pages, over),
    readGist: async (name) => gist[name], writeGist: async (name, text) => { writes[name] = text; },
  }).catch((e) => ({ error: e }));
  return { writes, result };
};

test('copies both feed pages into the gist files when the gist is empty', async () => {
  const { writes } = await run();
  assert.deepEqual(Object.keys(writes).sort(), Object.values(FILES).sort());
  assert.match(writes[FILES.index], /all sites/);
  assert.match(writes[FILES.changes], /what changed/);
});

test('leaves a file alone when only its as-of time changed', async () => {
  const old = feed('2026-10-06T20:00:00.000Z');
  const { writes } = await run({ gist: { [FILES.index]: old[`${BASE}/feed/index.md`], [FILES.changes]: old[`${BASE}/feed/changes.md`] } });
  assert.deepEqual(writes, {});
});

test('updates only the file whose content changed', async () => {
  const old = feed('2026-10-06T20:00:00.000Z');
  const pages = feed('2026-10-06T21:00:00.000Z');
  pages[`${BASE}/feed/changes.md`] = page('OHNY Weekend 2026: what changed', '2026-10-06T21:00:00.000Z', 'Newcomer is new');
  const { writes } = await run({ pages, gist: { [FILES.index]: old[`${BASE}/feed/index.md`], [FILES.changes]: old[`${BASE}/feed/changes.md`] } });
  assert.deepEqual(Object.keys(writes), [FILES.changes]);
});

test('writes nothing and fails when the feed cannot be fetched', async () => {
  const { writes, result } = await run({ over: { [`${BASE}/feed/index.md`]: new Response('down', { status: 503 }) } });
  assert.deepEqual(writes, {});
  assert.ok(result.error, 'rejects so the workflow fails visibly');
});

test('writes nothing when a page is an error page, not the feed (all or nothing)', async () => {
  const pages = feed();
  pages[`${BASE}/feed/changes.md`] = '<!DOCTYPE html><title>404</title>';
  const { writes, result } = await run({ pages });
  assert.deepEqual(writes, {});
  assert.ok(result.error);
});

test('rejects a page with no freshness label', async () => {
  const pages = feed();
  pages[`${BASE}/feed/index.md`] = '# OHNY Weekend 2026: all sites\n\nno label here\n';
  const { writes, result } = await run({ pages });
  assert.deepEqual(writes, {});
  assert.ok(result.error);
});

test('mirrors a saved-copy page too, because its label is accurate', async () => {
  const pages = feed();
  pages[`${BASE}/feed/index.md`] = '# OHNY Weekend 2026: all sites\n\n**Saved copy**, as of 2026-10-02T19:12:13.021Z (ohny.org could not be reached just now).\n';
  const { writes } = await run({ pages });
  assert.match(writes[FILES.index], /Saved copy/);
});

test('the workflow runs every 30 minutes around the festival with a secret token and never prints it', async () => {
  const wf = await readFile(new URL('../.github/workflows/mirror-feed.yml', import.meta.url), 'utf8');
  assert.match(wf, /cron: '\*\/30 \* \* \* \*'/);
  assert.match(wf, /workflow_dispatch/);
  assert.match(wf, /2026-09-30/); assert.match(wf, /2026-10-21/);
  assert.match(wf, /secrets\.GIST_TOKEN/);
  assert.match(wf, /GH_TOKEN: \$\{\{ secrets\.GIST_TOKEN \}\}/);
  assert.match(wf, /contents: read/);
  assert.match(wf, /scripts\/mirror-feed\.mjs/);
  assert.match(wf, /concurrency:/);
  assert.doesNotMatch(wf, /echo[^\n]*GIST_TOKEN|set -x/);
  assert.doesNotMatch(wf, /ghp_|github_pat_/);
});
