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

Not yet run: ChatGPT, Gemini, voice.
