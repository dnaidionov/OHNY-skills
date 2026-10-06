// Build a portable public-upload candidate from shared sources. No network or account mutations.
import { copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN_SCHEMA = 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json';
const MCP_SCHEMA = 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json';
const check = (condition, message) => { if (!condition) throw new Error(message); };
const nonblank = (s, max = 4000) => typeof s === 'string' && s.trim().length > 0 && s.length <= max;
const json = path => JSON.parse(readFileSync(path, 'utf8'));
function https(value, label) {
  let url;
  try { url = new URL(value); } catch { throw new Error(`${label}: invalid URL`); }
  check(url.protocol === 'https:' && !url.username && !url.password && value.length <= 1024, `${label}: use HTTPS without credentials`);
  check(!['localhost', '127.0.0.1', '::1', 'example.com', 'example.org'].includes(url.hostname), `${label}: use the real public endpoint`);
}
function paths(dir, prefix = '') {
  check(!lstatSync(dir).isSymbolicLink(), `Symlink is not permitted: ${dir}`);
  return readdirSync(dir).sort().flatMap(name => {
    const path = join(dir, name), rel = prefix + name, stat = lstatSync(path);
    check(!stat.isSymbolicLink(), `Symlink is not permitted: ${rel}`);
    check(!name.startsWith('.') && !/[\\\r\n]/.test(name), `Hidden or unexpected file: ${rel}`);
    if (stat.isDirectory()) return paths(path, rel + '/');
    check(stat.isFile(), `Only ordinary files are allowed: ${rel}`);
    check(!/\.(?:pem|key|p12|pfx)$/i.test(name), `Secret file is not permitted: ${rel}`);
    return [rel];
  });
}
function icon(dir, path, minimum) {
  check(typeof path === 'string' && /^\.\/assets\/[a-zA-Z0-9_-]+\.png$/.test(path), 'Icon path must be contained under ./assets/');
  const b = readFileSync(join(dir, path));
  check(b.length >= 33 && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && b.toString('ascii', 12, 16) === 'IHDR', 'Invalid PNG icon');
  const width = b.readUInt32BE(16), height = b.readUInt32BE(20);
  check(width === height && width >= minimum && width <= 4096 && b.length <= 5 * 1024 * 1024, 'PNG icon must be square, within size and dimension limits');
}

export function validatePlugin(dir) {
  const inventory = paths(dir);
  check(inventory.every(p => p === 'plugin.json' || p === 'mcp.json' || p === 'LICENSE' || /^(assets|skills)\//.test(p)), 'Unexpected file in public package');
  const manifest = json(join(dir, 'plugin.json')), mcp = json(join(dir, 'mcp.json'));
  const extension = manifest.extensions?.['com.openai'];
  check(manifest.$schema === PLUGIN_SCHEMA, 'Unsupported portable plugin schema');
  check(manifest.name === 'ask-ohny' && /^\d+\.\d+\.\d+$/.test(manifest.version), 'Invalid package name or version');
  for (const key of ['apps', 'skills', 'mcpServers', 'interface']) check(manifest[key] == null, `Unsupported public root field: ${key}`);
  check(extension?.apps == null && extension?.hooks == null, 'Private app bindings and lifecycle hooks cannot be submitted');
  const ui = extension?.interface;
  check(ui, 'Listing interface is required');
  for (const [key, limit] of Object.entries({ displayName: 30, shortDescription: 30, longDescription: 4000, developerName: 80, category: 80 })) {
    check(nonblank(ui[key], limit), `Invalid listing ${key}: limit ${limit}`);
  }
  check(manifest.author?.name === ui.developerName, 'Publisher names must match');
  check(nonblank(manifest.description), 'Missing package description');
  check(/unofficial/i.test(ui.longDescription) && /not affiliated/i.test(ui.longDescription), 'Listing must disclose the unofficial relationship');
  const prompts = Array.isArray(ui.defaultPrompt) ? ui.defaultPrompt : [ui.defaultPrompt];
  check(prompts.length > 0 && prompts.length <= 3 && prompts.every(p => nonblank(p, 128) && !/[\r\n@]/.test(p)), 'Invalid starter prompts');
  check(new Set(prompts.map(p => p.trim().replace(/\s+/g, ' '))).size === prompts.length, 'Duplicate starter prompts');
  for (const field of ['websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL']) if (ui[field] != null) https(ui[field], field);
  icon(dir, ui.logo, 256);
  icon(dir, ui.composerIcon, 48);
  check(mcp.$schema === MCP_SCHEMA, 'Unsupported MCP schema');
  check(Object.keys(mcp.mcpServers ?? {}).join(',') === 'ohny', 'Expected the one existing OHNY MCP service');
  const server = mcp.mcpServers.ohny;
  check(server.type === 'streamable-http', 'MCP transport must be streamable-http');
  https(server.url, 'MCP endpoint');
  check(server.url === 'https://naidionov.com/ohny/skills/mcp', 'Preserve the verified OHNY endpoint');
  check(Object.keys(server).every(k => ['type', 'url'].includes(k)), 'Unexpected MCP credentials or local configuration');
  const review = extension.review, cases = review?.test_cases;
  check(cases?.positive?.length === 5 && cases?.negative?.length === 3, 'Initial review requires five positive and three negative cases');
  for (const item of [...cases.positive, ...cases.negative]) {
    check(nonblank(item.description) && nonblank(item.prompt), 'Review case needs a description and natural prompt');
    check(Object.keys(item).every(k => ['description', 'prompt', 'tools_triggered', 'expected_behavior'].includes(k)), 'Unsupported review-case field');
  }
  for (const item of cases.positive) check(nonblank(item.tools_triggered) && nonblank(item.expected_behavior), 'Positive case tools_triggered and expected_behavior must be strings');
  check(review.test_credentials == null && review.reviewer_instructions == null, 'Reviewer credentials must stay out of the ZIP');
  if (review.demo_recording_url != null) https(review.demo_recording_url, 'demo_recording_url');
  if (review.commerce != null) check(typeof review.commerce === 'boolean' && nonblank(review.commerce_description), 'Commerce needs a boolean and explanation');
  const publication = extension.publication;
  check(nonblank(publication?.release_notes), 'Release notes are required');
  if (publication.countries != null) check(Array.isArray(publication.countries) && publication.countries.every(c => /^[A-Z]{2}$/.test(c)), 'Invalid publication countries');
  const skill = readFileSync(join(dir, 'skills/ohny/SKILL.md'), 'utf8');
  check(/^---\nname: ohny\ndescription: .+\n---/m.test(skill), 'Invalid OHNY skill frontmatter');
  for (const ref of ['api', 'planning', 'checkin', 'about']) check(existsSync(join(dir, `skills/ohny/references/${ref}.md`)), `Missing skill reference: ${ref}`);
  const missing = ['websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL'].filter(k => !ui[k]);
  if (!review.demo_recording_url) missing.push('demo_recording_url');
  if (review.commerce == null) missing.push('commerce');
  if (publication.countries == null) missing.push('countries');
  return { manifest, inventory, readiness: {
    packageValid: true, metadataComplete: missing.length === 0, submissionReady: false, missing,
    outstandingVerification: ['Open every public URL and play the actual demo recording', 'Publisher identity and domain verification', 'Portal metadata, skill and tool scans', 'Real ChatGPT phone-only onboarding and native acceptance', 'Authorized publisher attestations and review approval'],
    note: 'Local validation checks package structure and project rules; it is not OpenAI portal validation or native acceptance.',
  } };
}

export async function buildPlugin({ root = ROOT, output, requireMetadata = false } = {}) {
  const source = join(root, 'plugins/ask-ohny');
  const sourceFiles = paths(source);
  check(sourceFiles.every(p => p === 'plugin.json' || p === 'mcp.json' || /^assets\/[a-zA-Z0-9_-]+\.png$/.test(p)), 'Unexpected source file: exclude private app bindings and hidden files');
  const skillDir = join(root, 'skills/ohny');
  const skillFiles = paths(skillDir);
  check(skillFiles.every(p => p === 'SKILL.md' || /^(references|assets|scripts)\/.*\.(md|json|html|py)$/.test(p)), 'Unexpected file in canonical skill');
  const temp = mkdtempSync(join(tmpdir(), 'ask-ohny-build-'));
  try {
    const stage = join(temp, 'ask-ohny');
    const copy = (from, rel) => { mkdirSync(dirname(join(stage, rel)), { recursive: true }); copyFileSync(from, join(stage, rel)); };
    for (const file of sourceFiles) copy(join(source, file), file);
    for (const file of skillFiles) copy(join(skillDir, file), `skills/ohny/${file}`);
    copy(join(root, 'LICENSE'), 'LICENSE');
    const { manifest, inventory, readiness } = validatePlugin(stage);
    check(!requireMetadata || readiness.metadataComplete, `Submission metadata incomplete: ${readiness.missing.join(', ')}`);
    const fixed = new Date('2026-01-01T00:00:00Z');
    for (const file of inventory) utimesSync(join(stage, file), fixed, fixed);
    const zipped = join(temp, 'candidate.zip');
    execFileSync('zip', ['-X', '-q', zipped, ...inventory.map(p => `ask-ohny/${p}`)], { cwd: temp, env: { ...process.env, TZ: 'UTC' } });
    execFileSync('unzip', ['-tq', zipped], { stdio: 'pipe' });
    const members = execFileSync('unzip', ['-Z1', zipped], { encoding: 'utf8' }).trim().split('\n').sort();
    check(JSON.stringify(members) === JSON.stringify(inventory.map(p => `ask-ohny/${p}`).sort()), 'ZIP inventory differs from validated package');
    const archive = resolve(output ?? join(root, `dist/ask-ohny-chatgpt-${manifest.version}.zip`));
    mkdirSync(dirname(archive), { recursive: true });
    const pending = `${archive}.tmp`;
    copyFileSync(zipped, pending);
    renameSync(pending, archive);
    const report = { ...readiness, archive: archive.split('/').at(-1), version: manifest.version,
      sha256: createHash('sha256').update(readFileSync(archive)).digest('hex'),
      files: inventory.map(p => ({ path: `ask-ohny/${p}`, sha256: createHash('sha256').update(readFileSync(join(stage, p))).digest('hex') })),
    };
    writeFileSync(archive.replace(/\.zip$/, '') + '.readiness.json', JSON.stringify(report, null, 2) + '\n');
    return { archive, readiness: report };
  } finally { rmSync(temp, { recursive: true, force: true }); }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    const result = await buildPlugin({ requireMetadata: process.argv.includes('--require-metadata') });
    console.log(`Prepared ${result.archive}\nLocal package validation passed. Public submission readiness is NOT established.`);
    if (result.readiness.missing.length) console.log(`Missing preparation fields: ${result.readiness.missing.join(', ')}`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
