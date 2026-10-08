# Project decisions

## 2026-10-04 — One repository for Codex, ChatGPT desktop, and Claude Code

The owner wants to develop this local, GitHub-backed project using all three tools, with each implementing and testing its platform-specific behavior. Existing architecture already has a shared skill, HTTP/MCP backend, offline fallback, and generated standalone guide. Keep those as the canonical product sources.

Use `AGENTS.md` for shared development rules, `CLAUDE.md` as a small import, and an explicit project instruction for ChatGPT desktop. Keep significant decisions and test evidence in Git because conversations and account memories are not the shared project record. This codifies the owner's requirements for tests before implementation, positive and negative cases, pragmatic review, and documentation synchronized with code.

**Alternative considered:** independent project copies, instructions, or skills for each provider. That simplifies local experimentation but creates three places to fix behavior and reconcile decisions. Shared sources with small discovery/configuration differences better fit this already shared product.

## 2026-10-04 — Relative skill links, with native discovery tested separately

`.agents/skills/ohny` and `.claude/skills/ohny` point to `../../skills/ohny`. Both hosts document symlinked skill directories. This gives each local coding tool its expected discovery path without copying the skill or changing release packaging. `CLAUDE.md` imports `AGENTS.md` instead of duplicating it, including in sessions where Claude's instruction-file precedence prevents direct discovery.

**Tradeoff:** symlinks need appropriate Git/OS support, especially on Windows, and archive downloads may not preserve them. Use Git on macOS/Linux/WSL or a correctly configured Windows checkout. Tests verify that references, assets, and the offline helper work through both links, including from another working directory. Native host selection still needs an actual app test; filesystem parity is not evidence that the app loaded the skill.

ChatGPT desktop uses an attached local project and explicit development instructions. We do not assume that its discovery or connector setup is identical to Codex's. Its file-loading, discovery, and connected-tool routes are recorded separately.

## 2026-10-04 — Isolate simultaneous edits and exchange evidence

Use one folder for sequential work and separate worktrees plus branches for concurrent work. Assign tasks by behavior and verify the combined changes before integration. Handoffs identify source revision, changes, reasoning, test results, native environment, and remaining work.

**Tradeoff:** worktrees add setup and dependency copies. That cost is worthwhile for simultaneous editors; it is unnecessary for serial work. Branches in one shared folder do not prevent file collisions.

## 2026-10-04 — Test failures stop packaging and automated refresh commits

Add an npm `prepackage` test check and a Validate workflow for pushes and PRs. The refresh workflow must test regenerated output before committing it. Positive and negative packaging tests first demonstrated that a failing test did not previously block archive creation; the new check makes it fail with no new archive in a clean build.

**Alternative considered:** leave packaging as an unchecked utility and rely on people to remember tests. That is faster for repeated packaging, but conflicts with the owner's explicit requirement that failures stop the build. The existing tests are fast and offline, so enforcing them is appropriate. Do not disable npm lifecycle scripts for a release. A failed build may leave an older archive from a previous run; it is not a newly validated release.

Automated tests, live-service smoke checks, and native app acceptance are distinct evidence. Each native result records product/version, route, source revision where known, and limitations. Successful API calls do not establish ChatGPT UI behavior, Claude Code skill selection, mobile location, voice, or persistent memory.

## 2026-10-04 — ChatGPT visitor setup must happen entirely on a phone

The owner clarified that ChatGPT desktop is a development tool; the final visitor product must run in the native ChatGPT mobile app, including first-time setup entirely on the phone. A one-time computer step is not acceptable. This supersedes any earlier implication that desktop project setup or developer-mode connection completes the visitor setup.

Keep the shared skill and backend. Evaluate an account-available remote OHNY plugin for distribution, but do not describe it as registered, published, or installable before those steps and actual phone tests exist. Current official documentation supports mobile use of account-available plugins but does not establish OHNY's phone-only onboarding. The detailed requirement, references, alternatives, and M1–M9 acceptance cases are in `docs/chatgpt-mobile.md`.

**Alternatives and reasoning:** local skill links solve development discovery only. Desktop developer connections help test the service, but they do not meet this requirement. Pasting the standalone guide is a useful phone experiment; requiring it again for every chat does not provide the intended reusable setup. A custom GPT using the existing Action schema remains an option to evaluate, not an already tested product. Remote plugin distribution reuses the MCP service but adds registration/review and mobile validation work. Choose a public route based on actual onboarding and tool behavior rather than assuming desktop availability carries over.

