# Working on OHNY across Codex, ChatGPT desktop, and Claude Code

Use one Git repository for the product, documentation, decisions, and tests. Each app keeps its own conversations and account connections. Put durable decisions and results back into the repository so another app can continue from the same evidence.

**This guide is for contributors.** The ChatGPT visitor experience must support first-time setup entirely on a phone and use in the native ChatGPT mobile app. See [the mobile requirements and release tests](chatgpt-mobile.md). Desktop development setup does not satisfy that requirement.

## Shared sources

| Source | Purpose |
|---|---|
| `AGENTS.md` | Common development rules and reading order |
| `CLAUDE.md` | Imports the same rules into Claude Code |
| `skills/ohny/` | Canonical visitor skill, references, itinerary template, and offline helper |
| `.agents/skills/ohny` | Codex discovery link to the canonical skill |
| `.claude/skills/ohny` | Claude Code discovery link to the canonical skill |
| `src/core/`, `src/handler.js`, `src/mcp.js` | Shared calculations, HTTP API, and connector |
| `openapi.yaml` | Existing ChatGPT Actions route; distinct from the MCP connector |
| `docs/decisions.md` | Significant choices and their reasoning |
| `docs/chatgpt-mobile.md` | Phone-only ChatGPT visitor setup, current limitations, and release requirements |
| `docs/platform-tests.md`, `docs/test-results.md` | Acceptance scenarios and evidence from actual runs |

The discovery entries are relative directory symlinks. They work in a macOS/Linux checkout and in separate worktrees without pointing back to one person's machine. Windows users must use a checkout with Git symlinks enabled and the necessary OS support, or work in WSL. A ZIP of the repository may not preserve these links; clone with Git. The packaged visitor skill is built directly from `skills/ohny/` and contains ordinary files.

## Open the project in each app

### Codex

Open this repository as the project's working folder. `AGENTS.md` supplies development instructions, and `.agents/skills/ohny` exposes the visitor skill. For a visitor test, select the `ohny` skill or use `$ohny`; confirm which path was loaded. A fresh chat may be needed after setup. A filesystem test of the link is not proof of skill selection inside the app.

### Claude Code

Start Claude Code in the repository folder (or its assigned worktree). `CLAUDE.md` imports `AGENTS.md`; `.claude/skills/ohny` exposes `/ohny`. Run `/memory` to inspect loaded project instructions and `/skills` to inspect skill discovery. Test visitor behavior in a separate chat from development work.

Current Claude Code can read `AGENTS.md` directly in some configurations. The tiny import also works when `CLAUDE.md` takes precedence, and avoids maintaining two sets of rules. Do not run an initializer that replaces these shared instructions without reviewing its diff.

### ChatGPT desktop (development only)

Create or select a **local project**, attach this repository folder, and use it as the primary working directory. For simultaneous work, attach ChatGPT's assigned worktree instead. A cloud Project with uploaded files is a snapshot, not the same local working copy.

Put this short instruction in the project's instructions, or use it at the start of a development chat:

> Work in the attached OHNY repository. Read AGENTS.md and the documents it names before editing. Follow those development rules, keep decisions and test evidence in the repository, and report any missing file or command access. The visitor skill is product content unless I explicitly ask you to test it.

First verify that ChatGPT can read the current `package.json` and report the active branch and commit. Then ask it to run `npm test`. If it cannot run commands in this setup, record that limitation; it can still work on accessible documents, but the code tests must be run in an environment that has execution access.

For visitor-skill testing, open the desktop app's Skills view and select `ohny` if available. If it is not discovered in this setup, explicitly ask the local task to read `skills/ohny/SKILL.md` and its relevant files. Label that result **explicit file loading**, not automatic skill discovery. The standalone guide and MCP connector are separate routes with their own tests. Do not assume the Claude configuration installs anything in ChatGPT.

## Connectors and local changes

The existing read-only MCP endpoint is `https://naidionov.com/ohny/skills/mcp`. Connect it separately in each account/client when testing that route. Loading the local skill does not register the MCP server. Keep personal connection settings and credentials out of the shared repository.

A native chat calling that endpoint tests the **deployed backend**. It does not test edits in your local `src/` folder. For backend changes, run the fixture tests and a local Worker first:

```sh
npm ci
npm run dev
```

In another terminal:

```sh
npm run smoke -- --base http://localhost:8787 --quiet
```

