# Before publishing the policy drafts

The drafts are based on inspected source plus Dmitry's October 5, 2026 confirmation that he does not retain Cloudflare logs or website analytics. He did not claim knowledge of Cloudflare's default platform processing. Do not broaden that statement to “no one collects anything.”

1. Supply a private contact method for privacy requests. The existing public GitHub issue tracker is suitable for ordinary redacted bug reports but not sensitive requests. No private contact address was invented.
2. Inspect the deployed Cloudflare Worker and account settings: Workers observability/logs, any Logpush or Tail Worker destinations, security/traffic logging, and the main site's analytics. The repository has `[observability] enabled = false`; source alone does not prove every account-level setting. Cloudflare's documentation says Workers Logs require enabling observability. Its privacy policy separately describes network/traffic processing. Avoid treating Workers Logs' retention limit as a blanket Cloudflare retention policy.
3. Confirm the commerce model and any charge or referral relationship. The code is read-only and cannot process payments, but guide instructions can link to OHNY ticket and Passport purchases. Complete the manifest's commerce explanation from the actual model.
4. Review policy coverage and any applicable publisher obligations before announcing availability in all supported countries. No jurisdiction, governing law, liability cap or other legal commitment was invented. Decide whether additional terms are needed.
5. Resolve the draft's unfinished contact and verification sentences, set an effective date, and publish the approved content using the existing site workflow. Confirm that the policy pages are readable signed out and identify Ask OHNY and Dmitry Naidionov. Only then put the final verified HTTPS addresses into the manifest and rebuild.
6. The old deployed landing-page footer says the page is covered by the site's “usual analytics.” The local source removes that unverified claim and describes transient processing. Deploy the corrected source separately and verify the actual account settings before publishing policies.

These files are outside the public plugin ZIP. They are preparation materials, not proof that the required policy URLs already exist.

Sources checked October 5, 2026: [Cloudflare Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) and [Cloudflare privacy policy](https://www.cloudflare.com/privacypolicy/). The first supports the observability check; the second describes provider-level processing. Neither verifies this account's current dashboard settings.
