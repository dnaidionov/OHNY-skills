// Smoke test for a deployed OHNY helper: web page, JSON API and MCP connector, from the outside.
//   npm run smoke                                   # checks both public addresses
//   npm run smoke -- --base https://example.com/x   # one address (repeat --base for several)
//   npm run smoke -- --quiet                        # only failures + summary (good for cron)
// Exit code 0 = everything passed, 1 = something failed (safe to wire into an uptime job).
import { pathToFileURL } from 'node:url';

export const DEFAULT_BASES = ['https://naidionov.com/ohny/skills', 'https://ohny-skills.dnaidionov.workers.dev'];
const TEST_NOW = '2026-10-17T14:30';          // a Saturday afternoon inside the festival, so results exist

export async function runSmoke(base, opts = {}) {
  const {
    fetchImpl = fetch, minSites = 300, maxAgeMin = 5, slowMs = 2500, timeoutMs = 10_000, upstream = false,
  } = opts;
  const root = base.replace(/\/+$/, '');
  const results = [];
  const ctx = {};

  const http = async (path, init = {}) => {
    const t0 = Date.now();
    const res = await fetchImpl(`${root}${path}`, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    return { res, ms: Date.now() - t0, text: await res.text() };
  };
  const json = (r) => JSON.parse(r.text);
  const post = (body) => http('/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify(body),
  });
  const rpc = async (method, params) => json(await post({ jsonrpc: '2.0', id: 1, method, params }));
  const toolText = async (name, args) => {
    const r = await rpc('tools/call', { name, arguments: args });
    return { isError: r.result?.isError, text: r.result?.content?.[0]?.text ?? '' };
  };

  async function check(name, fn) {
    const t0 = Date.now();
    try {
      const detail = await fn();
      const ms = Date.now() - t0;
      results.push({ name, ok: true, ms, slow: ms > slowMs, detail: detail ?? '' });
    } catch (e) {
      results.push({ name, ok: false, ms: Date.now() - t0, detail: String(e.message ?? e) });
    }
  }
  const must = (cond, msg) => { if (!cond) throw new Error(msg); };

  await check('web page (browser)', async () => {
    const r = await http('/', { headers: { accept: 'text/html' } });
    must(r.res.status === 200, `status ${r.res.status}`);
    must(/text\/html/.test(r.res.headers.get('content-type') ?? ''), 'not HTML');
    must(r.text.includes('Ask OHNY') && r.text.includes('claude.ai/customize/connectors'), 'page content missing');
  });

  await check('help JSON', async () => {
    const j = json(await http('/?format=json'));
    must(j.install?.mcp_url && j.endpoints, 'help JSON incomplete');
  });

  await check('freshness (live from ohny.org)', async () => {
    const j = json(await http(`/v1/meta?now=${TEST_NOW}`));
    must(j.live === true, `live is ${j.live}${j.upstream_error ? ` (${j.upstream_error})` : ''}`);
    must(j.total_sites >= minSites, `only ${j.total_sites} sites`);
    const ageMin = (Date.now() - new Date(j.as_of).getTime()) / 60000;
    must(ageMin < maxAgeMin, `data is ${ageMin.toFixed(1)} min old`);
    ctx.sites = j.total_sites;
    return `${j.total_sites} sites, ${ageMin.toFixed(1)} min old, changes vs snapshot ${JSON.stringify(j.changes_since_snapshot)}`;
  });

  await check('nearby (open when you arrive)', async () => {
    const r = await http(`/v1/nearby?lat=40.7308&lng=-73.9973&max_walk_min=20&limit=3&now=${TEST_NOW}`);
    must(r.res.status === 200, `status ${r.res.status}`);
    const j = json(r);
    must(j.results.length > 0, 'no results on a busy Saturday afternoon');
    for (const c of j.results) must(c.name && c.walk_min != null && c.status && c.maps, `card incomplete: ${c.slug}`);
    must(typeof j.in_range_total === 'number', 'in_range_total missing');
    ctx.slug = j.results[0].slug;
    return `${j.total} found, first: ${j.results[0].name}`;
  });

  await check('nearby without a location -> clear 400', async () => {
    const r = await http('/v1/nearby');
    must(r.res.status === 400 && /cross street/.test(r.text), `status ${r.res.status}`);
  });

  await check('search', async () => {
    const j = json(await http('/v1/search?q=grolier'));
    must(j.results.length > 0, 'no result for "grolier"');
    ctx.slug = j.results[0].slug;
    return j.results[0].name;
  });

  await check('search: unknown name -> explicit no_match', async () => {
    const j = json(await http('/v1/search?q=zebra+tower'));
    must(j.no_match === true && j.results.length === 0, 'an unknown name must come back as no_match, not loose matches');
    must(/no site by that name/.test(j.message ?? ''), 'no explanatory message');
    return `checked ${j.searched_sites} sites`;
  });

  await check('site details (fresh)', async () => {
    const j = json(await http(`/v1/site/${ctx.slug ?? 'dieu-donne-26'}?now=${TEST_NOW}`));
    must(j.detail_fetched_live === true, 'detail not fetched live');
    must(j.site.status?.line && j.site.maps?.google_transit && j.site.description, 'site record incomplete');
    return j.site.name;
  });

  await check('changes', async () => {
    const j = json(await http('/v1/changes'));
    must(Array.isArray(j.changes?.added) && Array.isArray(j.changes?.modified) && Array.isArray(j.changes?.removed), 'unexpected shape');
    return `+${j.changes.added.length} / ~${j.changes.modified.length} / -${j.changes.removed.length}`;
  });

  await check('connector: initialize + instructions', async () => {
    const r = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'smoke-test', version: '1' } });
    must(r.result?.serverInfo?.name === 'ohny-skills', 'bad serverInfo');
    must((r.result.instructions ?? '').length > 500, 'instructions missing');
    must(/can't see live information|cannot see live information/i.test(r.result.instructions), 'fallback guidance missing from instructions');
  });

  await check('connector: notification -> 202', async () => {
    const r = await post({ jsonrpc: '2.0', method: 'notifications/initialized' });
    must(r.res.status === 202, `status ${r.res.status}`);
  });

  await check('connector: GET -> 405 (stateless)', async () => {
    const r = await http('/mcp', { headers: { accept: 'text/event-stream' } });
    must(r.res.status === 405, `status ${r.res.status}`);
  });

  await check('connector: tools/list (5 read-only tools)', async () => {
    const tools = (await rpc('tools/list')).result.tools;
    must(tools.length === 5, `${tools.length} tools`);
    must(tools.every((t) => t.annotations?.readOnlyHint === true), 'a tool is not marked read-only');
    return tools.map((t) => t.name).join(', ');
  });

  await check('connector: ohny_nearby call', async () => {
    const r = await toolText('ohny_nearby', { lat: 40.7308, lng: -73.9973, max_walk_min: 20, now: TEST_NOW });
    must(!r.isError, `tool error: ${r.text.slice(0, 120)}`);
    must(JSON.parse(r.text).results.length > 0, 'no results');
  });

  await check('connector: ohny_search no_match', async () => {
    const r = await toolText('ohny_search', { q: 'zebra tower' });
    must(!r.isError && JSON.parse(r.text).no_match === true, 'unknown name must be no_match');
  });

  await check('connector: ohny_guide playbook', async () => {
    const r = await toolText('ohny_guide', { topic: 'overview' });
    must(!r.isError && r.text.length > 1000, 'playbook missing');
    must(/can't be reached/.test(r.text), 'fallback section missing from playbook');
  });

  if (upstream) {
    await check('ohny.org itself (upstream)', async () => {
      const t0 = Date.now();
      const res = await fetchImpl('https://ohny.org/data/festival.json', { signal: AbortSignal.timeout(timeoutMs) });
      must(res.ok, `status ${res.status}`);
      const n = (await res.json()).records?.length;
      must(n > 0, 'no records');
      return `${n} records in ${Date.now() - t0} ms${ctx.sites && ctx.sites !== n ? ` (helper reports ${ctx.sites})` : ''}`;
    });
  }

  if (upstream) {
    await check('published lists on GitHub (independent fallback)', async () => {
      const res = await fetchImpl('https://raw.githubusercontent.com/dnaidionov/OHNY-skills/main/skills/ohny/assets/lineup/index.md', { signal: AbortSignal.timeout(timeoutMs) });
      must(res.ok, `status ${res.status}`);
      const t = await res.text();
      must(t.includes('OHNY Weekend 2026'), 'unexpected content');
      return `index.md ok, ${(t.match(/SAVED COPY from ([\d: -]+) UTC/) ?? [])[1] ?? 'date unknown'}`;
    });
  }

  return { base: root, ok: results.every((r) => r.ok), results };
}

