import { OHNY_LOGO_SVG, CLAUDE_ICON_SVG } from './brand.js';

// The human-facing page at naidionov.com/ohny/skills. Self-contained: inline CSS and JS, no third-party requests.

export const LINKS = {
  site: 'https://naidionov.com',
  github: 'https://github.com/dnaidionov/OHNY-skills',
  zip: 'https://github.com/dnaidionov/OHNY-skills/releases/latest/download/ohny-skill.zip',
  ohny: 'https://ohny.org',
  mcp: 'https://naidionov.com/ohny/skills/mcp',
  claude: 'https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=Ask%20OHNY&connectorUrl=https%3A%2F%2Fnaidionov.com%2Fohny%2Fskills%2Fmcp',
  standalone: 'https://naidionov.com/ohny/skills/guide',
  geminiApps: 'https://gemini.google.com/apps',
  chatgptPlugins: 'https://chatgpt.com/plugins',
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
<meta name="description" content="Find what's open near you right now, plan your day, get directions and the check-in link for Open House New York Weekend (Oct 16-18, 2026). Works in Claude and other AI chat apps, by voice on your phone. Unofficial.">
<meta name="theme-color" content="#14141a">
<link rel="canonical" href="https://naidionov.com/ohny/skills">
<link rel="icon" type="image/svg+xml" href="https://naidionov.com/ohny/skills/favicon.svg">
<link rel="icon" type="image/png" href="https://naidionov.com/ohny/skills/favicon.png">
<link rel="apple-touch-icon" href="https://naidionov.com/ohny/skills/icon.png">
<meta property="og:title" content="Ask OHNY: an unofficial guide to Open House New York Weekend">
<meta property="og:description" content="What's open near you right now, day planning, directions and the check-in link for OHNY Weekend, Oct 16-18, 2026. Works by voice in AI chat apps.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://naidionov.com/ohny/skills">
<meta property="og:site_name" content="Ask OHNY (unofficial)">
<meta property="og:image" content="https://naidionov.com/ohny/skills/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Ask OHNY: an unofficial guide to Open House New York Weekend">
<meta name="twitter:image" content="https://naidionov.com/ohny/skills/og.png">
<style>
  :root{--bg:#fafaf7;--card:#fff;--ink:#14141a;--muted:#585b64;--line:#e3e1d8;--accent:#14141a;--onaccent:#fff;--soft:#f0efe8}
  @media (prefers-color-scheme:dark){:root{--bg:#111114;--card:#1b1b20;--ink:#f1f0ea;--muted:#a6a8b0;--line:#2d2d34;--accent:#f1f0ea;--onaccent:#111114;--soft:#222228}}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  main{max-width:680px;margin:0 auto;padding:28px 16px 56px}
  .layout{max-width:680px;margin:0 auto}
  .layout main{margin:0}
  html{scroll-behavior:smooth}
  @media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
  [id]{scroll-margin-top:72px}
  .pagenav{position:sticky;top:0;z-index:20;background:var(--bg);border-bottom:1px solid var(--line)}
  .pagenav details{position:relative;padding:0 16px}
  .pagenav summary{list-style:none;cursor:pointer;min-height:48px;display:flex;align-items:center;gap:8px;font-size:.95rem;min-width:0}
  .pagenav summary .lbl{color:var(--muted);flex:none}
  .pagenav summary .cur{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0}
  .pagenav summary::-webkit-details-marker{display:none}
  .pagenav summary::after{content:"";width:7px;height:7px;border-right:2px solid var(--muted);border-bottom:2px solid var(--muted);border-radius:1px;transform:translateY(-25%) rotate(45deg);transition:transform .15s ease;margin-right:4px;flex:none}
  .pagenav details[open]>summary::after{transform:translateY(25%) rotate(-135deg)}
  .pagenav ul{list-style:none;margin:0;padding:0}
  .js .pagenav details>ul{position:absolute;left:12px;right:12px;top:100%;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:6px 6px;max-height:70vh;overflow:auto;box-shadow:0 12px 28px rgba(0,0,0,.14)}
  .pagenav a{display:block;padding:9px 10px;border-radius:8px;text-decoration:none;color:var(--muted);font-size:.95rem}
  .pagenav a:hover{color:var(--ink);background:var(--soft)}
  .pagenav a.on{color:var(--ink);font-weight:600;background:var(--soft)}
  .pagenav li li a{padding-left:24px;font-size:.9rem}
  @media (min-width:920px){
    .layout{display:grid;grid-template-columns:190px minmax(0,680px);gap:28px;max-width:898px}
    [id]{scroll-margin-top:24px}
    .pagenav{position:sticky;top:0;align-self:start;max-height:100vh;overflow:auto;border:none;background:none;padding:34px 0 24px;z-index:auto}
    .pagenav details{padding:0}
    .pagenav summary{display:none}
    .js .pagenav details>ul{position:static;border:none;box-shadow:none;background:none;padding:0;max-height:none;overflow:visible}
    .pagenav a{padding:6px 10px;font-size:.92rem}
    .pagenav li li a{padding-left:22px;font-size:.88rem}
  }
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
  .manual details.sec,.manual details.sec-h{padding:0}
  .manual details.sec{padding:0 16px}
  .manual details.sec-h{background:none;border:none;margin:0}
  .manual details.sec>summary,.manual details.sec-h>summary{display:block;min-height:44px;padding-top:11px;padding-bottom:11px}
  .manual details.sec>summary h3,.manual details.sec-h>summary h2{display:inline;margin:0}
  .manual details.sec-h>summary{margin-top:24px}
  .manual details.sec-h>summary h2{font-size:1.15rem}
  .manual details.sec[open]>summary{margin-bottom:4px}
  .manual summary{list-style:none;position:relative;padding-right:30px}
  .manual summary::-webkit-details-marker{display:none}
  .manual details:not(.sec):not(.sec-h):not(.off)>summary{padding-top:12px;padding-bottom:12px}
  .manual summary::after{content:"";position:absolute;right:6px;top:50%;width:7px;height:7px;border-right:2px solid var(--muted);border-bottom:2px solid var(--muted);border-radius:1px;transform:translateY(-70%) rotate(45deg);transition:transform .15s ease}
  .manual details[open]>summary::after{transform:translateY(-25%) rotate(-135deg)}
  .manual summary:hover::after{border-color:var(--ink)}
  @media (prefers-reduced-motion:reduce){.manual summary::after{transition:none}}
  .manual details.off{margin-top:14px;border:1px dashed var(--muted);background:repeating-linear-gradient(135deg,color-mix(in srgb,var(--soft) 65%,transparent) 0 7px,transparent 7px 14px)}
  .manual details.off>summary{display:block;padding:10px 0;color:var(--muted)}
  .manual details.off p,.manual details.off li{color:var(--ink)}
  .manual details.off ul.uses{padding-left:1.1rem}
  .toc{display:flex;flex-wrap:wrap;gap:6px 14px;margin:0 0 6px;font-size:.92rem}
  .toast{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);background:var(--accent);color:var(--onaccent);padding:10px 16px;border-radius:10px;font-size:.9rem;opacity:0;pointer-events:none;transition:opacity .2s}
  .toast.on{opacity:1}
</style>
</head>
<body>
<script>document.documentElement.className='js'</script>
<div class="layout">
<nav class="pagenav" aria-label="On this page">
  <details id="navd" open>
    <summary><span class="lbl">On this page:</span><span class="cur">What it does</span></summary>
    <ul>
      <li><a href="#what">What it does</a></li>
      <li><a href="#start">Get started</a></li>
      <li><a href="#trying">Trying it before the festival</a></li>
      <li><a href="#manual">User manual</a>
        <ul>
          <li><a href="#m-nearby">What's open near me</a></li>
          <li><a href="#m-site">About a place</a></li>
          <li><a href="#m-plan">Plan my day</a></li>
          <li><a href="#m-directions">Directions</a></li>
          <li><a href="#m-checkin">Check in</a></li>
          <li><a href="#m-festival">Festival questions</a></li>
          <li><a href="#m-changes">Changes</a></li>
          <li><a href="#m-memory">What it remembers</a></li>
        </ul>
      </li>
      <li><a href="#m-trouble">Troubleshooting</a></li>
    </ul>
  </details>
</nav>
<script>if(!matchMedia('(min-width:920px)').matches)document.getElementById('navd').open=false</script>
<main>
  <div class="head">
    ${OHNY_LOGO_SVG}
    <div><h1>Ask OHNY</h1><p class="sub">Unofficial guide</p></div>
  </div>
  <p class="lead">An unofficial pocket guide to <strong>Open House New York Weekend</strong>, October 16&ndash;18, 2026. Ask it in your AI chat app, by voice on your phone.</p>
  <p class="notice"><strong>Independent project.</strong> Not affiliated with, endorsed by or sponsored by Open House New York. For anything official, see <a href="${esc(LINKS.ohny)}" target="_blank" rel="noopener noreferrer">ohny.org</a>.</p>

  <h2 id="what">What it does</h2>
  <ul class="what">
    <li><strong>What's open near me?</strong> Checks hours at the moment you'd arrive, so it won't send you somewhere that closes first.</li>
    <li><strong>Get you to the check-in form</strong> for any site: it can't check you in itself, so it gives you OHNY's link to tap.</li>
    <li><strong>Plan your day</strong> around your interests, kids, accessibility, tickets and how you get around.</li>
    <li><strong>Tell you about a place</strong>, with entry rules and a fun fact or two, and help with directions.</li>
  </ul>
  <p style="margin:8px 0"><a href="#manual">See everything it can do, with example questions &darr;</a></p>
  <p style="color:var(--muted);font-size:.95rem">It reads OHNY's public lineup live, so cancellations and last-minute changes show up. The guide service processes your requests without keeping a visitor profile; whatever your assistant remembers stays in your own AI account.</p>

  <h2 id="start">Get started</h2>
  <p>Your AI app's model does the talking; the helper service doesn't use an AI model, it only looks up OHNY's data. The model tips below come from our own timed tests in October 2026 and may change as the apps change.</p>
  <div class="tabs" id="tabs">
    <div class="tablist" role="tablist" aria-label="Choose your AI app">
      <button class="tab" role="tab" id="tab-claude" aria-controls="panel-claude" aria-selected="true" type="button">Claude</button>
      <button class="tab" role="tab" id="tab-chatgpt" aria-controls="panel-chatgpt" aria-selected="false" tabindex="-1" type="button">ChatGPT</button>
      <button class="tab" role="tab" id="tab-gemini" aria-controls="panel-gemini" aria-selected="false" tabindex="-1" type="button">Gemini</button>
      <button class="tab" role="tab" id="tab-others" aria-controls="panel-others" aria-selected="false" tabindex="-1" type="button">Others</button>
    </div>

    <section class="card panel" role="tabpanel" id="panel-claude" aria-labelledby="tab-claude">
      <h3>Claude <span class="tag">works on free accounts</span></h3>
      <p>One tap opens Claude's "Add custom connector" box with everything filled in. Check it and confirm. Easiest on a computer; once added it also works in the Claude phone app, by typing and by voice (tested on Android, 2026-10-08).</p>
      <a class="btn" href="${esc(LINKS.claude)}" target="_blank" rel="noopener noreferrer">${CLAUDE_ICON_SVG}Add to Claude</a>
      <p>Then start a chat and say <em>"ohny, what's open near me?"</em> The first time, Claude asks to approve each tool: choose <strong>Always allow</strong>, since none of them change anything.</p>
      <p><strong>Location (phone, optional):</strong> the first time you ask what's open near you, Claude may ask to use your location. Allow it and it won't need to ask where you are. Change it later in Android Settings, Apps, Claude, Permissions, or iPhone Settings, Claude, Location. Not available on Team or Enterprise plans, or on claude.ai and the desktop app: there, name a cross street or landmark.</p>
      <p><strong>Which model?</strong> Sonnet 5.5 (the default) is fine and quick. If it answers from a web search instead of Ask OHNY, or gets the festival date wrong, switch to Opus 5.5: in our tests it used Ask OHNY every time at about the same speed. Avoid Haiku: it's a little faster but mixed up sites and dates. Leave the effort setting as it is.</p>
      <p><strong>Prefer a skill?</strong> <span class="tag">paid plans</span> Download the zip (always the latest release) and add it in Claude under Customize, Skills.</p>
      <a class="btn ghost" href="${esc(LINKS.zip)}" rel="noopener">Download ohny-skill.zip</a>
    </section>

    <section class="card panel" role="tabpanel" id="panel-chatgpt" aria-labelledby="tab-chatgpt" hidden>
      <h3>ChatGPT <span class="tag">directory listing pending</span></h3>
      <p>Until Ask OHNY is approved for ChatGPT's plugin directory, add it yourself once on chatgpt.com in a browser:</p>
      <ol>
        <li>Copy this address:</li>
      </ol>
      <code class="copybox" id="mcp-chatgpt">${esc(LINKS.mcp)}</code>
      <button class="btn ghost" type="button" data-copy="mcp-chatgpt">Copy address</button>
      <ol start="2">
        <li>Open ChatGPT's Plugins page, choose <strong>Add</strong>, then <strong>Add custom MCP server</strong>.</li>
        <li>Name it <strong>Ask OHNY</strong>, paste the address under Connection (Server URL), and set Authentication to <strong>No authentication</strong>.</li>
        <li>Read the warning, tick <strong>I understand and want to continue</strong>, then choose <strong>Create as a plugin</strong>.</li>
      </ol>
      <a class="btn" href="${esc(LINKS.chatgptPlugins)}" target="_blank" rel="noopener noreferrer">Open ChatGPT Plugins</a>
      <p>Then start a chat and say <em>"ohny, what's open near me?"</em> It's read-only and needs no sign-in. We've tested this on chatgpt.com, and in the ChatGPT Android app by typing and by voice (2026-10-08), with the plugin added beforehand on the web. Setting it up from the phone alone hasn't been tested.</p>
      <p><strong>Which model?</strong> Keep thinking effort on Instant. More thinking made a day plan about four times slower (19 s to 78 s) with the same facts, just a little more detail.</p>

      <p><strong>Just trying it?</strong> Paste this into a new chat instead. It works for that chat only and needs access to web pages.</p>
      <code class="copybox" id="paste-chatgpt">${esc(PASTE_LINE)}</code>
      <button class="btn ghost" type="button" data-copy="paste-chatgpt">Copy trial message</button>
    </section>

    <section class="card panel" role="tabpanel" id="panel-gemini" aria-labelledby="tab-gemini" hidden>
      <h3>Gemini <span class="tag">US, 18+</span></h3>
      <p>Add it once on gemini.google.com in a browser (a computer is easiest); it then works in the Gemini phone app too.</p>
      <p><strong>Voice:</strong> in our Android test (2026-10-08) Gemini used Ask OHNY when we typed, but its voice mode can't use custom connected apps. For voice, use Claude or ChatGPT.</p>
      <ol>
        <li>Copy this address:</li>
      </ol>
      <code class="copybox" id="mcp-gemini">${esc(LINKS.mcp)}</code>
      <button class="btn ghost" type="button" data-copy="mcp-gemini">Copy address</button>
      <ol start="2">
        <li>Open Gemini's Connected Apps page, scroll to <strong>Custom apps</strong> and choose <strong>Add a custom app</strong>.</li>
        <li>Paste the address, then confirm. No sign-in is needed.</li>
      </ol>
      <a class="btn" href="${esc(LINKS.geminiApps)}" target="_blank" rel="noopener noreferrer">Open Gemini Connected Apps</a>
      <p>Then start a chat and say <em>"ohny, what's open near me?"</em></p>
      <p><strong>Which model?</strong> Keep 3.8 Flash (the default). 3.1 Pro gave the same answer but took about five minutes instead of under one, and 3.5 Flash-Lite was slower too, not faster.</p>
      <p>Google allows custom apps for people 18 or older in the US, signed in with a personal Google account (not work or school), with Gemini in English and Keep Activity on. Otherwise, paste this into a new chat instead; it works for that chat only and may not reach live information:</p>
      <code class="copybox" id="paste-gemini">${esc(PASTE_LINE)}</code>
      <button class="btn ghost" type="button" data-copy="paste-gemini">Copy</button>
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
  <details class="card sec" open id="m-nearby">
    <summary><h3>1. Find what's open near me</h3></summary>
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
      <li><strong>Tickets you already hold.</strong> Mention them and every suggestion leaves you time to get to your tour, with a "leave by" time. Anything that would make you late is left out (see "If you already have tickets" under Plan).</li>
      <li><strong>Other ticketed tours</strong> show up only while one is under way, and it says a ticket is needed. Sold-out and canceled places are never offered as new ideas.</li>
    </ul>
    <p>It also tells you what it <em>left out and why</em> ("eleven places have closed for the day, two are tours that aren't running"), so a short list isn't a mystery.</p>
  </details>

  <details class="card sec" open id="m-site">
    <summary><h3>2. Ask about a specific place</h3></summary>
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
  </details>

  <details class="card sec" open id="m-plan">
    <summary><h3>3. Plan your day or the whole weekend</h3></summary>
    <p>It asks a few questions, one at a time, then offers two or three different plans for you to choose from and adjust.</p>
    <p class="says">Try saying</p>
    <ul class="eg">
      <li>"Plan my Saturday in Brooklyn."</li>
      <li>"We have four hours Sunday afternoon with a six-year-old. What should we do?"</li>
      <li>"I already have tickets for 2 PM at the Refinery. Build a day around that."</li>
      <li>"We have a 4 PM tour at the Morgan Library on Saturday. What can we fit in before it?"</li>
      <li>"I have tickets for the Vertical Tour at St. John the Divine on Saturday afternoon. Plan my Saturday around it."</li>
      <li>"We're running late. Change the plan."</li>
    </ul>
    <p class="says">What it takes into account</p>
    <ul class="uses">
      <li><strong>Which days and how many hours,</strong> and when you start and finish.</li>
      <li><strong>Interests, boroughs and places you already want to see.</strong></li>
      <li><strong>Who's coming:</strong> group size, kids' ages, wheelchair or limited-stairs needs.</li>
      <li><strong>How you'll get around</strong> and how far you'll walk.</li>
      <li><strong>Tickets you already hold.</strong> These are fixed, not suggestions: the plan is built around them first, and everything else fits in the gaps. See "If you already have tickets" below.</li>
      <li><strong>Whether you have a Passport,</strong> which lets you go ahead of the line at free sites. It budgets longer waits at popular free sites if you don't, and puts the most popular ones first thing or late.</li>
      <li><strong>Real visit windows only.</strong> It never plans an arrival in the last 20 minutes of opening hours or after a tour's start time, and leaves buffers between stops (more for ticketed tours).</li>
      <li><strong>Geography.</strong> Stops are grouped by neighborhood to avoid zig-zagging across boroughs.</li>
      <li><strong>Entry rules</strong> that clash with your group, such as age limits, bags with strollers, stairs or no photography.</li>
      <li><strong>Last-minute changes.</strong> It checks for cancellations before presenting a plan and again before each leg.</li>
      <li><strong>Lunch or dinner</strong> for longer plans, near your stops, if you want it.</li>
    </ul>
    <p>Before it shows you a plan it checks the whole thing: tour times that really exist, free sites open when you'd arrive, hops that can be made. Once you choose, you get a followable itinerary: a checklist page where your assistant can show one, or a guided walk-through, one stop at a time, in a voice chat.</p>
    <p class="says">If you already have tickets</p>
    <ul class="uses">
      <li><strong>Tell it which site, the date and start time, and how many of you.</strong> You can mention them at any point, in a plan or in a quick "what's near me" question.</li>
      <li><strong>It asks for the address or meeting point on your ticket.</strong> OHNY doesn't publish street addresses for ticketed sites, so without it, travel times are only rough.</li>
      <li><strong>It plans around your ticket in one step.</strong> Tell it the site (the name is enough), the time and where you start, and it confirms the session, then suggests what fits before and after, when to leave, and the order, already checked.</li>
      <li><strong>It checks the ticket against OHNY's schedule.</strong> If the time you gave doesn't match a real session, or the site has been canceled, it tells you first, shows the listed times and asks to see your ticket before planning around it.</li>
      <li><strong>Your tour is an immovable block.</strong> The plan keeps the whole session, has you arrive 15 minutes early, and never puts two things in the same slot.</li>
      <li><strong>It tells you when to leave</strong> for each ticket ("to be at the tour by 3:45, leave here by 2:57"), and shows how long you have at each stop before you need to head off.</li>
      <li><strong>It never suggests something that would make you late.</strong> Places that don't fit are left out and it tells you why.</li>
      <li><strong>"Sold Out" doesn't apply to you.</strong> That mark only means nobody else can buy tickets; it won't drop your tour or offer you alternatives to it.</li>
      <li><strong>It reminds you of the entry rules</strong> at that stop (photo ID, bags, arriving early), and when you ask for directions it starts from the address on your ticket.</li>
    </ul>
  </details>

  <details class="card sec" open id="m-directions">
    <summary><h3>4. Get directions</h3></summary>
    <p class="says">Try saying</p>
    <ul class="eg">
      <li>"How do I get to the next stop?"</li>
      <li>"Directions to the Tenement Museum by subway."</li>
      <li>"Walking directions from here."</li>
    </ul>
    <p class="says">What it takes into account</p>
    <ul class="uses">
      <li>It gives you a tappable link that opens Google Maps or Apple Maps, with a one-sentence summary. Transit is the default in New York; say "walking" or "bike" to change it.</li>
      <li>If you're heading to a place you hold a ticket for, it uses the address or meeting point from your ticket and puts your leave-by time first.</li>
      <li>It won't quote subway routes from memory, since weekend service changes make those unreliable. The maps link has the current ones.</li>
      <li>For a site where the exact address isn't published until you have a ticket, it says the location is approximate.</li>
    </ul>
  </details>

  <details class="card sec" open id="m-checkin">
    <summary><h3>5. Check in at a site <span class="tag">link only for now</span></h3></summary>
    <p>OHNY asks every visitor to check in at each site before going in. In this version your assistant can't do the check-in for you, but it puts OHNY's own form link right in the chat so it's one tap.</p>
    <p class="says">Try saying</p>
    <ul class="eg">
      <li>"Check me in."</li>
      <li>"Check us in at the Morgan Library."</li>
    </ul>
    <p class="says">What happens now</p>
    <ul class="uses">
      <li><strong>No questions first.</strong> It doesn't ask for your email, zip code or group size, and doesn't read you a waiver. It just tells you it can't check you in itself and gives you the link.</li>
      <li><strong>You complete the form.</strong> In OHNY's form you pick the site, enter your zip code and how many people, and can add an email if you like. The form shows OHNY's photo and risk notice, which you accept by submitting. There is no name field.</li>
      <li><strong>Your details go straight to OHNY.</strong> The assistant never sees or keeps them.</li>
      <li>It will never say you're checked in, because only you can submit the form.</li>
    </ul>
    <details class="off" open>
      <summary>Temporarily switched off: check-in by your assistant <span class="tag">not available yet</span></summary>
      <p><strong>Not available in this version.</strong> Checking you in from the chat is planned for a future version, most likely after this festival. Until then, use the form link above. Here is how it was designed to work:</p>
      <ul class="uses">
        <li><strong>The first time,</strong> it would ask whether you want to leave an email or stay anonymous (both fine), plus your zip or postal code and group size. It would never ask for your name; the form has no name field.</li>
        <li><strong>Which site.</strong> You'd name it, or it would work it out from where you are, and confirm with you.</li>
        <li><strong>The form's notice.</strong> It would read you the photo and risk waiver in plain words and wait for a clear "yes" before going further.</li>
        <li><strong>The newsletter box</strong> would be left alone unless you asked to join OHNY's mailing list.</li>
        <li><strong>At the next site</strong> it would reuse what you'd said you wanted remembered and only confirm the group size ("still three of you?").</li>
      </ul>
    </details>
  </details>

  <details class="card sec" open id="m-festival">
    <summary><h3>6. Questions about the festival itself</h3></summary>
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
  </details>

  <details class="card sec" open id="m-changes">
    <summary><h3>7. Anything new or canceled?</h3></summary>
    <p class="says">Try saying</p>
    <ul class="eg">
      <li>"Any cancellations or changes?"</li>
      <li>"Is anything new on the lineup since last week?"</li>
    </ul>
    <p>It lists cancellations, new sites and changed times from ohny.org. It checks this on its own before it finalizes a plan.</p>
  </details>

  <details class="card sec" open id="m-memory">
    <summary><h3>What it remembers (and doesn't)</h3></summary>
    <ul class="uses" style="margin-top:6px">
      <li>Only what you tell it and agree to keep: your interests, group size, kids' ages, accessibility needs, how you like to get around, whether you hold a Passport, tickets you already have, and the places you've visited.</li>
      <li>It's kept in your own AI account, not by the people who made this guide. Ask <em>"what do you know about me?"</em> to see it all, or say <em>"forget it"</em> to delete it.</li>
      <li>It doesn't collect or keep check-in details such as your email or zip code; those go only into OHNY's form.</li>
    </ul>
  </details>

  <details class="sec-h" open id="m-trouble">
  <summary><h2>Troubleshooting</h2></summary>
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
    <p>On the phone, allow location for the Claude app (Android: Settings, Apps, Claude, Permissions; iPhone: Settings, Claude, Location). Claude's location sharing isn't available on Team or Enterprise plans, or on claude.ai and the desktop app. Or just say a cross street, a landmark or the place you've just been, for example "I'm outside Washington Square Park".</p>
  </details>
  <details>
    <summary>A place was closed, full or different from what it told you</summary>
    <p>Sorry about that. Sites can change things at the last minute, and busy places can run out of room, so it can't guarantee entry or wait times. Tell it what happened and ask for "what else is near here?". For anything official, contact OHNY at <a href="mailto:info@ohny.org">info@ohny.org</a> or see ohny.org.</p>
  </details>
  <details>
    <summary>It's not working in ChatGPT or Gemini</summary>
    <p>In ChatGPT, check that Ask OHNY appears under Plugins on chatgpt.com, and start your message with "ohny". You can also try the one-chat message under <a href="#chatgpt" data-tab="chatgpt">ChatGPT</a> if your account can open web pages. In Gemini, check that Ask OHNY is switched on under Connected Apps (Custom apps) on gemini.google.com, and start your message with "ohny". If the guide or live information cannot be read, a pasted trial can't confirm what is open now.</p>
  </details>
  <details>
    <summary>It said something wrong, or something else isn't working</summary>
    <p>Please tell your assistant what happened so it can try again, and check the official page for the place. You can also report problems on the project's <a href="${esc(LINKS.github)}/issues" target="_blank" rel="noopener noreferrer">GitHub page</a>.</p>
  </details>
  </details>
  </section>

  <footer>
    Made by <a href="${esc(LINKS.site)}" target="_blank" rel="noopener noreferrer">Dmitry Naidionov</a> &middot;
    <a href="${esc(LINKS.github)}" target="_blank" rel="noopener noreferrer">Source on GitHub</a> (MIT) &middot;
    <a href="?format=json">For developers</a>
    <br>The Open House New York name and logo belong to OHNY and are shown for identification only; this project is not affiliated with OHNY. Claude is a trademark of Anthropic.
  </footer>
</main>
</div>
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
  var navd = document.getElementById('navd'), wide = window.matchMedia('(min-width:920px)');
  function syncNav() { navd.open = wide.matches; }
  syncNav();
  if (wide.addEventListener) wide.addEventListener('change', syncNav);
  navd.addEventListener('click', function (e) { if (!wide.matches && e.target.closest('a')) navd.open = false; });
  document.addEventListener('click', function (e) { if (!wide.matches && navd.open && !e.target.closest('.pagenav')) navd.open = false; });
  var navLinks = Array.prototype.slice.call(navd.querySelectorAll('a'));
  var navTargets = navLinks.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  var curLabel = navd.querySelector('.cur');
  var ticking = false;
  function markActive() {
    ticking = false;
    var cur = 0, line = wide.matches ? 120 : 140;
    navTargets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top <= line) cur = i; });
    navLinks.forEach(function (a, i) { if (i === cur) a.className = 'on'; else a.removeAttribute('class'); });
    curLabel.textContent = navLinks[cur].textContent;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(markActive); } }, { passive: true });
  markActive();
  function openTarget(id) {
    var el = id && document.getElementById(id);
    for (; el; el = el.parentElement) if (el.tagName === 'DETAILS') el.open = true;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#m-"]');
    if (a) openTarget(a.getAttribute('href').slice(1));
  });
  window.addEventListener('hashchange', function () { openTarget(location.hash.slice(1)); });
  openTarget(location.hash.slice(1));
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