Remove the landing page's ChatGPT developer-mode instructions and unverified plan promises. Show the incomplete mobile status and a clearly labeled one-chat trial. Keep development instructions in the contributor guide. Two tests first demonstrated that the old visitor panel violated the new requirement; retain them to prevent misleading installation claims. This content correction does not deploy the site or complete mobile distribution. Native phone and voice checks remain NOT RUN until evidence is recorded.

## 2026-10-05 — Serve the pasted guide from naidionov.com, not GitHub's raw host

A Gemini visitor who pasted the "use <link> as your guide" message got "I wasn't able to access the link." The link pointed at `raw.githubusercontent.com/.../standalone/OHNY.md`. The cause is not confirmed (raw GitHub being refused by Gemini's reader and browsing being off in that chat both fit the report), so this is a likelier route, not a proven fix.

The Worker now serves the standalone guide as `text/plain` at `/guide` (also `/guide.md`, and under `/ohny/skills/`). The text is generated into `src/standalone-data.js` by `npm run build:standalone`, so it needs no file access or live data and cannot drift (a test fails if it is stale). The paste line on the landing page, README, `docs/chatgpt-mobile.md` and `docs/phone-test.md` Test 1 now use `https://naidionov.com/ohny/skills/guide`.

**Alternatives:** keep GitHub raw (known to fail for this visitor); a static page on the main naidionov.com site (a second place to keep in sync, outside this repo); pasting the full 42 KB guide (too long for many phone chats). The skill's saved-lineup fallbacks still use GitHub raw and are unchanged.

**Limits:** this does not establish that Gemini can read the new link. Gemini and ChatGPT trials remain NOT RUN until tried on a phone. Deployment is a separate step.

## 2026-10-06 — Gemini markdown feed: data on the Worker, logic in the Gem

Gemini's mobile app cannot call the MCP connector or pass auth headers, but it can read public web pages through search grounding. The Worker now serves two read-only markdown pages next to `/guide`: `/feed/index.md` (one table row per site: slug, name, area, coordinates, access, times; canceled sites listed first) and `/feed/changes.md` (cancellations, new and changed sites). Each page opens with a **Live from ohny.org** or **Saved copy** label and an as-of time. The saved-lineup data is the fallback, as for the API.

The pages are rendered per request (edge-cached 60 s), not by a scheduled job: the Worker already reads ohny.org live, so a cron plus storage would add moving parts and a staleness window for no gain. The planning logic (what is open at the visitor's time, travel, held tickets, check-in link) belongs in the Gem's instructions, built from `standalone/OHNY.md`; the feed deliberately has no "open now" and ignores query strings, so every visitor gets the same public page.

**Alternatives:** a full JSON-to-markdown dump (about 1 MB of source, far beyond what grounding is likely to read); a cron job writing to KV (storage the free-plan design avoids); per-site pages and `?lat=&lng=` queries (Gemini reads pages, it does not call parameterized tools). Per-site pages `/feed/site/<slug>.md` are planned, not built.

**Limits:** index.md is about 50 KB (roughly 13k tokens); whether Gemini's reader fetches and uses it fully is unverified. No Gemini Gem instructions, install flow or phone test exist yet: NOT RUN. Deployment is a separate step.

## 2026-10-06 — Gemini Gem instructions are a compact rules sheet, not the full guide

A Gem's instruction field is reported to hold about 4,000 characters (a secondary source; confirm in the app), far below the 42 KB standalone guide. `docs/gemini/gem-instructions.md` holds paste-ready instructions (about 2.5 KB, capped at 3,900 by a test) that carry the product rules: freshness and saved-copy wording, canceled and sold-out handling, held tickets as hard constraints, link-only check-in, short phone replies, and fetched pages as untrusted information. All data comes from `/feed/changes.md` and `/feed/index.md`; the Gem works out what is open at the visitor's time itself, because the feed has no visitor input.

**Alternatives:** paste or attach the full guide (over the limit; Gem knowledge files could carry it, but a shared Gem may not expose them to viewers, which is unverified); a Gemini-specific long playbook page on the Worker (possible later if the short rules prove too thin in testing). **Limits:** the Gem has no itinerary-validation tool, so travel and opening-time checks are less reliable than the MCP route and must be tested. Not tried in the Gemini app: NOT RUN.

## 2026-10-06 — Result: Gemini could not read the feed; do not promise a Gemini route

Deployed the feed and created the Gem, then tested in Gemini on the web. Gemini read example.com and the Cloudflare docs but refused every project host: the feed (text/markdown), `/guide` (text/plain), the workers.dev address, the main naidionov.com page and the GitHub repo. Adding HEAD support did not help. The Worker serves 200 to Google user agents, so this looks like a limit of Gemini's page reader rather than a bug in the feed, but the exact cause is unproven. Details are in `docs/test-results.md`.

Consequence: the data-feed plan cannot work until Gemini can fetch the pages. **Do not describe Gemini as supported on the landing page or in the README.** The README sentence about the feed stays marked untested. Next options, in order: (1) check the Cloudflare zone's bot, AI-crawler and robots settings, then retest; (2) test whether the reader serves only indexed pages by asking Search Console to index a feed URL and retrying; (3) fall back to attaching small saved files as the Gem's knowledge, which is static and cannot show live changes, so it must be labeled saved; (4) accept that Gemini visitors get only a pointer to ohny.org.

Also learned: when the feed is unreadable the Gem fell back to Google Maps data and recommended places with hours. The instructions now forbid recommending anything unless the feed was read. The saved Gem was updated with the new text on 2026-10-06; its behavior with the new rule has not been re-tested.

## 2026-10-06 — Mirror the feed into a public gist for Gemini

Gemini web read a public gist copy of `changes.md` but refused naidionov.com, the workers.dev address and the GitHub repo in every format tried (see `docs/test-results.md`; cause unknown). The Worker feed stays the source of truth. A new Action (`.github/workflows/mirror-feed.yml`, `scripts/mirror-feed.mjs`) copies the two live pages into gist `9a3ab441d37275bd105bb349ce87c697` every 30 minutes during Oct 1-20, 2026, so the Gem can read stable gist URLs.

The script is all-or-nothing: it fetches both pages, checks each has the feed heading and a "Live from ohny.org" or "Saved copy" label, and writes nothing if any page is an error or off-format, so a good mirror is never replaced by a 404 page. It ignores the as-of time when comparing, so an unchanged feed does not rewrite the gist. Mirrored pages can be up to 30 minutes older than the Worker's; their as-of line says so.

**Alternatives:** a Cloudflare setting that lets Gemini read our own hosts (preferred if found; untested because I cannot see the zone settings); GitHub Pages (untested with Gemini); attaching static files as Gem knowledge (cannot show live changes). **Costs and limits:** needs a repository secret `GIST_TOKEN` (a personal access token with only the gist scope) that the owner must create; scheduled workflows run only from the default branch, so this does nothing until merged to `main`; the gist is public (public lineup data only); Gemini reading the 50 KB `index.md` and the raw URLs is not yet confirmed.

## 2026-10-07 — A Gemini Gem cannot get live OHNY data by itself; what is and is not possible

Results (details in `docs/test-results.md`): Gemini reads a public gist page when the **user types its URL**, but the Gem did not open the same URL from its own instructions in three runs. A Google Drive document attached as Gem knowledge **is** read, but looked like a snapshot taken at attach time (a one-minute edit check), and the Drive connector available here cannot change a file's contents, so an automatic refresh would need new credentials and was not tried.

Consequences: (1) A Gem cannot be promised live cancellations. Do not describe Gemini as supported on the landing page or in the README for live data. (2) The gist mirror workflow only helps if the visitor pastes the link, which is poor on a phone; it is built but not enabled (no `GIST_TOKEN` secret, not on `main`). (3) A Drive document would work as a labeled **saved copy** attached to the Gem; it would need a manual refresh (re-create and re-attach), and it should be clearly labeled with its as-of time. (4) The Gem must keep its rule of never listing sites when it cannot read live data; that rule held in every run.

**Options not taken yet:** a Docs/Drive API refresh job with a service account (heavy, and unproven that the Gem rereads changes); asking the visitor to paste the gist link at the start (works, clumsy); accepting that Gemini visitors get a pointer to ohny.org plus the check-in link. Claude and ChatGPT remain the supported routes with live data.

## 2026-10-07 — Gemini route: an Opal app that calls the Worker's GET API

Opal (Google Labs) steps cannot call MCP, but the agent step's Get Webpage tool reads `naidionov.com/ohny/skills/v1/*` (unlike Gemini chat's reader). The app's agent prompt is generated from the skill (`scripts/build-opal.mjs` → `docs/gemini/opal-prompt.md`: Opal-specific rules plus `references/api.md` and the URLs from SKILL.md settings), tested like the standalone guide, and pasted into the Opal step. Opal writes "@" as a tool shortcut, so the prompt uses `%40`.

**Limits, stated plainly:** Opal and "Gems made by Labs" turn off on 2026-11-17 with no migration (Google FAQ), so this serves the 2026 festival only. Shared Opal apps are used in a phone's mobile browser, not inside the Gemini mobile app (Google help). Each run is one request and one answer, not a conversation. The first end-to-end scenario matched the API exactly; the other scenarios and the phone check are not yet run.

**Alternatives:** the feed + Gem (Gem could not fetch pages on its own), a Drive-knowledge Gem (snapshot only), "skills in Gemini" (Opal's successor; capabilities unverified).

## 2026-10-07 — Opal app is a chat inside one agent step

Opal's agent step chats with the visitor (asks a question, shows a reply box or choice buttons, and continues) when its prompt says to ask through the chat and wait; a softer "ask Anything else?" instruction made it write the question into its final answer and end the workflow instead. So the conversation lives inside the "Retrieve events" agent step and ends when the visitor says they're done, after which the output step shows the summary. No "Go to" loop was needed. Memory (Opal's Use Memory) is opt-in: the agent must ask first, may keep only interests, Passport, held tickets, kids' ages and accessibility needs, never location, names, emails, zip codes, phone numbers, hours or status, and must support "forget". Each turn still takes roughly 30 seconds to 1.5 minutes.

## 2026-10-07 — Interests match singular and plural alike; closeness outweighs match count

Live `nearby` near Union Square gave different sites for `rooftops,gardens` (45-73 min walks) and `rooftop,garden` (18-25 min). Two causes: interest aliases were listed inconsistently ("gardens" but not "garden"), and free words were matched as substrings, so "rooftops" never matched a site that says "rooftop". Interests, aliases and site words are now reduced to a conservative singular stem (`singular()` in `src/core/tags.js`: leaves glass, campus, bus alone) before matching.

With that fixed, both forms agreed on the far results, which exposed the ranking: proximity was `1 - min(km / 2, 1)`, so everything beyond 2 km (about a 30-minute walk) scored zero for closeness, and a far site matching two interest tags beat a near site matching one. The API reference already promised "closest first". Proximity is now `1 / (1 + km / refKm)` (half at refKm, never zero) and the weights are 0.25 interest fit, 0.55 closeness, 0.2 OHNY suggestion, 0.1 kids (was 0.45 / 0.35 / 0.2 / 0.1). Tests: singular/plural pairs give the same tags, words and nearby order; a near one-interest site beats a far two-interest one; at similar distances the better match still wins.

**Remaining, not changed here:** keyword tagging is coarse (Original Maps of Manhattan at the Borough President's Office is tagged views and nature), so it still ranks second at 45 minutes for rooftops and gardens. Tightening `TAG_RULES` is a separate change. The Worker change needs a deploy to reach the live service and every route (Claude, ChatGPT, Opal).

## 2026-10-07 — Tagging: "view" must be a noun; "park"/"farm" need more than a passing mention

Original Maps of Manhattan at the Borough President's Office ranked second for "rooftops and gardens" at a 45-minute walk because its text says "View rarely seen historic maps" (verb) and "the Blackwell Farm map" (a name). Across the lineup the same patterns mis-tagged many sites: "on view" (a shared series blurb) and "view original artifacts" put 71 sites under views; "National Park Service", "Sunset Park", "Farmers Trust", "Central Park views" put 21 under nature.

Rules now: views needs "views" or a noun-like "view" (panoramic/city/harbor… view, view of/over/from/across) or the existing rooftop/terrace/observation/skyline/floor words. For nature, strong words (garden, greenhouse, wildlife, nature, trees, botanic, wetland, habitat) count on one mention; the weak words park(s)/farm(s)/farming count only in the site's name, summary, series or special note, or at least twice in its text (`WEAK_RULES` in `src/core/tags.js`), so "School-Based Hydroponic Farm" and "Brooklyn Grange Sunset Park" stay nature. Applying a one-mention rule to every tag was rejected: it changed 250 of 314 sites and dropped many real tags.

Interest words that are tag aliases ("views", "gardens", "churches") are no longer also matched as raw words: after the plural fix, "views" became "view" and matched "on view". The tag rules decide those; free words ("gothic", "accounting") are still matched in the text.

Saved data: `npm run retag` (new, offline) re-derives tags in `data/lineup.json`, then `npm run build:fallback`; a test fails if saved tags don't match the rules. The offline Python tool (`skills/ohny/scripts/ohny_offline.py`) got the same singular-stem matching, alias-word rule and ranking, with parity tests for singular, plural and free-word interests.

## 2026-10-07 — One-call day planning (`/v1/plan/day`) and `format=text`

The owner's Opal run ("tickets for the St John the Divine vertical tour Saturday afternoon, plan my Saturday") failed after the time was confirmed. Opal's Get Webpage is a nested Gemini Flash call with URL context that summarises the page: one fetch took 58 s, another hung 200 s+, a summary invented a "1:00" session, and the agent lost the slug and searched again. A plan needed 4-6 such calls, each a chance of "no content in Gemini response".

New `GET /v1/plan/day?ticket=<slug or name>@<time>&from=<lat>,<lng>` (`src/core/plan.js`) does the whole plan server-side from existing pieces: name lookup via `search`, `resolveTickets` (session check with the real listed times), `nearby` before the first ticket (with leave-by) and after the last (from that site at its end time), and `checkPlan` on the suggested order. If any ticket isn't confirmed it plans nothing and says why. `plan/day`, `nearby` and `search` accept `format=text` (`src/text.js`): short lines with exact times, slugs, links and the as-of time already in New York time (which also removes the UTC-reading mistake). JSON stays the default, so existing clients are unaffected.

Opal prompt: plan with one `/v1/plan/day` call; add `format=text`; ask Get Webpage to return the page verbatim; at most two fetches per answer; reuse slugs from earlier in the chat. **Limits:** a single nested fetch can still hang or return nothing inside Opal; fewer calls makes that rarer, not impossible. The MCP connector and the ChatGPT Actions schema (`openapi.yaml`) do not yet expose `plan/day`.

## 2026-10-07 — `ohny_plan_day` in the Claude and ChatGPT connectors

The MCP connector (Claude, ChatGPT) gets `ohny_plan_day`, mapped to `/v1/plan/day`; `openapi.yaml` gets `planDay` for the Actions API. Reason: the same one-call plan that fixed Opal also saves connector assistants a nearby → check_plan round trip and makes the session check impossible to skip. `ohny_check_plan` stays for plans the visitor changes, or for plans that don't start from a ticket. The skill (SKILL.md tickets step 3, planning.md section 5) now says to start ticket days with `ohny_plan_day`. To keep the tool list under the 8,000-character budget, the parameter descriptions were shortened (7,989 now); a test enforces the budget. The landing page manual gets a ticket example. Not changed: the ChatGPT review case P3 checks a plan the visitor gives, which is still `ohny_check_plan`'s job. The Opal prompt is unchanged, so the Opal app needs no retyping. After the festival `ohny_plan_day` is removed along with the other planning tools.

## 2026-10-07 — Gemini: the connector as a custom app becomes the main Gemini route

Gemini now accepts remote MCP servers as "custom apps" (Settings, Connected Apps, Add a custom app; Google Help answer 17209137). Tested on the owner's account: our `/mcp` was accepted with no sign-in, and all seven tools were listed. The owner's Saturday script got real session times and a plan made only of OHNY sites, about 25 s per turn, compared with Opal's 36 s to over 200 s per turn. It reuses the Claude/ChatGPT connector unchanged, so no Gemini-specific backend is needed. Limits from Google: 18+, US, personal Google account, English, Keep Activity on, added on gemini.google.com (not in the phone app), no sharing. Google offers no prefilled-add link, unlike Claude's `connectorUrl`. The landing page's Gemini tab therefore gives a link to `https://gemini.google.com/apps` (opens Connected Apps directly), a copy button for the address, and three steps. Everyone else keeps the pasted-guide trial or the Opal app. Opal is now a fallback: no further Opal speed work unless the custom-app route fails on phones.

## 2026-10-08 — `/v1/changes` lists every site canceled now

The cross-assistant test found that "anything canceled?" got "nothing canceled" from Gemini, Claude and Opal while two sites were canceled (Monumental Labs, Murry Bergtraum). `/v1/changes` only diffed live data against the snapshot, and both sites were already canceled when the snapshot was built. Each site's own record was right; only the changes view missed them.

Fix: `/v1/changes` now leads with `canceled_now`, every currently canceled site (live status `Canceled`, or dropped from the live list), with its days, whether it changed since the snapshot, and `removed` when it vanished. The since-snapshot diff is unchanged. `format=text` for changes starts with "CANCELED NOW: n". `/feed/changes.md` gets a "Canceled now" section. The `ohny_changes` description says it lists all sites canceled now (still under the 8,000-character tool budget), and `api.md` says to answer cancellations from `canceled_now`. Rejected: rebuilding the snapshot. It would hide the two sites from the diff anyway and would only fix today's state. The Opal prompt text changed (the api.md row), but the Opal app works without retyping, because the JSON it fetches now carries `canceled_now`.

## 2026-10-08 — Model and effort advice in the install instructions

The model is the visitor's choice in their AI app (the helper service uses none), so model choice is advice, not configuration. Based on the 2026-10-07/08 timing runs:
- **Claude:** Sonnet 5.5 (default), with Opus 5.5 as the fix when it skips Ask OHNY (Opus used the tools where Sonnet searched the web, at similar speed). Avoid Haiku 5.5, which made factual mistakes. "Always allow" is the bigger speed win.
- **ChatGPT:** Instant (higher effort was about 4× slower with the same facts).
- **Gemini:** 3.8 Flash (Pro about 5-7× slower with the same answer; Flash-Lite not faster).
- **Opal:** fixed, nothing to choose.

The wording is cautious (single runs, apps change). Claims are limited to what was measured: Claude effort levels and Gemini extended thinking weren't tested, so the advice says to leave effort as is rather than claiming effects. Shown in each landing-page tab and in a README "Choosing a model" section; `test/model-advice.test.js` keeps them present.

## 2026-10-08 — Changes grouped by kind; sold out never affects held tickets

In the cancellation re-run, Opal read the 19 changed listings as "nineteen places … now sold out", and Claude told ticket holders to "check" sold-out tours. Fixes:
- `/v1/changes` adds `summary` (counts for `canceled_now`, `newly_sold_out`, `back_on_sale`, `times_changed`, `other_updates`, `added`, `removed`), `groups` (the sites in each), and a `note` that sold out doesn't affect tickets already held.
- `format=text` lists each kind under its own heading and count, with no overall "N changed" total, and ends with the note.
- The connector reminder on every tool reply adds "Sold out never affects a ticket they hold."
- `api.md` says never to report the total of changed listings as sell-outs.

The raw `changes` diff stays for compatibility.

## 2026-10-08 — Passport facts ship with the guide; avoid tool-description churn during the festival

The full re-run showed that "What does the Weekend Passport get me?" had no answer in our materials. Opal searched the web for over 4 minutes and got it wrong (three runs in a row), and Claude stopped to ask permission to fetch ohny.org. The facts checked on ohny.org/festival/passport (2026-10-08) are now in `about.md` and in the Opal prompt, with an instruction to answer from them without searching: you and a guest get expedited entry at about 150 drop-in sites, a concierge, no ticketed tours, tax-deductible and non-refundable. Prices stay a link, because the page doesn't state them. The mailing deadline (Oct 8) is left out because it's past.

Changing a connector tool's description made Claude ask "Always allow" users to approve that tool again. During Oct 16-18, change tool descriptions only for a real fix, and prefer changes to replies or the guide.

## 2026-10-08 — Interim ChatGPT setup in the visitor manual

Owner's decision: until Ask OHNY is approved for ChatGPT's plugin directory, the manual (landing page ChatGPT tab, README, `docs/chatgpt-mobile.md`) gives the current self-serve route. On chatgpt.com: Plugins, Add, Add custom MCP server; Server URL `https://naidionov.com/ohny/skills/mcp`; No authentication; "I understand and want to continue"; Create as a plugin. The owner will replace it with the listing link once it's approved.

This temporarily relaxes the AGENTS.md rule that ChatGPT setup must happen entirely on the phone. It was chosen over keeping only the one-chat paste trial because a persistent connector is what the owner's own tests used and it passed all 7 questions on the web. Costs and caveats, stated on the page: setup is on chatgpt.com in a browser; phone-app use and plan eligibility are untested. OpenAI's guide (checked 2026-10-08) says web, no developer mode. The one-chat trial stays as a fallback. Tests: `test/chatgpt-setup.test.js`. Two older tests in `test/mcp.test.js` were updated: they required the "being verified" label and forbade a copyable server address.
