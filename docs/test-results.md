# Test results log

Native acceptance scenarios are in [platform-tests.md](platform-tests.md), with ChatGPT phone-only setup requirements in [chatgpt-mobile.md](chatgpt-mobile.md). The phone runs below remain historical evidence for their recorded app versions and routes.

## Run 1: Claude app on Pixel 7 Plus, Claude 1.260928.20, Pro plan, custom connector (Oct 2, 2026)

| Step | Result | Notes |
|---|---|---|
| T0 | PASS | Used the connector tools; had web search; didn't need the GitHub guide. |
| T1 | PASS | `ohny_nearby` then `ohny_site` for entry rules; three real places with walking and closing times; all results `live: true`. |
| T2 | PASS | Named Sotheby's Breuer as left out (1 minute left on arrival). Said it couldn't prove nothing else exists. **Fixed:** results now say how many places are in range (`in_range_total`). |
| T3 | PASS | Hours, entry rules and a sourced fact from OHNY's own text. |
| T4 | PASS | Monumental Labs: canceled (from live data). |
| T5 | CAN'T | Search returned 22 loose "tower" matches, so it wouldn't conclude "no such site". **Fixed:** every word must match; unknown names return an explicit `no_match`. |
| T6 | PASS | Dry run: heads-up, waiver read in plain words, waited for a yes, gave the form link. Nothing submitted. |
| T7 | PARTLY | Used web search (a 2013 page) and a route from memory. **Fixed:** the tappable maps link is now the main answer. |
| F0 | PASS | Web pages, plain text and JSON all readable. **Finding:** Claude's reader only opens addresses written out in full in the conversation. |
| F1 | PASS | Only because the full address was in the prompt. |
| F2 | CAN'T | Picked the right area file, but the reader refused `manhattan-2.md` (address built from a pattern). **Fixed:** the index spells out every address in full. |
| F3 | CAN'T | Same cause: per-site record addresses weren't written out. **Fixed:** every list line ends with a full `LIVE:` link. |
| F4 | PASS | Honest two-sentence message, no guessing. |

Still to retest after the fixes: T5, T7, F1b (new), F2, F3, in a fresh chat. If Claude still behaves the old way, remove and re-add the connector.

## Run 2: same phone, app and setup, after the first round of fixes