export function formatReport({ base, results, ok }, quiet = false) {
  const lines = [`\n${ok ? 'PASS' : 'FAIL'}  ${base}`];
  for (const r of results) {
    if (quiet && r.ok) continue;
    const tag = r.ok ? (r.slow ? 'slow' : ' ok ') : 'FAIL';
    lines.push(`  [${tag}] ${r.name.padEnd(42)} ${String(r.ms).padStart(5)} ms  ${r.detail}`);
  }
  const failed = results.filter((r) => !r.ok).length;
  lines.push(`  ${results.length - failed}/${results.length} checks passed${results.some((r) => r.slow) ? ', some slow' : ''}`);
  return lines.join('\n');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const args = process.argv.slice(2);
  const bases = args.flatMap((a, i) => (a === '--base' ? [args[i + 1]] : []));
  const quiet = args.includes('--quiet');
  let allOk = true;
  for (const base of bases.length ? bases : DEFAULT_BASES) {
    const report = await runSmoke(base, { upstream: base === (bases[0] ?? DEFAULT_BASES[0]) });
    console.log(formatReport(report, quiet));
    allOk &&= report.ok;
  }
  console.log(allOk ? '\nAll good.' : '\nSOMETHING IS WRONG: see FAIL lines above.');
  process.exit(allOk ? 0 : 1);
}
