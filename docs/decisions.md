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
