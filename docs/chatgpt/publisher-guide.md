# Publish Ask OHNY in ChatGPT

Prepared October 5, 2026. Publisher: **Dmitry Naidionov**. Intended availability: **all countries supported by the platform**. This guide is for the publisher; visitors must be able to start on their phones.

The package is a public-upload candidate, not an approved or published plugin. Creating the ZIP does not install OHNY in anyone's account. Follow the preparation steps before uploading a submission draft.

## 1. Finish the listing materials

The source listing is `plugins/ask-ohny/plugin.json`. It already contains the English listing, three starter prompts, five positive and three negative review cases, release notes, your name, and unrestricted country targeting. The empty `countries` array intentionally means all available countries, as you requested. English content and New York event coverage do not imply translation or local events in every country.

- Review the listing text in `listing-and-review.md`. The draft honestly identifies untested mobile and voice support. Replace that wording with precise supported behavior only after testing it.
- Review the original OH / NY icon. It is distinct artwork for an unofficial guide; the package does not use OHNY's official wordmark.
- Review the prepared support, privacy and terms pages in `policies/`. They are drafts, not published policies. Resolve the publisher review notes, including private privacy-contact arrangements and any account-level Cloudflare logging. Do not promise that Cloudflare retains nothing merely because the Worker stores no profiles.
- Publish approved policy pages on a site you control. The existing Worker does **not** serve these draft files automatically. Have your site deployment place them at your chosen public HTTPS addresses, then open each address while signed out and verify its actual content. Add only the verified addresses to `interface.privacyPolicyURL` and `interface.termsOfServiceURL`. The existing project issue tracker can serve as `supportURL` for ordinary non-sensitive bug reports; provide a private route before inviting sensitive privacy requests.
- Confirm the commerce declaration in the source manifest. Links to OHNY ticket/Passport pages must be described accurately even though this service cannot take payment or make purchases.

The public website and issue tracker were read without authentication during preparation. They identify the project and publisher. Policy pages and a recording URL still require publication and verification; the build's readiness report lists missing fields.

## 2. Rehearse and record a real demonstration

Use `demo-recording.md`. This needs an existing working development installation in ChatGPT. A developer connection can be prepared on a computer for this recording; it is not the visitor's phone-only setup test.

If no development connection exists, follow the minimum connection steps in that guide first. Record actual interactions and visible tool results. Host the video at a reviewer-accessible address, open it signed out, and play it through. Add its verified URL to `extensions.com.openai.review.demo_recording_url` and rebuild. A script or screen capture of static instructions is not a demo recording.

## 3. Build the package you intend to upload

From the repository folder, run:

```sh
npm run build:standalone
npm run package:chatgpt
npm run check:chatgpt-submission
```

The package command runs all offline tests first and stops on any failure. It copies the canonical skill, so do not edit a second skill inside an extracted ZIP. The ZIP and adjacent readiness/inventory report appear in `dist/`. The final command deliberately fails until required metadata fields are present. It checks local structure and metadata completeness, not public URL content, native behavior or portal eligibility.

Run the deployed-service check before recording and before portal review:

```sh
npm run smoke
```

This checks production, not local edits. The preparation change corrects shared skill wording and the local `ohny_guide` tool annotation. Deploy and verify those server changes through the existing Cloudflare workflow before recording the final server version or scanning it for review. Deployment is a separate action; it was not performed while preparing this package. Record the deployed revision and endpoint. The ZIP contains a server connection, not server hosting.

## 4. Verify your publisher account

Open the [OpenAI Plugins dashboard](https://platform.openai.com/plugins). Select the organization and project that should own Ask OHNY. Use your intended personal publisher identity, **Dmitry Naidionov**.

Complete individual identity verification in organization settings. Organization owners can submit; another member needs **Apps Management Write**. The name shown in the directory must match the selected verified identity. Inspect the saved listing name after upload; the name in a ZIP cannot substitute for identity verification.

## 5. Upload a draft and connect the service

Choose **Upload new or existing plugin**, select the verified identity, then upload the final ZIP. Include the MCP configuration in the first upload; the documented flow does not support adding MCP later to a skills-only plugin.

Review **Metadata & Skills**. Confirm the name, publisher, icon, four public URLs, prompts, country targeting, release notes, and embedded five/three cases. Resolve the reported findings in source and upload a rebuilt ZIP. Review cases are imported as read-only; edit them in the manifest.

In **MCPs**, connect the server:

- Address: `https://naidionov.com/ohny/skills/mcp`
- Authentication: **No authentication**. This is the existing public, read-only service; it does not require an OHNY visitor login.
- Transport: Streamable HTTP.

Complete the portal's domain challenge. Host the exact token as plain text at the exact URL the portal gives, commonly `https://<challenge-base-host>/.well-known/openai-apps-challenge`. **Do not paste the token into the plugin ZIP.** The current OHNY Worker route only covers `/ohny/skills*`; it does not cover that domain-root challenge path. Use the main site's routing/hosting or an eligible origin offered by the portal. Do not overwrite a challenge token belonging to another plugin.

Run the tool scan and verify that all expected tools and their annotations match the deployed source. `ohny_guide` reads bundled instructions; the five data tools read external festival information. No tool purchases, changes reservations, or submits check-in forms.

This service needs no reviewer account. If the portal still requests access instructions, enter the no-auth explanation through its secure reviewer-access form. Do not put credentials or `reviewer_instructions` fields in the public manifest.

## 6. Test the saved version, then submit

Run all eight embedded cases against the saved draft/available test connection, recording actual tool calls and outcomes in `docs/test-results.md`. Check the phone workflow in `phone-acceptance.md` using an actual account-available install route. A developer-only desktop connection cannot pass that test. If a phone-install route is not available at the review stage, keep its result BLOCKED and do not advertise it as supported; repeat against the published listing before announcing a mobile launch.

Inspect the portal's current requirements, resolve scans/findings, and have the authorized publisher complete the required policy/legal attestations. Select **Submit for review** only when the preparation and portal requirements are complete. Approval is not guaranteed. Once approved, **Publish plugin** is a separate action you choose.

## 7. Verify the published visitor journey

Copy the actual published listing/share link. Put it into the phone test guide and run the full fresh-account phone test. Then update the public setup page with the tested steps and genuine link. Never invent a ChatGPT installation URL from the package name.

MCP availability is seasonal: all six tools through October 18, site Q&A only October 19–November 18, no tools from November 19. Review could extend beyond these dates. The server chooses the tool list from real New York time; a simulated `now` parameter cannot restore tools that are no longer exposed. If that prevents review, record the blocker and decide on a supported, explicitly documented seasonal release change before resubmitting. Do not quietly bypass it for reviewers.

Keep the portal-generated app bindings in downloaded finalized releases; do not copy them into the author-supplied public-upload source. Later skill/listing changes need a new ZIP. Hosted MCP changes are scanned separately; recheck the current portal flow when updating.

## References checked October 5, 2026

- [Package format](https://developers.openai.com/plugins/build/plugins)
- [Submission, metadata and domain verification](https://developers.openai.com/plugins/deploy/submission)
- [ChatGPT development connection](https://developers.openai.com/plugins/quickstart)
- [Mobile plugin availability](https://learn.chatgpt.com/docs/plugins)
- [Cloudflare Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)

The first two references govern the package and portal details in this guide. Mobile documentation establishes use of account-available plugins; OHNY's own phone-only onboarding still requires direct testing.
