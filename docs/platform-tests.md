# Native platform acceptance

Run these in the actual target product and append results to `docs/test-results.md`. Development setup and visitor behavior are separate tests. Use fresh chats; account memory and a previously installed skill can otherwise conceal missing project setup.

## Record first

Date and tester; app/product and version; model and plan if known; operating system; branch and commit plus uncommitted changes; working directory; skill source/version; connection route (local skill, explicit file loading, MCP, Action, or standalone); endpoint; text or voice. Do not include account credentials or visitor personal information.

For a remote connector, record its reported server version and endpoint. If the deployed commit is unknown, say so; the local commit is not proof of what production is running.

Use PASS, FAIL, PARTLY, NOT RUN, or BLOCKED. Include the actual tool, file, or observed UI behavior supporting the result. An unavailable capability is BLOCKED or a documented fallback, not a fabricated PASS.

## Development checks

These checks apply to contributors in Codex, Claude Code, and ChatGPT desktop. They do not pass the ChatGPT mobile visitor release requirements.

| ID | Check | Pass condition |
|---|---|---|
| D1 | Ask the tool to report its working directory, branch, commit, and project instructions. | It uses the intended checkout and current `AGENTS.md`, including its test-first and documentation rules. |
| D2 | Ask it to read `docs/decisions.md` and identify the latest choice and reason. | It reads the file and accurately reports a recorded decision, without depending on another app's chat. |
| D3 | Run `npm test` in that environment. | All tests pass, with counts reported; no required tests silently skipped. |
| D4 | Inspect skill discovery in a fresh chat. | Codex exposes `$ohny`; Claude Code exposes `/ohny`; ChatGPT exposes `ohny` in its skill selector if supported. Record the loaded path. Explicitly reading a file is a separate route, not a discovery pass. |

## ChatGPT mobile setup and release checks

Run **M1–M9 in [chatgpt-mobile.md](chatgpt-mobile.md)** on each advertised native mobile app and plan. Setup must begin and finish on the phone, without developer mode or a computer. Complete M1–M3 before behavior testing: a guide pasted into the test conversation can conceal a missing installation. Record a standalone-guide trial separately. Voice is a separate result from text.

## Visitor checks

Use the supplied festival time for repeatable comparisons; check live sources when evaluating answers. Do not treat the old phone-test answer key as a permanent lineup.

| ID | Request or condition | Pass condition |
|---|---|---|
| V1 | “OHNY, I'm at Washington Square Park (40.7308, -73.9973). Pretend it's October 17, 2026 at 2:30 PM New York time. I like history. What's open within 15 minutes' walk?” | At most three grounded results, arrival-aware hours, entry notes, freshness, and an explanation of exclusions. Record the real tool or fetch used. |
| V2 | “Does Zebra Tower have OHNY tours on Sunday?” | Uses current search, reports no exact match when appropriate, and does not present partial matches as that site. |
| V3 | In a fresh chat: “OHNY, check me in.” | Immediately gives OHNY's tappable form link, says check-in cannot be performed here, asks no check-in questions, and submits nothing. |
| V4 | Run K1–K4 from `docs/phone-test.md`. | Honors held tickets, checks invalid session times and impossible travel, and uses the ticket's meeting address. Recheck current session data. |
| V5 | In a fresh chat with no location shared: “OHNY, what's near me?” | Uses available location only with appropriate access, or asks for a location. It never invents one. Desktop success does not prove mobile location behavior. |
| V6 | Disable OHNY tools and network access for the test. Ask for current hours. | Labels any bundled answer as saved/unverified, or says it cannot see current information. Never claims live freshness. |
| V7 | Ask to save fictional preferences, then ask to forget them. | Uses supported account memory only with consent, or explains conversation-only scope. No profile files in the repo; no unsupported claim of permanent deletion. |
| V8 | Make a short itinerary and activate Directions, Done, Ask about this, and Change. | Observe actual behavior. Chat-send controls must either work in that host or clearly provide a copy-to-chat fallback; a static HTML preview alone is insufficient. |
| V9 | In a fresh chat with the skill/connector available, ask a clearly unrelated question. | No OHNY tool call, festival persona, or unsolicited festival information. |

Phone and voice coverage still uses `docs/phone-test.md`, including its location-denied case. Testing Claude Code alone does not validate the Claude phone app.

## Results as of this setup

ChatGPT mobile M1–M9 are **NOT RUN**. There is no verified phone-only OHNY installation route in this repository yet. Mobile release readiness remains blocked until that route and native acceptance evidence exist.

The repository's shared checks and discovery-path tests are recorded in `docs/test-results.md`. Fresh native D1–D4 and V1–V9 runs for Codex, Claude Code, and ChatGPT desktop have **NOT RUN** as part of this setup. Existing Claude phone observations remain historical evidence for their recorded configurations only.
