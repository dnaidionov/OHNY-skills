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

  <h2>Trying it before the festival</h2>
  <p>Before October 16 the assistant will ask what day and time to pretend it is, for example "Saturday 2:30 PM", and you can change it any time.</p>

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
