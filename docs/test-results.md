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
