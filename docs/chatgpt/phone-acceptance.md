# Test Ask OHNY entirely on your phone

Use the native ChatGPT app. Test iPhone and Android separately before advertising support for each. This is an unrun checklist, not proof of compatibility. Allow about 20–30 minutes per app/plan, with additional time for voice.

## Record before starting

| Detail | Fill in |
|---|---|
| Date, tester | |
| Phone and operating-system version | |
| ChatGPT app version, plan, model | |
| Plugin version and actual listing/share link | |
| Backend endpoint and deployed revision, if known | |
| New installation or existing account access? | |
| Text or voice | |

The tester may use a phone browser, but must not use a computer, terminal, repository files, developer mode or a pasted guide. Use an account that has not installed Ask OHNY. Do not remove someone else's unrelated settings to manufacture a fresh account.

## Setup: M1–M3

1. Open the **actual** Ask OHNY listing/share link on your phone. Record every browser/app transition and every required step. If there is no install button or it demands a computer/developer setup, record **BLOCKED** and the exact message. Do not substitute the standalone-guide prompt.
2. Complete the supported installation/connection. This guide's service has no separate visitor login. Open the native ChatGPT app, start a new conversation, select the installed plugin if needed, and say: **“OHNY, what can you help me with?”** It should recognize the unofficial guide through the installed route. Record the plugin/tool shown in the app.
3. Close and reopen ChatGPT. Start another new conversation and ask: **“OHNY, send me the check-in link.”** OHNY access should still be available without reinstalling or pasting instructions. The answer must say it cannot check you in and link to `https://ohny.fillout.com/26weekend`, without asking for personal details or submitting anything.

Do not count remembering a previous chat as successful installation. Record the actual plugin access in the new chat. If setup is blocked, behavior tests may still be useful in an existing installation, but label that different route and keep M1–M3 blocked.

## Live information and limits: M4

In a fresh OHNY chat, type:

> Pretend it is October 17, 2026 at 2:30 PM in New York. I'm at Washington Square Park (40.7308, -73.9973). I like history. What can I visit within a 15-minute walk?

Pass: at most three real results, walking estimates, hours that allow arrival before closing, practical entry notes, and honest live/saved-data status. Inspect the actual OHNY tool call when the app exposes it. Plausible text alone is not evidence.

Then ask:

> Does Zebra Tower have OHNY tours on Sunday?

Pass: it searches and does not invent that site or treat a partial match as the answer.

> What has changed in the lineup since your saved copy? Tell me about cancellations first.

Pass: it checks changes and reports only returned records. A genuine zero-change result is a pass. If a canceled site is returned, ask whether you should go there; it must clearly flag the cancellation.

In a new OHNY chat, use the fictional ticket scenario:

> Pretend it is October 17, 2026 at 1 PM. I'm at Washington Square Park. I already hold tickets to the Fifth Avenue Presbyterian Church Organ Tour at 3 PM, meeting at 7 West 55th Street. Could I visit the Renee & Chaim Gross Foundation at 2:30 first and still arrive 15 minutes early for my tour?

Pass: it checks the actual session and travel timing, honors the held ticket, and rejects a blocking plan. If the live lineup differs, it explains the discrepancy and asks you to check the ticket. It must not invent a matching session. Never purchase a ticket for this test.

## Location, links and itinerary: M5–M6

In a fresh chat with no shared location, ask **“OHNY, what's open near me?”** If asked for location permission, deny it. If the app has no location feature, record that. It should ask for a cross street or landmark. Reply **“Washington Square Park; pretend it is October 17 at 2:30 PM.”** It must not guess your location or repeatedly demand permission.

Ask for a short itinerary, then ask to replace the second stop. Pass: it checks the revised timing and gives usable guidance in the chat. Tap a directions link and the check-in link; verify the correct destination/form opens on your phone. Do not submit the form. The experience must remain usable if the app cannot show the optional HTML itinerary or send a message from an artifact button.

## Voice: M7

Run separately after text testing. Start voice in an OHNY conversation and ask the nearby question aloud, then say **“Tell me about the first place”** and **“Send me directions.”**

Pass: short spoken replies, usable links in the conversation, and actual fresh tool data. Record whether tools remain available in voice. If voice cannot use the tools, mark that limitation; never copy the text PASS to voice or claim voice support based on speech transcription alone.

## Unavailable access and unrelated requests: M8

Use a separate test conversation. If the app lets you disable/remove the plugin, do so and ask for current OHNY hours. It must not fabricate tool results or pretend installation persists. Reinstall through the same phone route to check recovery.

Turning off phone connectivity tests app connectivity, not necessarily a server outage; record it as such. A true backend-outage scenario needs a controlled test endpoint and must not take production down. Mark that specific outage case NOT RUN when unavailable. The offline automated suite covers service failures separately.

With OHNY installed, start a new unrelated chat and ask **“Book a restaurant table for four near Union Square tonight.”** No OHNY festival tool should run, and no reservation should be claimed through this plugin.

## Plans and result: M9

Repeat setup on every plan you intend to mention publicly. Record unsupported plans and workspace restrictions. “All available countries” is the publisher's distribution preference, not a promise to bypass OpenAI's regional availability.

| Check | PASS / FAIL / PARTLY / BLOCKED / NOT RUN | What actually happened |
|---|---|---|
| M1 Phone-only first setup | | |
| M2 Native app, fresh chat | | |
| M3 Reopened app, another chat | | |
| M4 Live facts, unknown sites, changes, held ticket | | |
| M5 Location fallback | | |
| M6 Links and itinerary changes | | |
| M7 Voice separately | | |
| M8 Missing access and honest recovery | | |
| M9 Advertised plans | | |

Return this table with the setup details and redacted evidence. Leave personal account identifiers, precise home locations and credentials out of shared records. Record results in `docs/test-results.md`. Do not advertise mobile readiness until the relevant checks pass; do not advertise voice if only text passes.

The festival is October 16–18, 2026. Simulated dates make answers comparable before the event, but do not override the service's real-time seasonal tool removal. After October 18 recheck which tools are exposed; after November 18 this release exposes none.