| Step | Result | Notes |
|---|---|---|
| T0 | PASS | Tools, web pages and code all available. |
| T1 | PASS | Same three places; said "8 places in range, 4 matched history". |
| T2 | PASS | Named Sotheby's Breuer; reported 18 places in range. **New complaint:** only one skip was explained, "no reasons for the other 17". **Fixed:** `in_range_breakdown` now accounts for every place in range (closed for the day, opens another day, tour not running, and so on). |
| T3 | PASS | Same entry rules and sourced fact. |
| T4 | PASS | Canceled. |
| T5 | **PASS (was CAN'T)** | "No site called Zebra Tower is in the lineup (314 sites checked)". Partial matches correctly not presented as the answer. |
| T6 | PASS | Same dry run, heads-up first. Nothing submitted. |
| T7 | PARTLY (was PARTLY) | Now gives a tappable Google transit link with the origin filled in, and says it hasn't checked weekend service. Good; graded PARTLY because the route itself isn't verified. |
| F0 | PARTLY | Same finding: addresses must be written out in full. |
| F1 | PASS | **Stale:** as_of 19:19 UTC was identical to run 1, so the app reused its cached copy of that page. |
| F1b | not run | The run used the previous version of Test 2. |
| F2 | CAN'T | Said the index "only gives the pattern": that is the OLD index, so the app read a cached copy (the fixed index was already live). **Fixed in the test:** the prompt now uses `index.md?v=3` to force a fresh read. |
| F3 | CAN'T | Real gap: results carried slugs but not record ids or links. **Fixed:** every result now has `official_record`, the exact small OHNY file for the site. |
| F4 | PASS | Honest two-sentence message. |

Next: rerun F1b, F2 and F3 with the updated Test 2 (it uses `?v=3`), then ChatGPT, Gemini and voice.

## Shared development setup: automated checks (October 4, 2026)

Source: base commit `416913b` plus the shared-project setup change recorded with this entry. Environment: local macOS, Node 24.5.0, Python 3.14.0. Codex CLI 0.142.5 and Claude Code 2.1.287 were identified by their version commands; no fresh native agent session was run as part of these checks.

| Check | Result | Evidence and limits |
|---|---|---|
| Baseline `npm test` before changes | PASS | 84 tests, zero failures, zero skipped. |
| New tests before implementation | Expected failure | Eight tests: one passed, seven failed. Six failed because the two discovery links were absent; one proved that a failing test did not block packaging. These were the intended test-first failures, not regressions in the existing 84 checks. |
| Final `npm test` | PASS | 92 tests, zero failures, zero skipped. Both discovery paths resolve to the canonical skill and support successful offline calls plus clear missing-location errors from another directory. |
| `npm run package` | PASS | The prepackage check ran all 92 tests before creating `dist/ohny-skill.zip`. A separate isolated negative test verifies that a failing check prevents a new archive. |
| Archive contents | PASS | All 21 files match the Git-tracked canonical skill files byte for byte, with no extra files or agent-specific copies. |
| Skill structure validator | PASS | Official skill-creator `quick_validate.py` accepted `skills/ohny`. The default Python lacked PyYAML, so the validator ran in a temporary environment outside the repository; project dependencies were unchanged. |
| Workflow YAML and diff formatting | PASS | Both workflows parse as YAML; neither suppresses failing steps. `git diff --check` passed. |
| GitHub-hosted workflow run | NOT RUN | Local checks validate the commands and YAML. The new workflow has not been pushed or executed on GitHub. Branch protection has not been configured by this change. |
| Fresh native Codex, Claude Code, ChatGPT desktop tests | NOT RUN | See D1–D4 and V1–V9 in `docs/platform-tests.md`; filesystem checks and CLI version output do not establish native discovery or behavior. |
| Deployed-service, phone, and voice retest | NOT RUN | No production changes or claims of new native compatibility; earlier phone observations remain as recorded above. |

The packaging counterargument was that an unchecked archive command is useful for manual workflows. It was rejected here because the owner explicitly requires failing tests to stop a build, and the offline suite is fast. Missing discovery paths were setup gaps, not a defect in the visitor calculations. No ambiguous product bug was inferred from these failures.

## ChatGPT phone-only setup requirement: automated checks (October 4, 2026)

Source: base commit `c46ea4f` plus the mobile-requirement change recorded with this entry, on `codex/shared-project-setup`. Environment: local macOS, Node 24.5.0, Python 3.14.0. This change updates repository documentation and landing-page source; it does not publish a plugin or deploy the page.

| Check | Result | Evidence and limits |
|---|---|---|
| Positive/negative tests before implementation | Expected failure | Both new tests failed: the ChatGPT panel lacked an honest mobile status and scoped trial, and still required desktop developer setup with an unverified plan claim. |
| Final `npm test` | PASS | 94 tests, zero failures, zero skipped. The page now labels mobile setup as unverified, provides a trial message with a matching copy target, and omits the old ChatGPT developer-mode/plan instructions. Existing backend, parity, discovery, generated-file, and packaging checks also passed. |
| `git diff --check` | PASS | No whitespace errors. |
| ChatGPT mobile M1–M9, iOS/Android and voice | NOT RUN | No verified OHNY install listing or native phone test evidence. The corrected page and passing tests do not establish a supported mobile route. |
| Publication/deployment and live-page verification | NOT RUN | Changes are local to this branch. Production still has its previous instructions until a separate deployment. |

Counterargument considered: developer-mode instructions can be useful to someone testing the backend. That is valid in the contributor guide, but does not make them acceptable first-time visitor instructions under the owner's phone-only requirement. The two failures are therefore documentation/UI defects for this target, not evidence of a broken backend or a platform limitation established by a phone test. The standalone prompt remains only a trial and cannot pass installation acceptance.

## 2026-10-05 — `/guide` route for the pasted-guide link

Source: base commit `0fd7291` plus uncommitted working-tree changes on `codex/shared-project-setup`. Local macOS, Node 24.

| Check | Result | Evidence and limits |
|---|---|---|
| Tests before implementation | Expected failure | 4 failed: `/guide` served plain text (with and without the `/ohny/skills` prefix), `/guide` needs no live data and rejects POST, `src/standalone-data.js` up to date, and the landing page's trial message pointed at GitHub raw. |
| Final `npm test` | PASS | 114 tests, 0 failures. |
| Gemini (iOS/Android) reads `https://naidionov.com/ohny/skills/guide` | NOT RUN | The original failure was on the GitHub raw link; the route is not deployed and no phone test has been done. |
| Deployment and live check of `/guide` | NOT RUN | Local branch only. |

## 2026-10-06 — Gemini markdown feed (`/feed/index.md`, `/feed/changes.md`)

Source: base commit `db0c031` plus uncommitted working-tree changes on `codex/shared-project-setup`. Local macOS, Node 24.

| Check | Result | Evidence and limits |
|---|---|---|
| Tests before implementation | Expected failure | `test/feed.test.js`: 9 of 12 failed with 404 (routes, freshness labels, table rows, canceled-first, pipe escaping, changes page, saved-copy label); the 3 negative checks passed vacuously and were strengthened to require a 200 first. |
| Final `npm test` | PASS | 126 tests, 0 failures. |
| Real-data size | Measured | `index.md` from the bundled snapshot is about 52 KB before rounding coordinates to 4 decimals. |
| Gemini (iOS/Android) fetches and uses the feed | NOT RUN | No Gem instructions, install flow or phone test exist yet. |
| Deployment and live check | NOT RUN | Local branch only. |

## 2026-10-06 — Gemini Gem instructions (draft)

Source: base commit `db0c031` plus uncommitted working-tree changes on `codex/shared-project-setup`. Local macOS, Node 24.

| Check | Result | Evidence and limits |
|---|---|---|
| Tests before the file existed | Expected failure | `test/gemini.test.js`: 7 of 7 failed (instructions file missing). |
| Final `npm test` | PASS | See the run recorded with this change; instructions are 2,488 characters against the 3,900 cap. |
| Gem instruction field accepts the text; real character limit | NOT RUN | The ~4,000 limit comes from a secondary web source, not the Gemini app. |
| Gem reads both feed pages, works out "open at arrival", honors held tickets and the check-in rule | NOT RUN | Needs the deployed Worker and a phone test in the Gemini app. |
| Shared Gem opens on a visitor's phone with no setup step | NOT RUN | Unverified. |

## 2026-10-06 — Gemini feed deployed; Gem created; Gemini web reads (NOT the phone app)

Source: commits `82503fd` and the HEAD fix, deployed to `naidionov.com/ohny/skills*` (Worker version `ab21c8ff`). Gemini in Chrome on desktop, signed in to the owner's Google account (Pro), Flash. **This is desktop web evidence only; the native Gemini phone app was not driven, so every phone check below is NOT RUN.**

| Check | Result | Evidence and limits |
|---|---|---|
| Production feed | PASS | `/feed/changes.md` and `/feed/index.md` return 200, `text/markdown`, 49.9 KB index labeled "Live from ohny.org"; the origin answers 200 to curl and to Googlebot/Google-Extended/GoogleOther user agents. |
| Gem "Ask OHNY (unofficial)" created and saved (private) | PASS | Instruction field accepted the full 2.5 KB text with no length error (the real limit is still unconfirmed). |
| Gem scenario 1: "what's open near Grand Central, architecture, Sat Oct 17 2 PM" | FAIL | The Gem said it could not read the live feed pages, then listed three places with hours and ratings that look like Google Maps data, not the OHNY lineup. It did give the check-in link and the unofficial line. The instructions then lacked a rule against recommending when the feed is unreadable; fixed in the repo (test first), applied to the saved Gem the same day (reloaded the editor and confirmed the new text persisted; the changed behavior itself was not re-tested). |
| Plain Gemini reads `naidionov.com/ohny/skills/feed/changes.md` | FAIL | "I wasn't able to access the website you shared." |
| Same page after adding HEAD support (deployed) | FAIL | Same message. HEAD was not the cause. |
| Plain Gemini reads `naidionov.com/ohny/skills/guide` (text/plain) | FAIL | Not a content-type problem. |
| Plain Gemini reads the feed on `ohny-skills.dnaidionov.workers.dev` | FAIL | Not specific to the custom domain. |
| Plain Gemini reads `https://naidionov.com/` (the main Next.js site, not the Worker) | FAIL | Not specific to the Worker. |
| Control: `example.com` and `developers.cloudflare.com/workers/` | PASS | Gemini's reader works for large, well-known sites, including one behind Cloudflare. |
| Control: `github.com/dnaidionov/OHNY-skills` | FAIL | Same as the earlier raw-GitHub report. |
| Gemini phone app reads the feed / Gem works on iOS or Android | NOT RUN | Phone app not driven. |
| Shared Gem opens on a visitor's phone with no setup | NOT RUN | Not tried. |

Conclusion for now: Gemini's reader in this account reads well-known sites but not any of the project's hosts (two domains and GitHub), regardless of content type or HEAD support. The cause is not established. Candidates, none confirmed: the reader only serves pages it already has indexed or cached; a zone or account bot setting at Cloudflare; robots rules. The feed approach is therefore **not working** as designed, and the Gem cannot yet get OHNY data.

## 2026-10-06 — Gem re-test after the "don't recommend when the feed is unreadable" rule

Same setup as the earlier Gemini web run (desktop Chrome, Flash, Gem "Ask OHNY (unofficial)" with the updated instructions). Phone app not driven.

| Check | Result | Evidence and limits |
|---|---|---|
| Scenario 1 again: "what's open near Grand Central, architecture, Sat Oct 17 2 PM, on foot" | PASS for the safety rule, still no OHNY data | The Gem said it is unofficial, said it could not access `changes.md` and `index.md`, declined to look up or recommend sites, hours or ticket status, and pointed to ohny.org/festival/lineup. It did not use Google Maps data this time (the earlier run did). |
| Minor wording | Note | It volunteered the check-in link unasked ("To self-check in..."), which the instructions do not call for. Not a rule violation; consider tightening. |
| Whether the Gem can get live OHNY data | Still FAIL | Gemini's reader still cannot read the feed (see the earlier entry). One run; model output varies. |

## 2026-10-06 — Format check: JSON endpoint in Gemini web

Plain Gemini (desktop web, Flash) asked to read `https://naidionov.com/ohny/skills/v1/meta` (JSON) and report `total_sites`: **FAIL**. The conversation was titled "Failed Website Data Retrieval". Together with the earlier markdown, plain-text and HTML failures, no format of ours has been readable; the block appears to be at the host level. Not yet tried: the same content on a different host (would need publishing it somewhere public, which needs the owner's go-ahead). Phone app not driven.

## 2026-10-06 — Same feed content on a different host: gist read test

The owner pasted into a plain Gemini chat (their own run, not driven by me) a request to read the public gist `https://gist.github.com/dnaidionov/9a3ab441d37275bd105bb349ce87c697` (a copy of `/feed/changes.md`) and give its first heading. Gemini answered "OHNY Weekend 2026: what changed": **PASS**. Limits: this was the gist page, not the raw-file URL; only `changes.md` (1.7 KB), not the 50 KB `index.md`; desktop or unspecified client, not confirmed on the phone app; one run.

Conclusion: the feed's content and markdown format are readable by Gemini. The earlier failures were specific to naidionov.com and the workers.dev address (reason still unknown). The public gist is a temporary test artifact and is not kept up to date.

## 2026-10-06 — Gist mirror script and workflow

Source: working tree on `codex/shared-project-setup`. Local macOS, Node 24.

| Check | Result | Evidence and limits |
|---|---|---|
| Tests before implementation | Expected failure | `test/mirror-feed.test.js` failed to load (`scripts/mirror-feed.mjs` missing). |
| Final `npm test` | PASS | 143 tests, 0 failures (8 new: copy, skip when only as-of differs, partial update, fetch failure, error page, missing label, saved-copy label, workflow contents). |
| Script run against the real gist with the owner's local `gh` login | PASS | Two runs: "Updated: none", since only the as-of time differed. A real content change was only checked by the offline tests. |
| Scheduled workflow runs on GitHub | NOT RUN | Needs the `GIST_TOKEN` secret and a merge to `main`. |
| Gemini reads the 50 KB `index.md` on the gist, and the raw URLs | NOT RUN | `index.md` was added to the gist; my own Gemini test was blocked by the permission check, so the owner is asked to run it. |

## 2026-10-06 — Gist raw URL of the 50 KB index, asked in the Gem

The owner asked Gemini to read `https://gist.githubusercontent.com/dnaidionov/9a3ab441d37275bd105bb349ce87c697/raw/ohny-feed-index.md` and count the canceled sites (expected 2). The reply opened "I'm an unofficial guide and not affiliated with Open House New York", so it came from the **Gem**, not a plain chat. Result: **FAIL**: "I wasn't able to access the website you shared directly." The Gem followed its no-data rule (no sites listed, pointed to ohny.org/festival/lineup).

Not established: whether the gist **page** URL works for the 50 KB file (the earlier pass was the page URL, 1.7 KB, in a plain chat); whether a plain chat can read the raw URL; whether a Gem fetches differently from a plain chat. The page-URL half of the test was not reported. Only one URL per kind was tried, once each.

## 2026-10-06 — Gist page URL: owner's reads pass, but the Gem does not fetch it by itself

Source: branch `gemini/shared-project-setup` at the commit that switches the Gem to the gist page URL. Gemini on the web, desktop. Phone app not driven.

| Check | Result | Evidence and limits |
|---|---|---|
| Owner, plain chat: asked to read `https://gist.github.com/dnaidionov/9a3ab441d37275bd105bb349ce87c697` and count canceled sites | PASS | Answered 2 and named Monumental Labs and Murry Bergtraum (the 50 KB index file). The URL was **typed in the message**. |
| Owner, same question in the Gem (URL typed in the message) | PASS | Same correct answer. |
| Gem instructions switched to the gist URL; saved Gem reloaded | PASS | New text persisted (2,868 characters). |
| Me, in the Gem, **without** a URL in the message: "what's open near Grand Central, architecture, Sat Oct 17 2 PM, on foot" | FAIL (safe) | The Gem said it could not access the feed data page, refused to recommend or list sites, and sent the visitor to ohny.org/festival/lineup. It did not mention check-in (the new rule held) and used no Google Maps data. One run. |

Reading: Gemini reads the gist when the **user types the URL in the message**, but did not open the same URL when it appeared only in the Gem's instructions. This is a hypothesis from two comparisons, not an established rule. It also leaves open why naidionov.com failed even when typed in the message. If the hypothesis holds, a Gem cannot fetch a live page on its own, and the gist mirror alone does not give the Gem live data.

## 2026-10-07 — Options 3 and 1: does the Gem fetch the gist itself, and can Drive knowledge carry the data?

Branch `gemini/shared-project-setup`. Gemini on the web, desktop, Flash, signed in as the owner. Phone app not driven. Each Gem question was a fresh chat; the first message typed after a page load was dropped by the page several times and was retyped (not a Gem behavior).

**Option 3: re-runs with no URL in the message (Gem instructions point at the gist page)**

| Question | Result | Evidence and limits |
|---|---|---|
| "Which OHNY sites are canceled this year?" | Correct answer, but probably not from the gist | Named Monumental Labs and Murry Bergtraum with reasons ("electrical issue", "construction delays"). The reasons are on ohny.org/articles/updates-2026 (checked), not in our feed, and the reply gave no as-of time as the instructions require. It most likely used OHNY's own page. |
| "How many sites are in your data, and what is the as-of time on it?" | FAIL (safe) | "I am unable to directly access or read the provided GitHub gist URL." It declined to give counts and pointed to ohny.org/festival/lineup. |
| Grand Central question (earlier run, same setup) | FAIL (safe) | Said it could not access the feed data page; listed no sites. |

Three runs: the Gem never read the gist from its own instructions, while the same gist page read fine when the owner typed the URL into the message. Consistent with the hypothesis that the app fetches user-typed URLs but not URLs that only appear in a Gem's instructions. Still a small sample.

**Option 1: a Google Doc attached as Gem knowledge**

| Check | Result | Evidence and limits |
|---|---|---|
| Created a private Google Doc (8 KB: marker "PURPLE-HERON-7421", changes, canceled list, 6 sites) with the Drive connector; attached it via Knowledge > Add from Drive (double-click a file in the picker confirms it); saved | PASS | The Gem listed it as knowledge and it persisted after a reload. |
| Asked the Gem for the marker phrase and as-of time | PASS | "PURPLE-HERON-7421 ... 2026-10-07T03:10:50.975Z (Live from ohny.org)": it read the Drive file, exactly. |
| Edited the Doc's marker to "GREEN-OTTER-9999", waited about a minute, asked in a new chat | Old value returned | The Gem still said PURPLE-HERON-7421. Suggests knowledge is a snapshot taken at attach time; only a minute or two elapsed, so not conclusive. |
| Updating a Drive file's contents programmatically | BLOCKED with these tools | The Drive connector's `update_file` changes only the title and parent. A refresh job would need Google Docs/Drive API credentials, untested. |
| Full 50 KB index as a Doc | NOT RUN | Only the 8 KB version was tested. |

The test Doc was detached from the Gem and the Gem re-saved with no knowledge file. The Doc "OHNY feed knowledge test (can delete)" remains in the owner's Drive, and the public gist is unchanged.

## 2026-10-07 — Opal "Get Webpage" reaches the Worker's JSON API

Owner's Opal draft "OHNY Explorer" (`opal.google/edit/142E8lMaKEPqEynfE0zwIQgQS9v2fE5lL`), desktop Chrome, signed in as the owner. The original "Retrieve events" prompt was saved first to `docs/gemini/opal-draft-retrieve-events.md`, then replaced with a single instruction to open `https://naidionov.com/ohny/skills/v1/meta` with the **Get Webpage** tool (the only tool on the step) and report `total_sites`, `as_of` and `live` verbatim.

| Check | Result | Evidence and limits |
|---|---|---|
| Agent step fetches `/v1/meta` with Get Webpage | PASS | Console trace: Agent Session 11.5 s, "Retrieving Data From The Specified URL" 6.0 s. Output: `total_sites: 314`, `as_of: 2026-10-07T04:15:04.182Z`, `live: true`. A direct `curl` a minute later returned 314, `2026-10-07T04:16:15.805Z`, live: the values are a real fetch, not invented. |
| MCP endpoint (`/mcp`) from Opal | Not applicable | Opal step tools (Get Weather, Search Web, Get Webpage, Search Maps, Code Execution, Go to, Use Memory) cannot send MCP's JSON-RPC POSTs; the GET API is the route. |
| Endpoints with query parameters (`/v1/nearby?...`, `/v1/plan/check?...`) | NOT RUN | Only `/v1/meta` was tried. |
| Shared app on a phone's mobile browser | NOT RUN | Google's FAQ says shared Opal apps can be used on a phone; not tried. Not available inside the Gemini mobile app (Google help page). |
| Creating a new Opal app from the home page | BLOCKED | "Create New" did nothing when clicked (2026-10-07); Opal turns off on 2026-11-17. |

Note: unlike Gemini's chat reader, which refused naidionov.com in every test on 2026-10-06, Opal's Get Webpage tool read it.

## 2026-10-07 — Opal app built on the Worker API; first end-to-end scenario

Owner's Opal draft "OHNY Explorer" (`opal.google/edit/142E8lMaKEPqEynfE0zwIQgQS9v2fE5lL`), editor Preview, desktop Chrome. Steps: Event Query (user input) → "Retrieve events" (Agent; prompt = `docs/gemini/opal-prompt.md`, tools Get Webpage and Search Maps, then the Event Query input) → "Render Event Webpage" (switched to Manual layout showing the agent's answer as-is). Original prompts saved in `docs/gemini/opal-draft-retrieve-events.md`.

| Check | Result | Evidence and limits |
|---|---|---|
| Prompt build and tests | PASS | `npm run build:opal`; `npm test` 155/155, including: generated file up to date, URLs from SKILL.md settings, every named endpoint is a real route, all product rules present, no MCP tool names, no "@" (Opal's editor turns "@" into a tool shortcut, which scrambled the first paste; the prompt writes `%40`, which the Worker decodes to "@", verified by test). |
| Scenario "What's open near Grand Central? I like architecture. Saturday Oct 17 at 2 PM, on foot." | PASS | Answer opened with the unofficial line and "as of Oct 7"; top three = Cast Hall at the Institute of Classical Architecture & Art (7 min, open until 4:30 PM, ages 10+ recommended, bag limits), General Society of Mechanics and Tradesmen (7 min, until 4:30 PM, ages 12+, stairs), National Academy of Design (36 min, until 6:00 PM), each with a Google Maps link; named Heliocentric Studios, Weeksville and the Sign Museum as left out because they'd close before arrival. A direct `/v1/nearby?lat=40.7527&lng=-73.9772&interests=architecture&now=2026-10-17T14:00` call returned the same three sites, walking times, closing times, heads-up items and skipped places (live: true). |
| Minor | Note | "Over 200 other nearby sites were excluded" loosely paraphrases `in_range_breakdown` (city-wide counts). The preview pane cut long map links off at the right edge. |
| Held-ticket, canceled-site, check-in, unknown-site and API-down scenarios | NOT RUN | Next. |
| Shared link on a phone browser | NOT RUN | Not published or shared yet (publishing makes it reachable by others; owner's call). |

## 2026-10-07 — Opal app: remaining scenarios, two prompt fixes, re-test

Same app and setup as the previous entry (editor Preview, desktop Chrome; not a phone). Each expected answer was taken from the live API first.

| Scenario | Result | Evidence |
|---|---|---|
| Held ticket: "tickets for 20 Exchange Place Sat Oct 17 10:00 AM, 2 of us; 9:00 AM at Fulton St and Broadway; architecture" | PASS, one defect | API: `ticket_ok` true, `leave_by` 9:37 AM, `ticket_address_needed`, no results, skipped = ticket conflicts. Opal: no sites fit before the tour; leave by 9:36 AM for the 9-minute walk; age 16+ heads-up; skipped list with reasons; asked for the address on the ticket; did not mention "Sold Out" (correct for a holder). **Defect:** said "As of 5:24 AM today": `as_of` is UTC (1:24 AM New York). |
| Canceled: "Is Monumental Labs open on Sunday? Around noon." | PASS | Said it is canceled first (reason "construction delays", which is in the site record), then offered OneButton HQ (9 min, until 6:00 PM), Pissarro Allaux Studio (9 min, until 4:00 PM), Kingsland Wildflowers (17 min, until 4:00 PM, stairs): identical to `/v1/nearby?near=monumental-labs-26&now=2026-10-18T12:00`, including the skipped Brooklyn SolarWorks and Lotus Garden. |
| Check-in: "Check me in at Cast Hall, please." | FAIL (then fixed) | Check-in handling was right (can't check in; gave https://ohny.fillout.com/26weekend; asked nothing). But it described "Cast Hall at the Art Students League, 215 West 57th, open until 6:00 PM": not an OHNY site; the lineup's only Cast Hall is at 20 West 44th, open until 4:30 PM. Information came from outside the API. |
| Unknown site: "When is the Empire State Building open for OHNY this year?" | PASS | "No site by the name Empire State Building is listed in the Open House New York lineup", pointed to ohny.org/festival/lineup. (The API returns two sites whose descriptions mention the building; the agent did not pass them off as it.) |
| Fixes (tests first, 2 new tests failed then passed; `npm test` 157/157) | Done | Prompt now says `as_of` is UTC and must be converted or replaced by "live from ohny.org", and that every site name, address, hour and status must come from the service, with named places found via `/v1/search` first and Search Maps used only for the visitor's own location. Opal step retyped from `docs/gemini/opal-prompt.md`. |
| Re-test: "Check me in at Cast Hall, please. Is it open Saturday afternoon?" | PASS | Can't check in + form link; "Cast Hall at the Institute of Classical Architecture & Art is open this Saturday from 10:00 AM to 4:30 PM, live from ohny.org", drop-in, 3:30 PM talk, ages 10+ and bag limits, directions to 20 West 44th Street. All match `/v1/site/cast-hall-26`. The first re-test attempt ended with Opal's generic "Something went wrong" before any output; the retry ran normally. |
| Service unreachable (backup URL, then "can't see live information", list nothing) | NOT RUN | Would need production down or a deliberately broken URL in the Opal step. The rule is in the prompt and covered by a text test only. |
| Held-ticket re-test after the UTC fix | NOT RUN | The Cast Hall re-test showed the new wording ("live from ohny.org"). |
| Phone browser via a shared link | NOT RUN | App not published or shared. |

## 2026-10-07 — Opal app published

At the owner's request the Opal app "OHNY Explorer" was shared as **Anyone with the link** (not Public, so not listed in Google search), with "Allow access to editor view and remix" turned **off** so visitors can run it but not see or copy the prompt and workflow, then published (Opal: "Last Published: Oct 7, 2026, 1:47 AM"). Link: https://opal.google/app/1fMOIm-S5yvvrO6MHE57jlyZYIZRix5KU. Opening the link on a phone (mobile browser, sign-in requirement, readability of long links) is **NOT RUN**.
