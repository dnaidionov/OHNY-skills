# Phone test results log

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
