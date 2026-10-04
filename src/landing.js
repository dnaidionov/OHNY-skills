import { OHNY_LOGO_SVG, CLAUDE_ICON_SVG } from './brand.js';

// The human-facing page at naidionov.com/ohny/skills. Self-contained: inline CSS and JS, no third-party requests.

export const LINKS = {
  site: 'https://naidionov.com',
  github: 'https://github.com/dnaidionov/OHNY-skills',
  zip: 'https://github.com/dnaidionov/OHNY-skills/releases/latest/download/ohny-skill.zip',
  ohny: 'https://ohny.org',
  mcp: 'https://naidionov.com/ohny/skills/mcp',
  claude: 'https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=Ask%20OHNY&connectorUrl=https%3A%2F%2Fnaidionov.com%2Fohny%2Fskills%2Fmcp',
  standalone: 'https://raw.githubusercontent.com/dnaidionov/OHNY-skills/main/standalone/OHNY.md',
};

export const PASTE_LINE = `Use ${LINKS.standalone} as your guide to Open House New York Weekend for this chat. Then ask me what I'd like to do.`;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function landingHtml() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ask OHNY: an unofficial guide to Open House New York Weekend</title>
<meta name="description" content="Check in, find what's open near you right now, plan your day and get directions at Open House New York Weekend (Oct 16-18, 2026). Works in Claude and other AI chat apps, by voice on your phone. Unofficial.">
<meta name="theme-color" content="#14141a">
<link rel="canonical" href="https://naidionov.com/ohny/skills">
<link rel="icon" type="image/svg+xml" href="https://naidionov.com/ohny/skills/favicon.svg">
<link rel="icon" type="image/png" href="https://naidionov.com/ohny/skills/favicon.png">
<link rel="apple-touch-icon" href="https://naidionov.com/ohny/skills/icon.png">
<meta property="og:title" content="Ask OHNY: an unofficial guide to Open House New York Weekend">
<meta property="og:description" content="What's open near you right now, day planning, check-in and directions for OHNY Weekend, Oct 16-18, 2026. Works by voice in AI chat apps.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://naidionov.com/ohny/skills">
<style>
  :root{--bg:#fafaf7;--card:#fff;--ink:#14141a;--muted:#585b64;--line:#e3e1d8;--accent:#14141a;--onaccent:#fff;--soft:#f0efe8}
  @media (prefers-color-scheme:dark){:root{--bg:#111114;--card:#1b1b20;--ink:#f1f0ea;--muted:#a6a8b0;--line:#2d2d34;--accent:#f1f0ea;--onaccent:#111114;--soft:#222228}}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  main{max-width:680px;margin:0 auto;padding:28px 16px 56px}
  .head{display:flex;align-items:center;gap:26px;margin:0 0 10px}
  .head .ohny-logo{width:64px;height:auto;flex:none;color:var(--ink)}
  h1{font-size:2rem;line-height:1.15;margin:0;letter-spacing:-.01em}
  .sub{margin:0;color:var(--muted);font-size:.9rem}
  .ico{width:22px;height:22px;flex:none;margin-right:9px}
  h2{font-size:1.15rem;margin:34px 0 10px}
  .lead{color:var(--muted);margin:0 0 18px;font-size:1.05rem}
  .notice{background:var(--soft);border:1px solid var(--line);border-radius:12px;padding:12px 14px;font-size:.92rem;color:var(--muted);margin:0 0 8px}
  ul.what{padding-left:1.1rem;margin:8px 0}
  ul.what li{margin:4px 0}
  .card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin:12px 0}
  .card h3{margin:0 0 4px;font-size:1.02rem}
  .card p{margin:6px 0;color:var(--muted);font-size:.95rem}
  .tag{display:inline-block;font-size:.75rem;font-weight:600;padding:2px 8px;border-radius:99px;background:var(--soft);border:1px solid var(--line);color:var(--muted);margin-left:6px;vertical-align:middle}
  a.btn,button.btn{font:inherit;font-weight:600;min-height:48px;padding:0 18px;border-radius:12px;border:1px solid var(--accent);background:var(--accent);color:var(--onaccent);text-decoration:none;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;margin:6px 8px 0 0}
  a.btn.ghost,button.btn.ghost{background:transparent;color:var(--ink);border-color:var(--line)}
  code,.copybox{font:.88rem/1.45 ui-monospace,SFMono-Regular,Menlo,monospace}
  .copybox{display:block;background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin:8px 0;word-break:break-word;color:var(--ink)}
  a{color:inherit}
  footer{margin-top:40px;padding-top:16px;border-top:1px solid var(--line);color:var(--muted);font-size:.9rem}
  .tablist{display:flex;gap:6px;overflow-x:auto;margin:0 0 -1px;padding:0 2px}
  .tab{font:inherit;font-weight:600;min-height:44px;padding:0 16px;border:1px solid var(--line);border-bottom:none;border-radius:12px 12px 0 0;background:var(--soft);color:var(--muted);cursor:pointer;white-space:nowrap}
  .tab[aria-selected=true]{background:var(--card);color:var(--ink)}
  .tab:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  .tabs .panel{margin-top:0;border-top-left-radius:0}
  .panel[hidden]{display:none}
  .manual h3{margin:0 0 4px;font-size:1.02rem}
  .manual .says{margin:8px 0 4px;font-size:.8rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
  .manual ul.eg{list-style:none;padding:0;margin:0 0 8px}
  .manual ul.eg li{background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:7px 12px;margin:6px 0;font-size:.95rem;font-style:italic}
  .manual ul.uses{padding-left:1.1rem;margin:4px 0 8px;color:var(--muted);font-size:.95rem}
  .manual ul.uses li{margin:3px 0}
  .manual details{background:var(--card);border:1px solid var(--line);border-radius:12px;margin:8px 0;padding:0 14px}
  .manual summary{cursor:pointer;font-weight:600;min-height:48px;display:flex;align-items:center}
  .manual details[open] summary{margin-bottom:2px}
  .manual details p{margin:4px 0 12px;color:var(--muted);font-size:.95rem}
  .toc{display:flex;flex-wrap:wrap;gap:6px 14px;margin:0 0 6px;font-size:.92rem}
  .toast{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);background:var(--accent);color:var(--onaccent);padding:10px 16px;border-radius:10px;font-size:.9rem;opacity:0;pointer-events:none;transition:opacity .2s}
  .toast.on{opacity:1}
</style>
</head>
<body>
<main>
  <div class="head">
    ${OHNY_LOGO_SVG}
    <div><h1>Ask OHNY</h1><p class="sub">Unofficial guide</p></div>
  </div>
  <p class="lead">An unofficial pocket guide to <strong>Open House New York Weekend</strong>, October 16&ndash;18, 2026. Ask it in your AI chat app, by voice on your phone.</p>
  <p class="notice"><strong>Independent project.</strong> Not affiliated with, endorsed by or sponsored by Open House New York. For anything official, see <a href="${esc(LINKS.ohny)}" target="_blank" rel="noopener noreferrer">ohny.org</a>.</p>

  <h2>What it does</h2>
  <ul class="what">
    <li><strong>What's open near me?</strong> Checks hours at the moment you'd arrive, so it won't send you somewhere that closes first.</li>
    <li><strong>Check you in</strong> at a site, reading you the form's notice first.</li>
    <li><strong>Plan your day</strong> around your interests, kids, accessibility, tickets and how you get around.</li>
    <li><strong>Tell you about a place</strong>, with entry rules and a fun fact or two, and help with directions.</li>
  </ul>
  <p style="margin:8px 0"><a href="#manual">See everything it can do, with example questions &darr;</a></p>
  <p style="color:var(--muted);font-size:.95rem">It reads OHNY's public lineup live, so cancellations and last-minute changes show up. The guide service itself stores nothing about you; whatever your assistant remembers stays in your own AI account.</p>

  <h2>Get started</h2>
  <div class="tabs" id="tabs">
    <div class="tablist" role="tablist" aria-label="Choose your AI app">
      <button class="tab" role="tab" id="tab-claude" aria-controls="panel-claude" aria-selected="true" type="button">Claude</button>
      <button class="tab" role="tab" id="tab-chatgpt" aria-controls="panel-chatgpt" aria-selected="false" tabindex="-1" type="button">ChatGPT</button>
      <button class="tab" role="tab" id="tab-gemini" aria-controls="panel-gemini" aria-selected="false" tabindex="-1" type="button">Gemini</button>
      <button class="tab" role="tab" id="tab-others" aria-controls="panel-others" aria-selected="false" tabindex="-1" type="button">Others</button>
    </div>

    <section class="card panel" role="tabpanel" id="panel-claude" aria-labelledby="tab-claude">
      <h3>Claude <span class="tag">works on free accounts</span></h3>
      <p>One tap opens Claude's "Add custom connector" box with everything filled in. Check it and confirm. Easiest on a computer; once added it also works in the Claude phone app.</p>
      <a class="btn" href="${esc(LINKS.claude)}" target="_blank" rel="noopener noreferrer">${CLAUDE_ICON_SVG}Add to Claude</a>
      <p>Then start a chat and say <em>"ohny, what's open near me?"</em> The first time, Claude asks to approve each tool: choose <strong>Always allow</strong>, since none of them change anything.</p>
      <p><strong>Prefer a skill?</strong> <span class="tag">paid plans</span> Download the zip (always the latest release) and add it in Claude under Customize, Skills.</p>
      <a class="btn ghost" href="${esc(LINKS.zip)}" rel="noopener">Download ohny-skill.zip</a>
    </section>

    <section class="card panel" role="tabpanel" id="panel-chatgpt" aria-labelledby="tab-chatgpt" hidden>
      <h3>ChatGPT <span class="tag">Plus or higher</span></h3>
      <p>In Settings, Connectors, turn on Developer Mode, choose Create, paste this address and select "No authentication".</p>
      <code class="copybox" id="mcp-chatgpt">${esc(LINKS.mcp)}</code>
      <button class="btn ghost" type="button" data-copy="mcp-chatgpt">Copy address</button>
      <p>Free ChatGPT accounts can't add connectors; use the paste method under <a href="#others" data-tab="others">Others</a> instead.</p>
    </section>

    <section class="card panel" role="tabpanel" id="panel-gemini" aria-labelledby="tab-gemini" hidden>
      <h3>Gemini</h3>
      <p>Gemini can't add connectors like this yet, so use the no-install route. Paste this into a new chat. It works for that chat only.</p>
      <code class="copybox" id="paste-gemini">${esc(PASTE_LINE)}</code>
      <button class="btn ghost" type="button" data-copy="paste-gemini">Copy</button>
      <p>It needs Gemini's web browsing to be on, and live "what's open now" checks may be limited.</p>
    </section>

    <section class="card panel" role="tabpanel" id="panel-others" aria-labelledby="tab-others" hidden>
      <h3>Any other chatbot</h3>
      <p><strong>Can browse the web?</strong> Paste this into a new chat. It works for that chat only, with nothing to install.</p>
      <code class="copybox" id="paste">${esc(PASTE_LINE)}</code>
      <button class="btn ghost" type="button" data-copy="paste">Copy</button>
      <p><strong>Supports MCP connectors?</strong> Add this server address (no sign-in needed):</p>
      <code class="copybox" id="mcp">${esc(LINKS.mcp)}</code>
      <button class="btn ghost" type="button" data-copy="mcp">Copy address</button>
    </section>
  </div>

  <h2 id="trying">Trying it before the festival</h2>
  <p>Before October 16 the assistant will ask what day and time to pretend it is, for example "Saturday 2:30 PM", and you can change it any time.</p>

  <section class="manual" id="manual">
  <h2>User manual</h2>
  <p class="lead" style="margin-bottom:10px">Talk to it the way you'd talk to a friend who knows the festival. Start with the word <em>"ohny"</em> or <em>"Open House New York"</em> so your assistant knows to use it. Everything below also works by voice, and replies are kept short so they're easy to listen to.</p>
  <p class="toc"><a href="#m-nearby">What's open near me</a> <a href="#m-site">About a place</a> <a href="#m-plan">Plan my day</a> <a href="#m-directions">Directions</a> <a href="#m-checkin">Check in</a> <a href="#m-festival">Festival questions</a> <a href="#m-changes">Changes</a> <a href="#m-memory">What it remembers</a> <a href="#m-trouble">Troubleshooting</a></p>

  <div class="card" id="m-nearby">
    <h3>1. Find what's open near me</h3>
    <p>Tell it where you are and what you like, and it suggests places you can actually get into.</p>
    <p class="says">Try saying</p>
    <ul class="eg">
      <li>"ohny, what's open near me?"</li>
      <li>"What's near the Brooklyn Public Library that my kids would like?"</li>
      <li>"I'm at Grand Central. Any rooftops or architecture within a 15 minute walk?"</li>
      <li>"What else is near here?" (right after you've visited a place)</li>
    </ul>
    <p class="says">What it takes into account</p>
    <ul class="uses">
      <li><strong>Where you are.</strong> Share your phone's location, or name a cross street, a landmark or the place you've just been.</li>
      <li><strong>When you'd arrive,</strong> not just now: it adds the walk and leaves out places that will be closed or full by then. If a place closes soon after you'd get there, it tells you to head straight over.</li>
      <li><strong>Your interests,</strong> such as architecture, history, art, rooftops, gardens or kids' activities.</li>
      <li><strong>Children</strong> (the youngest one's age) and <strong>wheelchair access</strong>, so it can leave out places with an age limit or without access.</li>
      <li><strong>How far you're willing to walk.</strong></li>
      <li><strong>OHNY's own "worth a visit nearby" picks,</strong> which get a boost. A closer place that fits you better can still come first.</li>
      <li><strong>Entry rules that could stop you,</strong> like photo ID, age limits, bag limits or security screening, mentioned in a few words.</li>
      <li><strong>Tickets.</strong> Ticketed tours show up only while one is under way, and it says a ticket is needed. Sold-out and canceled places are never offered.</li>
    </ul>
    <p>It also tells you what it <em>left out and why</em> ("eleven places have closed for the day, two are tours that aren't running"), so a short list isn't a mystery.</p>
  </div>

  <div class="card" id="m-site">
    <h3>2. Ask about a specific place</h3>
    <p>Hours, what you'll see, entry rules, and a bit of the story behind the building.</p>
    <p class="says">Try saying</p>
    <ul class="eg">
      <li>"Tell me about the Grolier Club."</li>
      <li>"Is the Jefferson Market Courthouse wheelchair accessible?"</li>
      <li>"Do I need a ticket for the Domino Sugar Refinery? What should I bring?"</li>
    </ul>
    <p class="says">What it takes into account</p>
    <ul class="uses">
      <li>OHNY's own description, access notes and accessibility details, fetched fresh each time, plus the site's own website.</li>
      <li>Whether it's open, ticketed, sold out or canceled right now. A cancellation is the first thing you'll hear.</li>
      <li>The practical must-knows: ID, bags, photography, footwear, stairs, arrive-early. It quotes these as OHNY states them and never invents them.</li>
      <li>A fun fact or two, only when it can source them. It won't make up history.</li>
      <li>OHNY's suggestions for nearby places, with walking times.</li>
    </ul>
    <p>If no site by that name is in OHNY's lineup, it tells you so plainly and offers to search by neighborhood or topic instead.</p>
  </div>

  <div class="card" id="m-plan">
    <h3>3. Plan your day or the whole weekend</h3>
    <p>It asks a few questions, one at a time, then offers two or three different plans for you to choose from and adjust.</p>
    <p class="says">Try saying</p>
    <ul class="eg">
      <li>"Plan my Saturday in Brooklyn."</li>
      <li>"We have four hours Sunday afternoon with a six-year-old. What should we do?"</li>
      <li>"I already have tickets for 2 PM at the Refinery. Build a day around that."</li>
      <li>"We're running late. Change the plan."</li>
    </ul>
    <p class="says">What it takes into account</p>
    <ul class="uses">
      <li><strong>Which days and how many hours,</strong> and when you start and finish.</li>
      <li><strong>Interests, boroughs and places you already want to see.</strong></li>
      <li><strong>Who's coming:</strong> group size, kids' ages, wheelchair or limited-stairs needs.</li>
      <li><strong>How you'll get around</strong> and how far you'll walk.</li>
      <li><strong>Tickets you already hold,</strong> which become fixed points the plan is built around.</li>
      <li><strong>Whether you have a Passport,</strong> which lets you go ahead of the line at free sites. It budgets longer waits at popular free sites if you don't, and puts the most popular ones first thing or late.</li>
      <li><strong>Real visit windows only.</strong> It never plans an arrival in the last 20 minutes of opening hours or after a tour's start time, and leaves buffers between stops (more for ticketed tours).</li>
      <li><strong>Geography.</strong> Stops are grouped by neighborhood to avoid zig-zagging across boroughs.</li>
      <li><strong>Entry rules</strong> that clash with your group, such as age limits, bags with strollers, stairs or no photography.</li>
      <li><strong>Last-minute changes.</strong> It checks for cancellations before presenting a plan and again before each leg.</li>
      <li><strong>Lunch or dinner</strong> for longer plans, near your stops, if you want it.</li>
    </ul>
    <p>Once you choose, you get a followable itinerary: a checklist page where your assistant can show one, or a guided walk-through, one stop at a time, in a voice chat.</p>
  </div>

  <div class="card" id="m-directions">
    <h3>4. Get directions</h3>
    <p class="says">Try saying</p>
    <ul class="eg">
      <li>"How do I get to the next stop?"</li>
      <li>"Directions to the Tenement Museum by subway."</li>
      <li>"Walking directions from here."</li>
    </ul>
    <p class="says">What it takes into account</p>
    <ul class="uses">
      <li>It gives you a tappable link that opens Google Maps or Apple Maps, with a one-sentence summary. Transit is the default in New York; say "walking" or "bike" to change it.</li>
      <li>It won't quote subway routes from memory, since weekend service changes make those unreliable. The maps link has the current ones.</li>
      <li>For a site where the exact address isn't published until you have a ticket, it says the location is approximate.</li>
    </ul>
  </div>

  <div class="card" id="m-checkin">
    <h3>5. Check in at a site</h3>
    <p>OHNY asks every visitor to check in at each site before going in. This gets you through OHNY's own short form quickly.</p>
    <p class="says">Try saying</p>
    <ul class="eg">
      <li>"Check me in."</li>
      <li>"Check us in at the Morgan Library. There are three of us."</li>
    </ul>
    <p class="says">What it takes into account</p>
    <ul class="uses">
      <li><strong>The first time,</strong> it asks whether you want to leave an email or stay anonymous (both are fine), plus your zip or postal code and group size. It never asks for your name; the form has no name field.</li>
      <li><strong>Which site.</strong> You name it, or it works it out from where you are, and confirms with you.</li>
      <li><strong>The form's notice.</strong> It reads you the photo and risk waiver in plain words and waits for a clear "yes" before going further.</li>
      <li><strong>The newsletter box</strong> is left alone unless you ask to join OHNY's mailing list.</li>
      <li>It gives you the link to OHNY's official form and tells you what to enter, so the check-in is still yours to submit.</li>
      <li>At the next site it reuses what you said you'd like remembered and only confirms the group size ("still three of you?").</li>
    </ul>
  </div>

  <div class="card" id="m-festival">
    <h3>6. Questions about the festival itself</h3>
    <p class="says">Try saying</p>
    <ul class="eg">
      <li>"What is a Weekend Passport?"</li>
      <li>"Do I need tickets for everything?"</li>
      <li>"What are the festival dates?"</li>
      <li>"Who made this? Is it official?"</li>
    </ul>
    <p class="says">What it takes into account</p>
    <ul class="uses">
      <li>It checks ohny.org first and says where an answer came from if it had to look elsewhere. For ticket rules, prices and Passport benefits it reads the official page instead of guessing.</li>
      <li>It sells nothing and gets nothing from anything you buy. Tickets and Passports are bought on ohny.org, and it mentions them only when they'd clearly help what you're trying to do, never with pressure.</li>
    </ul>
  </div>

  <div class="card" id="m-changes">
    <h3>7. Anything new or canceled?</h3>
    <p class="says">Try saying</p>
    <ul class="eg">
      <li>"Any cancellations or changes?"</li>
      <li>"Is anything new on the lineup since last week?"</li>
    </ul>
    <p>It lists cancellations, new sites and changed times from ohny.org. It checks this on its own before it finalizes a plan.</p>
  </div>

  <div class="card" id="m-memory">
    <h3>What it remembers (and doesn't)</h3>
    <ul class="uses" style="margin-top:6px">
      <li>Only what you tell it and agree to keep: your interests, group size, zip code, kids' ages, accessibility needs, how you like to get around, whether you hold a Passport, tickets you already have, and the places you've visited.</li>
      <li>It's kept in your own AI account, not by the people who made this guide. Ask <em>"what do you know about me?"</em> to see it all, or say <em>"forget it"</em> to delete it.</li>
      <li>It never saves your email unless you say so.</li>
    </ul>
  </div>

  <h2 id="m-trouble">Troubleshooting</h2>
  <details>
    <summary>It doesn't seem to know about OHNY, or answers like a generic chatbot</summary>
    <p>Start your message with "ohny" or "Open House New York" so the assistant knows to use the guide. Make sure it's switched on: in Claude, check that Ask OHNY is enabled in the chat's tools menu. If you used the paste-in method, paste the line again at the start of a new chat, since it only lasts for that chat.</p>
  </details>
  <details>
    <summary>My assistant asks permission every time</summary>
    <p>The first time, choose <strong>Always allow</strong>. None of the tools change anything, they only look things up.</p>
  </details>
  <details>
    <summary>It says it can't see live information, or mentions a "saved copy"</summary>
    <p>It couldn't reach OHNY's live list for a moment. It'll tell you, so please double-check hours and status on the site's own page at ohny.org (every site has one) before you set out. Trying again a minute later usually works.</p>
  </details>
  <details>
    <summary>It says the festival isn't on and asks what day and time to pretend it is</summary>
    <p>That's expected before October 16 (see <a href="#trying">Trying it before the festival</a>). Answer with something like "Saturday 2:30 PM". You can change it any time by saying "change the time to Sunday morning".</p>
  </details>
  <details>
    <summary>It says it can't find a place I know is in the festival</summary>
    <p>Try the exact name as it appears on ohny.org, a neighborhood, or a topic ("rooftops in Queens"). If it truly isn't in OHNY's lineup it will say so.</p>
  </details>
  <details>
    <summary>The list of nearby places is short or empty</summary>
    <p>It will tell you why. Often it's late in the day, or places are tours not currently running, or your walking limit or interests are narrow. Try "show me more, even if it's a longer walk" or "include other interests".</p>
  </details>
  <details>
    <summary>It doesn't know where I am</summary>
    <p>Allow location sharing in your app, or just say a cross street, a landmark or the place you've just been, for example "I'm outside Washington Square Park".</p>
  </details>
  <details>
    <summary>A place was closed, full or different from what it told you</summary>
    <p>Sorry about that. Sites can change things at the last minute, and busy places can run out of room, so it can't guarantee entry or wait times. Tell it what happened and ask for "what else is near here?". For anything official, contact OHNY at <a href="mailto:info@ohny.org">info@ohny.org</a> or see ohny.org.</p>
  </details>
  <details>
    <summary>It's not working in ChatGPT or Gemini</summary>
    <p>ChatGPT needs a Plus or higher plan with Developer Mode on to add connectors; otherwise use the paste-in method under <a href="#others" data-tab="others">Others</a>. Gemini uses the paste-in method too and needs its web browsing switched on, so live "open now" checks may be limited there.</p>
  </details>
  <details>
    <summary>It said something wrong, or something else isn't working</summary>
    <p>Please tell your assistant what happened so it can try again, and check the official page for the place. You can also report problems on the project's <a href="${esc(LINKS.github)}/issues" target="_blank" rel="noopener noreferrer">GitHub page</a>.</p>
  </details>
  </section>

  <footer>
    Made by <a href="${esc(LINKS.site)}" target="_blank" rel="noopener noreferrer">Dmitry Naidionov</a> &middot;
    <a href="${esc(LINKS.github)}" target="_blank" rel="noopener noreferrer">Source on GitHub</a> (MIT) &middot;
    <a href="?format=json">For developers</a>
    <br>The Open House New York name and logo belong to OHNY and are shown for identification only; this project is not affiliated with OHNY. Claude is a trademark of Anthropic.
    <br>This page is part of naidionov.com and is covered by that site's usual analytics.
  </footer>
</main>
<div class="toast" id="toast" role="status"></div>
<script>
(function () {
  var toast = document.getElementById('toast');
  function say(m) { toast.textContent = m; toast.className = 'toast on'; setTimeout(function () { toast.className = 'toast'; }, 2000); }
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  function show(name, focus) {
    tabs.forEach(function (t) {
      var on = t.id === 'tab-' + name;
      t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      if (on && focus) t.focus();
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { show(t.id.slice(4)); });
    t.addEventListener('keydown', function (e) {
      var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
      if (j < 0) return; e.preventDefault(); show(tabs[(j + tabs.length) % tabs.length].id.slice(4), true);
    });
  });
  var fromHash = location.hash.slice(1);
  if (document.getElementById('tab-' + fromHash)) show(fromHash);
  document.addEventListener('click', function (e) {
    var l = e.target.closest && e.target.closest('[data-tab]');
    if (l) { e.preventDefault(); show(l.getAttribute('data-tab'), true); return; }
    var b = e.target.closest && e.target.closest('[data-copy]'); if (!b) return;
    var el = document.getElementById(b.getAttribute('data-copy'));
    var text = el.textContent;
    function fallback() {
      var r = document.createRange(); r.selectNodeContents(el);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      try { document.execCommand('copy'); say('Copied'); } catch (err) { say('Press and hold to copy'); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { say('Copied'); }, fallback);
    else fallback();
  });
})();
</script>
</body>
</html>
`;
}
