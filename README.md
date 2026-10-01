# OHNY skill (unofficial)

A pocket guide to Open House New York Weekend (Oct 16-18, 2026): check-in, "what's open near me", site and festival Q&A, day planning, directions. Built for phones and voice. **Not affiliated with OHNY.**

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
| `scripts/build-snapshot.mjs` | Builds `data/lineup.json` (fetches everything, geocodes via OpenStreetMap Nominatim, 1 req/s, cached) |
| `openapi.yaml` | Description of the API for ChatGPT Actions |
| `test/` | `npm test` (Node's built-in runner, no dependencies) |

## Run and test

```bash
npm test                    # 19 unit tests, no network
npm run build:data          # refresh data/lineup.json (do this again right before the festival)
npx wrangler dev            # local API at http://localhost:8787
curl 'http://localhost:8787/v1/nearby?lat=40.7295&lng=-73.9965&interests=history&now=2026-10-17T14:30'
```

## Deploy (free)

```bash
npm install
npx wrangler login
npm run build:data
npx wrangler deploy         # prints https://ohny-skills.dnaidionov.workers.dev
```

Then put that URL in `API_BASE` in `skills/ohny/SKILL.md` and in `servers.url` in `openapi.yaml`. The Workers free plan allows roughly 100k requests a day; this uses no storage products. Refresh the snapshot and redeploy before the festival and whenever convenient after OHNY adds sites; the Worker already handles new ones live (see Freshness), the rebuild just makes their positions exact.

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
