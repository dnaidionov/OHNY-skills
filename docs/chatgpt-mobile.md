# ChatGPT mobile: visitor setup and release requirements

**Required:** a visitor completes setup entirely on their phone and uses OHNY in the native ChatGPT mobile app. No computer, local project folder, Git checkout, terminal, or desktop skill installation is part of the visitor journey. ChatGPT desktop remains a development tool.

**Current status: a local plugin package is prepared; not ready for a supported mobile launch.** The repository has a shared skill and a deployed remote service, but no verified OHNY installation route or recorded end-to-end acceptance run for ChatGPT mobile. The local skill ZIP and passing backend tests do not establish mobile installation.

The publisher package, listing metadata, policy drafts and recording/publishing guides are now prepared. Follow [the publisher guide](chatgpt/publisher-guide.md) and [phone-only test walkthrough](chatgpt/phone-acceptance.md). A ZIP does not complete identity/domain verification, policy publication, demo recording, portal scans, review or native acceptance.

## Interim setup (until the plugin directory listing is approved)

Owner's decision, 2026-10-08: until Ask OHNY is approved for ChatGPT's plugin directory, the visitor manual gives the current self-serve route. This temporarily relaxes the phone-only rule above. The phone-only target and the acceptance tests below still apply to the final listing, and the owner will update the instructions once it's approved.

1. On chatgpt.com in a browser, open **Plugins** (https://chatgpt.com/plugins), choose **Add**, then **Add custom MCP server**.
2. Name: Ask OHNY. Connection: Server URL `https://naidionov.com/ohny/skills/mcp`. Authentication: **No authentication**.
3. Read the risk warning, tick **I understand and want to continue**, and choose **Create as a plugin**.

OpenAI's guide ("Add custom MCP server", checked 2026-10-08) says to "Use ChatGPT on the web" and doesn't mention developer mode or plans. The owner's own account shows "Ask OHNY — development test" installed this way and passed the 7-question web run (`docs/test-results.md`). **Tested (2026-10-08, owner, Android):** using the plugin, added beforehand on the web, in the ChatGPT phone app by text and by voice; both used Ask OHNY (`docs/test-results.md`). **Not tested:** adding it from a phone browser or the app alone, iPhone, and which plans allow it. Record these as NOT RUN until tested.

## Try a single conversation on your phone

This is a test of one conversation, not the finished reusable setup. It depends on the ChatGPT app being able to open web sources; that capability and live-data access must be checked in the actual account.

1. On your phone, open the ChatGPT app and start a new chat with web browsing available.
2. Paste this message:

   > Use https://naidionov.com/ohny/skills/guide as your guide to Open House New York Weekend for this chat. Then ask me what I'd like to do.

3. Ask about a place or nearby sites. Supply a cross street or landmark if the app cannot access your location. Outside the festival dates, provide the day and time to use for the test.
4. If it cannot open the guide or check live data, treat the trial as unavailable or limited. Do not accept guessed hours, ticket status, or a claim that a saved lineup is current.

The guide must be supplied again in a new conversation. This trial does not prove that a plugin was installed, that the setup persists, or that tools work in voice mode.

## Candidate for the finished setup

Prefer an account-available OHNY plugin using the existing remote MCP service, with the shared instructions bundled or served by `ohny_guide`. This is a distribution candidate, not a claim that the plugin has been registered, approved, published, or made available to anyone's account.

The public installation journey should be: open OHNY's verified listing or share link on the phone, complete the supported install/connection steps there, open the native ChatGPT app, and start using OHNY. A phone browser may be part of the journey if tested; a computer may not. Visitors should not need developer mode, server URLs, local files, or Python. The service must run remotely without the project owner's computer being online.

OpenAI documents mobile use of plugins available to an account. Its current general installation instructions describe web/desktop installation. That distinction leaves phone-only onboarding unproven until tested with the actual listing, account, plan, and mobile app version. A local or repository marketplace does not by itself make a plugin available on a phone.

### Alternatives considered

- **Local skill folder or ZIP:** useful for development and other supported skill hosts; it does not provide this phone-only ChatGPT setup.
- **Per-user developer-mode connector setup:** useful for developer testing, but technical setup and a successful web tool call are not evidence of a supported mobile visitor journey.
- **Paste the standalone guide:** easiest experiment on a phone, but must be repeated and depends on browsing. Keep it as a labeled trial/fallback, not the finished persistent setup.
- **Existing custom GPT / Action schema:** an artifact to evaluate if needed, not proof that a published GPT exists or supports the required mobile interactions. Do not promise this route without native acceptance evidence.

The plugin candidate fits the existing read-only backend and avoids duplicating the product per platform. Its cost is registration/distribution work and native onboarding validation. Do not finalize a public install promise until those steps are complete.

## Required native acceptance

Record evidence in `docs/test-results.md` using `docs/platform-tests.md` and `docs/phone-test.md`. Test each advertised platform (iOS and Android separately), actual app version, plan, and route. Do not infer free/paid availability from a different product or account.

| ID | Test on a real phone | Required result |
|---|---|---|
| M1 | Start with an account that has not installed OHNY. Follow only the public visitor instructions using the phone. | Complete onboarding without a computer, repository files, or developer setup. Record any phone-browser step and the actual listing/share URL. |
| M2 | Open the native ChatGPT app and start a fresh conversation after setup. | OHNY is available through the installed route without pasting its full guide again. |
| M3 | Close and reopen the app, then start another new conversation. | The account still has access; the visitor does not repeat installation. |
| M4 | Run the nearby, unknown-site, canceled-site, held-ticket, and check-in scenarios. | Real tools/data support the answers; freshness and uncertainty remain honest; check-in is link-only. |
| M5 | Deny location or use an account without location access. | It asks for a cross street or landmark and still helps; no location is invented. |
| M6 | Open map and check-in links, follow an itinerary, and request a change. | Links work on the phone. Chat/voice guidance remains usable without a desktop HTML artifact or unsupported send-to-chat controls. |
| M7 | Run the voice scenarios separately from text. | Record actual tool availability and interaction limits. Do not advertise voice parity if it fails. |
| M8 | Remove access or simulate an unavailable service. | Clear failure/fallback, no fabricated live results, and understandable recovery instructions. |
| M9 | Repeat onboarding on each plan advertised on the installation page. | Availability and any restrictions match the public instructions. A missing account feature is a recorded blocker. |

Before release: obtain an installable account/public route; verify the phone-only onboarding steps; run the native tests; then replace the unverified status with the tested setup and genuine install link. Publishing and platform review have not happened as part of documenting this requirement.

## Official references checked October 4, 2026

- [Plugins in ChatGPT](https://learn.chatgpt.com/docs/plugins): mobile use, desktop-only exclusions, and installation guidance.
- [Plugin packaging](https://developers.openai.com/plugins/build/plugins): public distribution versus local/repository authoring sources.
- [Developer connection quickstart](https://developers.openai.com/plugins/quickstart): a web Work test, not a phone-only acceptance result.
- [Plugin submission](https://developers.openai.com/plugins/deploy/submission): registration, verification, review, and publication prerequisites.