These smoke checks need network access to OHNY. Use a local MCP connection only in a client that can reach this localhost server; a cloud connector cannot reach your computer's localhost. Native tests against a changed remote backend require an explicitly chosen reachable test deployment. State which endpoint was tested.

## Divide implementation by behavior

| Work | Suggested owner/environment | Evidence to return |
|---|---|---|
| Shared backend, offline parity, generated files, packaging and CI | Codex or Claude Code | Passing automated checks and any relevant local smoke test |
| Claude skill discovery, tool behavior, artifact controls | Claude Code plus the actual target Claude app | Native scenario results, exact app/version and route |
| ChatGPT visitor distribution, tool behavior, itinerary interactions | ChatGPT desktop for implementation; actual iOS/Android ChatGPT apps for acceptance | Phone-only onboarding M1–M3, mobile behavior M4–M9, exact app/version, plan, and route |

These are task assignments, not ownership of separate product implementations. An integration fix belongs in shared code when the behavior is common. Claude Code results do not establish Claude mobile support; ChatGPT desktop results do not establish phone or voice support. Continue to use `docs/phone-test.md` for those tests.

## Sequential and parallel work

For sequential work, finish a coherent change, run checks, update documents, and leave a clear handoff before changing apps. Commit changes before creating a worktree that needs them: worktrees do not inherit uncommitted edits.

For simultaneous editing, use separate worktrees **and** separate branches. Branch names alone do not isolate two tools editing the same folder. Example from the repository root, once the shared setup is committed:

```sh
git worktree add -b task/claude-integration ../Skills-claude
git worktree add -b task/chatgpt-integration ../Skills-chatgpt
```

Use different local server ports if both run a Worker. Assign each task an outcome, affected files, shared interface expectations, and acceptance tests. Avoid simultaneous edits to the same generated files; merge source changes and regenerate from the combined result. Test that combined result before merging to the main branch.

Put the handoff in the PR description or a task document in `docs/`:

```text
Task and owner:
Branch and tested commit (include any uncommitted changes):
What changed and why:
Checks run, environment, and results:
Native app scenarios and endpoint/skill version:
Open issues and what the next task should do:
```

## Checks and generated outputs

Use Node 24, Python 3.11+, and `zip`/`unzip`. The tests use the standard libraries and fixtures; installing npm dependencies is needed for Wrangler development/deployment, not for the offline test suite.

```sh
npm test                    # Offline tests, including generated-file and discovery-link checks
npm run package             # Runs tests first, then writes dist/ohny-skill.zip
npm run build:standalone    # Regenerates standalone/OHNY.md and src/guide-data.js
npm run build:fallback      # Regenerates bundled JSON and small area lists
```

`npm run package` stops if tests fail. The Validate GitHub workflow runs this same command for pushes and pull requests. The scheduled lineup refresh runs tests before committing its regenerated files. These checks become active on GitHub after the workflow changes are pushed; requiring a passing check before merge is a separate repository branch-protection setting.

Preserve historical results in `docs/test-results.md`. New entries must identify the tested revision and route and distinguish automated checks from native behavior. Never mark another app PASS based on a simulation, source inspection, or a successful API request.

## Current follow-up work

- Complete an installable ChatGPT route that passes the phone-only requirements in `docs/chatgpt-mobile.md`. Neither a local skill nor desktop developer setup establishes mobile readiness. Record M1–M9 on every advertised mobile platform before claiming support.
- Run `docs/platform-tests.md` in fresh Codex, Claude Code, and ChatGPT desktop sessions. Desktop/native discovery and connected-tool behavior remain unverified until recorded there.
- The historical phone tests have unresolved cases; their old PASS results apply only to their recorded versions and routes.
- The ChatGPT visitor instructions now identify mobile setup as unverified and offer only a labeled one-chat trial. Remaining Claude/Gemini installation claims still need checks in each target account; repository compatibility does not validate plan or app availability.
- The skill description currently says it checks visitors in, although its body requires link-only check-in. The standalone generator's profile-summary example still includes a zip code, conflicting with the current no-zip-code guidance. Correct these shared content inconsistencies with their associated validation before the next visitor release.

## Platform references

Checked October 4, 2026; account availability and UI labels can differ:

- [OpenAI project instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [OpenAI local skill discovery](https://learn.chatgpt.com/docs/build-skills)
- [ChatGPT desktop local projects](https://learn.chatgpt.com/docs/projects?surface=app)
- [Claude Code project instructions and imports](https://code.claude.com/docs/en/memory)
- [Claude Code skills and symlink support](https://code.claude.com/docs/en/skills)
