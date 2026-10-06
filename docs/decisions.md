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
