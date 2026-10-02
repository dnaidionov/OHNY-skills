# OHNY skill (unofficial)

A pocket guide to Open House New York Weekend (Oct 16-18, 2026): check-in, "what's open near me", site and festival Q&A, day planning, directions. Built for phones and voice. **Not affiliated with OHNY.** Made by [Dmitry Naidionov](https://naidionov.com).

## Install

Pick the route that fits your account. The first two work on a phone-first, "set it up once" basis.

### 1. Connector (recommended; works on Claude Free, and then on your phone)

The helper is also an MCP server, so it can be added as a **custom connector**. It carries its own instructions, so there is nothing else to install.

- **Server URL:** `https://naidionov.com/ohny/skills/mcp` (no sign-in needed; the same service is also at `https://ohny-skills.dnaidionov.workers.dev/mcp`)
- **One tap (Claude): [Add Ask OHNY to Claude](https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=Ask%20OHNY&connectorUrl=https%3A%2F%2Fnaidionov.com%2Fohny%2Fskills%2Fmcp)** opens Claude's "Add custom connector" dialog with the name and URL already filled in; you just review and confirm (sign in first if asked). Do this on claude.ai or the desktop app; it then shows up in the phone apps.
- **Claude (all plans, Free gets one custom connector):** on claude.ai in a browser or the desktop app, open **Settings, Connectors, Add custom connector**, paste the URL, and save. Then open the Claude app on your phone, signed in to the same account: the connector is there, and voice works as usual. (As of writing, the mobile apps use connectors but can't add new ones.) Start a chat with "ohny, what's open near me?" or pick the **ohny** prompt from the + menu.
- **ChatGPT (Plus, Pro, Team, Enterprise, Edu):** Settings, Connectors, turn on Developer Mode, **Create**, paste the URL, choose "No authentication". Free ChatGPT doesn't support custom connectors.
- **Tap-to-install from a phone** needs the connector to be listed in a directory (Claude's connector directory, ChatGPT's app directory). That requires a submission and review by the platform, so it's not done yet.
- Check it with the official inspector: `npx @modelcontextprotocol/inspector --cli https://naidionov.com/ohny/skills/mcp --transport http --method tools/list`

The five tools are `ohny_nearby`, `ohny_search`, `ohny_site`, `ohny_changes` and `ohny_guide` (the detailed playbook, read on demand). They are read-only and take no personal information.

### 2. No install at all (any chatbot that can browse the web)

Paste this into a new chat:

> Use https://raw.githubusercontent.com/dnaidionov/OHNY-skills/main/standalone/OHNY.md as your guide to Open House New York Weekend for this chat. Then ask me what I'd like to do.

It works for that conversation only (paste it again next time), needs the chatbot's web browsing to be on, and has no itinerary page; it can work on free accounts. `standalone/OHNY.md` is generated from the skill by `npm run build:standalone`, and a test fails if it gets out of date.

### 3. Claude skill (paid plans; add from a computer)

1. Download **[ohny-skill.zip (v0.2.0)](https://github.com/dnaidionov/OHNY-skills/releases/download/v0.2.0/ohny-skill.zip)** from the [Releases page](https://github.com/dnaidionov/OHNY-skills/releases). It already has the `ohny` folder (the one with `SKILL.md`) at its top level, which is what Claude expects. Developers can instead build it with `npm install && npm run package`, which writes `dist/ohny-skill.zip`.
2. In claude.ai or the desktop app open **Customize, Skills** (menu names change) and upload the zip. Code execution must be on. The phone apps then use it too, but can't upload skills themselves.
3. Say **"ohny, what's open near me?"**. You can also say "Open House New York" or tag **#ohny**.

For ChatGPT or Gemini skills: paste `skills/ohny/SKILL.md` as the instructions, add `skills/ohny/references/` as files, and for ChatGPT add an Action from `openapi.yaml`. Gemini may not be able to call the helper service.

### Trying it before the festival (Oct 16-18, 2026)

Outside those dates the assistant asks what day and time to pretend it is, for example "Saturday 2:30 PM"; you can change it any time ("make it Sunday morning").

### Run your own copy of the backend (optional)

Fork this repo and see "Deploy" below (the Worker also answers under a path prefix: set `routes` in `wrangler.toml` for your own domain). Then change `API_BASE` in `skills/ohny/SKILL.md`, `servers.url` in `openapi.yaml`, and the connector URL to your Worker's address.

## How it fits together

```
 visitor's phone ── AI app (Claude / ChatGPT / Gemini)
                      │  skill instructions (skills/ohny)  + the visitor's own memory
                      ▼
        Cloudflare Worker (src/)  ── stateless, free plan, no storage, no visitor data
                      │  reads live, edge-cached ~30 s
                      ▼
        ohny.org/data/festival.json  and  ohny.org/data/<id>.json   (OHNY's public files)
```

- **Freshness.** The Worker never trusts its bundled copy for anything that can change. On every request (cached ~20-30 s) it re-reads the live `festival.json`:
  - **Cancellations and sell-outs:** applied immediately. A site that disappears from the list is treated as canceled.
  - **Changed hours or tour times:** applied immediately (ticket links are carried over).
  - **Sites added after the snapshot:** found automatically. Their description is fetched live from OHNY's detail file; their map position is looked up from the address (cached), or, with no usable address, estimated from the neighborhood and flagged approximate.
  - **Sites that move:** the old position is discarded and re-looked-up.
  - The saved snapshot (`data/lineup.json`) only supplies descriptions, websites and map positions for the sites it already knew. If ohny.org can't be reached the Worker says so (`live:false`). `GET /v1/changes` lists everything that differs from the snapshot. Rebuild the snapshot before the festival to make late additions exact.
- **Walking distance.** `nearby` takes `max_walk_min` ("what's within 15 minutes?") and checks each site against the time you'd **arrive** (now + walk), skipping places that close before you get there or leave under 10 minutes to look around. Skipped places are returned by name with the reason, so the assistant can tell the visitor. Results are ranked by a blend of how well a site fits the visitor's interests, how close it is, and (when they ask "what else is near here?", via `near=<slug>`) whether OHNY itself suggests it as nearby; a suggestion that doesn't match their interests is reported separately instead of recommended. Group needs filter the list: `child_age` (age limits) and `wheelchair=true`, with the reason given for each place left out.  and each result carries short entry-rule hints from the site's access notes (photo ID, bag limits, age limit, ...).
- **Privacy.** The Worker keeps nothing and receives no names, emails or zip codes. The skill keeps the visitor's profile in the AI platform's own memory.
- **Test mode.** Every call takes `now=2026-10-17T14:30` (New York time). Outside Oct 16-18 the skill asks the tester what moment to pretend it is, and lets them change it.

## Layout

| Path | What |
|---|---|
| `skills/ohny/` | The skill: `SKILL.md`, `references/` (api, checkin, planning, about), `assets/itinerary-template.html` |
| `src/core/` | Parsing, open-now/closing-soon logic, interest matching, nearest-first search, live merge |
| `src/handler.js`, `src/worker.js` | The HTTP API and the Cloudflare entry point |
| `src/mcp.js`, `src/guide-data.js` | The MCP connector (`/mcp`) and its generated playbook text |
| `standalone/OHNY.md` | The whole skill in one file, for paste-and-go use (generated) |
| `skills/ohny/scripts/ohny_offline.py`, `skills/ohny/assets/lineup*` | The offline fallback bundled in the skill (generated data) |
| `scripts/smoke-test.mjs` | `npm run smoke`: checks the deployed service from outside |
| `.github/workflows/refresh-lineup.yml` | Keeps the saved lineup fresh around the festival |
| `scripts/build-snapshot.mjs` | Builds `data/lineup.json` (fetches everything, geocodes via OpenStreetMap Nominatim, 1 req/s, cached) |
| `openapi.yaml` | Description of the API for ChatGPT Actions |
| `test/` | `npm test` (Node's built-in runner, no dependencies) |

## Run and test

```bash
npm test                    # 52 unit tests, no network (the offline tests need python3)
npm run build:data          # refresh data/lineup.json (do this again right before the festival)
npx wrangler dev            # local API at http://localhost:8787
curl 'http://localhost:8787/v1/nearby?lat=40.7295&lng=-73.9965&interests=history&now=2026-10-17T14:30'
```

## Deploy (free)

```bash
npm install
npx wrangler login
npm run build:data
npx wrangler deploy         # prints https://ohny-skills.<you>.workers.dev
```

Then put that URL in `API_BASE` in `skills/ohny/SKILL.md` and in `servers.url` in `openapi.yaml`. The Workers free plan allows roughly 100k requests a day; this uses no storage products. Refresh the snapshot and redeploy before the festival and whenever convenient after OHNY adds sites; the Worker already handles new ones live (see Freshness), the rebuild just makes their positions exact.

## When something is down (and how to check)

How the assistant degrades (each tier is tried in order; it never guesses hours or tickets):

| Tier | What it uses | Works when |
|---|---|---|
| 1. Normal | The live service (`naidionov.com/ohny/skills`, or the connector) | Everything is up |
| 2. Backup address | The same service at `ohny-skills.dnaidionov.workers.dev` | Your domain or its routing has a problem |
| 3. Offline tool | `skills/ohny/scripts/ohny_offline.py` (Python, standard library only) on the lineup bundled in the skill; overlays live ohny.org status when it can reach it | The skill is installed and the chat can run code; no server needed |
| 4. Bundled lists | `skills/ohny/assets/lineup/*.md`, compact per-borough lists the assistant just reads | The skill is installed but it can't run code |
| 5. Published lists | The same lists on GitHub raw (independent of our server), then the chosen site's live record at `ohny.org/data/<id>.json` | It can browse the web (works for paste-and-go and the connector too) |
| 6. Say so | "I can't see live information right now", with pointers to ohny.org | Nothing else works |

Things that never need the service keep working: check-in (OHNY's form link), general festival questions from ohny.org, and map links built from an address. The connector carries the same rules in its instructions, but if the server is down when the connector loads there is nothing to carry them; the paste-and-go line is the backup.

The offline files are regenerated by `npm run build:fallback` (a test fails if they are stale), and a scheduled GitHub Action (`.github/workflows/refresh-lineup.yml`, every 30 minutes from Oct 1 to Oct 20, only committing when OHNY's lineup changed) keeps the published copy minutes old. Pull before you edit locally. A parity test runs the Python tool and the JavaScript service on the same data so the two can't drift apart (offline matching uses names and short descriptions only, not full descriptions).

Health check (run it before every deploy, and on a schedule during the festival):

```bash
npm run smoke                                   # both public addresses
npm run smoke -- --base https://your.domain/path --quiet
```

It checks the web page, live freshness from ohny.org, nearby, search, site details, changes, and the connector (initialize, tool list, tool calls, the playbook), and exits with code 1 if anything fails, so it can drive an alert. For a simple always-on monitor, point any uptime service at `https://naidionov.com/ohny/skills/v1/meta` and alert when the response does not contain `"live": true`.

## Installing the skill (check each platform's current rules; they change quickly and I could not confirm them against primary sources)

| Platform | Free accounts | What to do |
|---|---|---|
| **Claude** | **No.** Uploading a custom skill needs Pro, Max, Team or Enterprise with code execution on. | Zip `skills/ohny` and add it under Customize, Skills. An org on Team/Enterprise can provision it for everyone. The helper's domain may need allowing for network access; if it can't be reached, the skill falls back to OHNY's public files. |
| **ChatGPT** | **Unclear.** Reports say Skills are in beta on Free/Go/Plus/Pro, but creating *personal* skills or custom GPTs may be limited to Business/Enterprise/Edu. Free users could previously *use* GPTs made by others. | Check what your plan allows you to publish before relying on this. Either a skill (paste/upload `skills/ohny`) or a GPT (paste `SKILL.md` as instructions, upload `references/` and `assets/`, add an Action from `openapi.yaml`). |
| **Gemini** | **Probably yes** for plain instruction skills (announced for all Google AI tiers, 18+). Unknown whether a skill can call the helper service or be shared with others. | Paste `SKILL.md` (shortened if there's a length limit) and rely on Gemini's own web access to read `https://ohny.org/data/festival.json`. Expect a reduced experience (no helper service, no itinerary page). |

## Known gaps

- **Direct check-in is not built.** The Fillout form doesn't accept prefilled values from a link, so today the skill reads the form out and the visitor types it (`CHECKIN_MODE = link`). A direct submission needs OHNY's blessing (ideally their API key or a supported endpoint); see `skills/ohny/references/checkin.md`.
- **Ticketed sites publish no street address** (it comes with the ticket). Their map positions come from name lookups or neighborhood centres and are flagged approximate.
- **Live ticket availability** isn't in OHNY's data, only the "Sold Out" status and the ticket links.
- **Popularity** is inferred (see `references/planning.md`), not measured.
- **Interests** are matched by keywords because the lineup has no category field.

## License and disclaimer

MIT licensed, see [LICENSE](LICENSE). This is an independent fan project. It is **not affiliated with, endorsed by or sponsored by Open House New York**. The festival lineup it shows belongs to OHNY and is read live from their public website; always check ohny.org for the final word.
