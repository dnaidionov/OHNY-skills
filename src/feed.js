import { fmtTime } from './core/time.js';
import { isCanceled } from './core/status.js';

// Plain-markdown rendering of the lineup for chatbots that can only read public web pages (Gemini grounding).
// Data only: no visitor input, and no "open now" (the page can't know the visitor's time) - the Gem works that out.

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dayLabel = (date) => {
  const [y, m, d] = date.split('-').map(Number);
  return `${DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${m}/${d}`;
};
const coord = (v) => (typeof v === 'number' ? v.toFixed(4) : '');
const cell = (v) => String(v ?? '').replace(/\|/g, '/').replace(/\s+/g, ' ').trim();

function header(title, lineup) {
  const status = lineup.live
    ? `**Live from ohny.org**, as of ${lineup.asOf}.`
    : `**Saved copy**, as of ${lineup.asOf} (ohny.org could not be reached just now, so last-minute changes may be missing).`;
  return [`# ${title}`, '', status, 'Unofficial guide, not affiliated with Open House New York. Times are New York time.', ''];
}

function times(site) {
  const byDay = new Map();
  for (const w of site.windows ?? []) {
    if (!byDay.has(w.date)) byDay.set(w.date, { open: [], tours: [] });
    const day = byDay.get(w.date);
    if (w.kind === 'session') day.tours.push(fmtTime(w.start));
    else day.open.push(`${fmtTime(w.start)}-${fmtTime(w.end)}`);
  }
  return [...byDay].sort(([a], [b]) => a.localeCompare(b)).map(([date, { open, tours }]) =>
    `${dayLabel(date)} ${[open.join(', '), tours.length ? `tours ${tours.join(', ')}` : ''].filter(Boolean).join('; ')}`).join('; ');
}

export function renderIndex(lineup) {
  const sites = lineup.sites.filter((s) => !s.removed || isCanceled(s));
  const canceled = sites.filter(isCanceled);
  const out = header('OHNY Weekend 2026: all sites', lineup);
  if (canceled.length) {
    out.push('## Canceled (do not recommend)', '', ...canceled.map((s) => `- ${s.name} (${s.slug})`), '');
  }
  out.push('## Sites', '', '| Slug | Name | Neighborhood | Borough | Lat | Lng | Access | Times |', '|---|---|---|---|---|---|---|---|');
  for (const s of sites) {
    const access = isCanceled(s) ? 'CANCELED' : (s.access ?? []).join(', ');
    out.push(`| ${[s.slug, s.name, s.neighborhood, s.borough, coord(s.geo?.lat), coord(s.geo?.lng), access, isCanceled(s) ? '' : times(s)].map(cell).join(' | ')} |`);
  }
  return `${out.join('\n')}\n`;
}

export function renderChanges(lineup) {
  const { added, removed, modified } = lineup.changes;
  const out = header('OHNY Weekend 2026: what changed', lineup);
  if (!added.length && !removed.length && !modified.length) {
    out.push('No changes since the saved copy was made.');
  }
  if (removed.length) out.push('## Removed or canceled', '', ...removed.map((s) => `- ${s.name} (${s.slug})`), '');
  if (modified.length) {
    out.push('## Changed', '', ...modified.map((s) => `- ${s.name} (${s.slug}): ${s.changes.map((c) => `${c.field}: ${c.from} -> ${c.to}`).join('; ')}`), '');
  }
  if (added.length) out.push('## New', '', ...added.map((s) => `- ${s.name} (${s.slug})`), '');
  return `${out.join('\n')}\n`;
}
