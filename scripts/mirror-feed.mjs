// Copies the Worker's live markdown feed into a public gist, because the Gemini app can read a gist
// but refuses our own hosts (see docs/test-results.md). Run by .github/workflows/mirror-feed.yml.
// Never replaces a good mirror with an error page: every page is checked first, and nothing is written
// unless all of them pass.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const FILES = { index: 'ohny-feed-index.md', changes: 'ohny-feed-changes.md' };
const PAGES = { index: 'feed/index.md', changes: 'feed/changes.md' };

const looksLikeFeed = (t) => /^# OHNY Weekend 2026/.test(t) && /\*\*(Live from ohny\.org|Saved copy)\*\*/.test(t);
// The as-of time changes on every fetch; ignore it so an unchanged feed does not rewrite the gist.
const stable = (t) => (t ?? '').replace(/as of [0-9T:.\-Z]+/g, 'as of X');

export async function mirrorFeed({ base, fetchImpl = fetch, readGist, writeGist }) {
  const fresh = {};
  for (const [key, path] of Object.entries(PAGES)) {
    const res = await fetchImpl(`${base}/${path}`);
    if (!res.ok) throw new Error(`${path} returned ${res.status}; gist left unchanged`);
    const text = await res.text();
    if (!looksLikeFeed(text)) throw new Error(`${path} is not the expected feed page; gist left unchanged`);
    fresh[FILES[key]] = text;
  }
  const updated = [];
  for (const [name, text] of Object.entries(fresh)) {
    if (stable(await readGist(name)) === stable(text)) continue;
    await writeGist(name, text);
    updated.push(name);
  }
  return { updated, skipped: Object.keys(fresh).filter((n) => !updated.includes(n)) };
}

async function main() {
  const gistId = process.env.GIST_ID;
  if (!gistId) throw new Error('GIST_ID is not set');
  const base = process.env.FEED_BASE ?? 'https://naidionov.com/ohny/skills';
  const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  const dir = mkdtempSync(join(tmpdir(), 'ohny-feed-'));
  try {
    const result = await mirrorFeed({
      base,
      readGist: async (name) => { try { return gh('gist', 'view', gistId, '-f', name, '--raw'); } catch { return undefined; } },
      writeGist: async (name, text) => {
        const file = join(dir, name);
        writeFileSync(file, text);
        gh('gist', 'edit', gistId, '-f', name, file);
      },
    });
    console.log(`Updated: ${result.updated.join(', ') || 'none'}. Unchanged: ${result.skipped.join(', ') || 'none'}.`);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main().catch((e) => { console.error(e.message); process.exit(1); });
