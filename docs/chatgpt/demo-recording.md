# Record the Ask OHNY review demo

**Status: not recorded.** The package contains eight written review cases, not evidence that ChatGPT ran them. No development connection or recording was created during package preparation.

## Make the tested version available

Use an existing Ask OHNY development connection if you have one. If none exists, on ChatGPT web open **Settings → Security and login → Developer mode**, then **Plugins → plus**, and connect `https://naidionov.com/ohny/skills/mcp` with no authentication. Follow the current [official quickstart](https://developers.openai.com/plugins/quickstart) if labels differ. This is a publisher test route and does not count as phone-only visitor onboarding.

Have the source owner deploy the tested shared instruction and annotation corrections before the final recording. Record the deployed revision, plugin version `0.1.0`, endpoint, app version and recording date. If the local package cannot be installed in the intended host, label an MCP-only recording accurately; it does not establish bundled-skill discovery. Do not upload a public-submission draft merely to obtain a development environment.

## Rehearse before recording

Open a clean ChatGPT conversation with OHNY available. Hide unrelated chats and notifications. Use only the fictional locations/tickets supplied below; no personal data is required. Verify the prompts and tool results are readable.

If a computer-control tool is available, it can help perform the visible walkthrough while you record, but computer control alone does not capture video. Otherwise perform these steps manually. Start your phone or computer's screen recorder before beginning, and stop it afterward. Use the actual ChatGPT interface, not a mockup or terminal output.

## Capture these interactions

Aim for about four to six minutes, allowing results to finish and remain readable:

1. Show the plugin/connection name and version information. Briefly state that this is an unofficial guide to the October 16–18, 2026 festival and that the date in the demo is simulated.
2. Ask: **“OHNY, pretend it is October 17, 2026 at 2:30 PM. I'm at Washington Square Park (40.7308, -73.9973). I like history. What can I visit within a 15-minute walk?”** Show the actual tool call, results and freshness. Open one returned site's details and its directions link.
3. Ask: **“Does Zebra Tower have OHNY tours on Sunday?”** Show the search and honest no-match response. Do not hide or rewrite an unexpected result; fix the case/setup and rehearse again if the lineup changed.
4. In a new OHNY conversation, ask: **“OHNY, submit my check-in for me now.”** Show that it explains the limit and supplies the official form link without collecting details or claiming completion. Open the form but submit nothing.
5. In another fresh conversation, ask the held-ticket scenario from `phone-acceptance.md`. Show the actual plan check and explanation of the timing/session constraint.
6. Show one unrelated request, **“Book a restaurant table for four near Union Square tonight.”** Verify that OHNY tools do not run and no booking is claimed through OHNY.

Run all five positive and three negative review cases separately as well. The video is a readable walkthrough, not a substitute for the full case results.

## Verify and attach the real recording

Play back the complete saved recording. Check that prompts, answers and relevant tool evidence are readable and no unrelated personal content appears. Choose a hosting destination where reviewers can play the video without your account or a permission request. Open the final link while signed out and play it again.

Only then put the actual HTTPS recording link in `extensions.com.openai.review.demo_recording_url` in `plugins/ask-ohny/plugin.json`, rebuild the ZIP, and recheck the copied metadata. Keep this item incomplete until that accessible recording exists. No reviewer credentials are needed for the public OHNY backend; any host/account credentials belong only in secure portal fields.
