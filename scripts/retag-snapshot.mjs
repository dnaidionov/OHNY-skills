// Re-derives site tags in data/lineup.json after a change to the tag rules in src/core/tags.js.
// Offline: no network requests (unlike build:data). Then run: npm run build:fallback
// Run: npm run retag   (a test fails if saved tags don't match the current rules)
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveTags } from '../src/core/tags.js';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'lineup.json');
const data = JSON.parse(await readFile(OUT, 'utf8'));
let changed = 0;
for (const site of data.sites) {
  const tags = deriveTags(site);
  if (JSON.stringify(tags) !== JSON.stringify(site.tags ?? [])) { site.tags = tags; changed++; }
}
await writeFile(OUT, JSON.stringify(data));
console.log(`Re-tagged ${changed} of ${data.sites.length} sites in ${OUT}`);
