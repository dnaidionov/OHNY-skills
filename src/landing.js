import { OHNY_LOGO_SVG, CLAUDE_ICON_SVG } from './brand.js';

// The human-facing page at naidionov.com/ohny/skills. Self-contained: inline CSS and JS, no third-party requests.

export const LINKS = {
  site: 'https://naidionov.com',
  github: 'https://github.com/dnaidionov/OHNY-skills',
  zip: 'https://github.com/dnaidionov/OHNY-skills/releases/download/v0.2.0/ohny-skill.zip',
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
  .head{display:flex;align-items:center;gap:14px;margin:0 0 10px}
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
  <p class="notice"><strong>Independent project.</strong> Not affiliated with, endorsed by or sponsored by Open House New York. For anything official, see <a href="${esc(LINKS.ohny)}">ohny.org</a>.</p>

  <h2>What it does</h2>
  <ul class="what">
    <li><strong>What's open near me?</strong> Checks hours at the moment you'd arrive, so it won't send you somewhere that closes first.</li>
    <li><strong>Check you in</strong> at a site, reading you the form's notice first.</li>
    <li><strong>Plan your day</strong> around your interests, kids, accessibility, tickets and how you get around.</li>
    <li><strong>Tell you about a place</strong>, with entry rules and a fun fact or two, and help with directions.</li>
  </ul>
  <p style="color:var(--muted);font-size:.95rem">It reads OHNY's public lineup live, so cancellations and last-minute changes show up. The guide service itself stores nothing about you; whatever your assistant remembers stays in your own AI account.</p>

  <h2>Get started</h2>

  <div class="card">
    <h3>Claude <span class="tag">works on free accounts</span></h3>
    <p>One tap opens Claude's "Add custom connector" box with everything filled in. Check it and confirm. Easiest on a computer; once added it also works in the Claude phone app.</p>
    <a class="btn" href="${esc(LINKS.claude)}" rel="noopener">${CLAUDE_ICON_SVG}Add to Claude</a>
    <p>Then start a chat and say <em>"ohny, what's open near me?"</em></p>
  </div>

  <div class="card">
    <h3>Any chatbot that can browse the web</h3>
    <p>Paste this into a new chat. It works for that chat only, with nothing to install.</p>
    <code class="copybox" id="paste">${esc(PASTE_LINE)}</code>
    <button class="btn ghost" type="button" data-copy="paste">Copy</button>
  </div>

  <div class="card">
    <h3>ChatGPT <span class="tag">Plus or higher</span></h3>
    <p>In Settings, Connectors, turn on Developer Mode, choose Create, paste this address and select "No authentication".</p>
    <code class="copybox" id="mcp">${esc(LINKS.mcp)}</code>
    <button class="btn ghost" type="button" data-copy="mcp">Copy address</button>
  </div>

  <div class="card">
    <h3>Claude skill <span class="tag">paid plans</span></h3>
    <p>Prefer a skill? Download the zip and add it in Claude under Customize, Skills.</p>
    <a class="btn ghost" href="${esc(LINKS.zip)}" rel="noopener">Download ohny-skill.zip</a>
  </div>

  <h2>Trying it before the festival</h2>
  <p>Before October 16 the assistant will ask what day and time to pretend it is, for example "Saturday 2:30 PM", and you can change it any time.</p>

  <footer>
    Made by <a href="${esc(LINKS.site)}">Dmitry Naidionov</a> &middot;
    <a href="${esc(LINKS.github)}">Source on GitHub</a> (MIT) &middot;
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
  document.addEventListener('click', function (e) {
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
