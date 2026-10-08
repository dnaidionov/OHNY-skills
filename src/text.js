import { nyWallClock, fmtTime } from './core/time.js';

// format=text: short plain lines for page readers that summarise what they fetch (Google Opal's Get Webpage is a
// nested model call). Exact times, slugs and New York time are spelled out so a summary can't easily lose or bend them.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function nyTime(iso) {
  if (!iso) return 'unknown time';
  const wall = nyWallClock(new Date(iso));                  // YYYY-MM-DDTHH:MM
  const [d, t] = wall.split('T');
  const [, mo, day] = d.split('-').map(Number);
  const [h, m] = t.split(':').map(Number);
  return `${fmtTime(h * 60 + m)} ${MONTHS[mo - 1]} ${day}, New York time`;
}

const header = (title, b) => [
  `${title} (unofficial helper, not affiliated with OHNY). ${b.live ? 'Live from ohny.org' : 'SAVED COPY, not live'}, as of ${nyTime(b.as_of)}.`,
  ...(b.warning ? [`WARNING: ${b.warning}`] : []),
  ...(b.now?.source === 'override' ? [`Pretend time: ${b.now.new_york_time.replace('T', ' ')} New York time.`] : []),
];

const siteLine = (r, i) => [
  `${i + 1}. ${r.name} (${r.slug})`,
  r.walk_min != null ? `${r.walk_min} min walk${r.distance_approx ? ' (rough)' : ''}` : null,
  r.status,
  r.leave_by ? `leave there by ${r.leave_by}` : null,
  r.fits_interests?.length ? `fits: ${r.fits_interests.join(', ')}` : null,
  r.heads_up?.length ? `heads-up: ${r.heads_up.join('; ')}` : null,
  r.group_notes?.length ? `note: ${r.group_notes.join('; ')}` : null,
  r.ticket_required ? (r.sold_out ? 'ticket needed, SOLD OUT' : 'ticket needed') : null,
  r.maps?.google_transit ? `directions: ${r.maps.google_transit}` : null,
].filter(Boolean).join(' | ');

const ticketLines = (t) => {
  const when = t.session?.from ? `${t.session.date} ${t.session.from}-${t.session.to}` : t.session?.starts ?? '';
  const lines = [`YOUR TICKET: ${t.name ?? t.slug} (${t.slug}) | ${when} | ${t.ticket_ok ? 'session confirmed' : 'NOT CONFIRMED'}`];
  for (const i of t.issues ?? []) lines.push(`- ${i.severity === 'blocking' ? 'PROBLEM' : 'NOTE'}: ${i.message}`);
  if (t.leave_by && t.ticket_ok) lines.push(`LEAVE BY: ${t.leave_by} (${t.travel_min_from_here} min ${t.travel_mode} from your start${t.location_approximate ? ', location approximate: ask for the address on the ticket' : ''})`);
  return lines;
};

const skippedLines = (b) => (b.skipped?.length ? ['LEFT OUT:', ...b.skipped.slice(0, 4).map((s) => `- ${s.name} (${s.slug}): ${s.why}`)] : []);

export function planText(b) {
  const lines = [...header('OHNY day plan', b)];
  for (const l of b.ticket_lookups ?? []) lines.push(`Found "${l.asked}" as ${l.found}.`);
  for (const t of b.tickets ?? []) lines.push(...ticketLines(t));
  if (!b.ok) {
    lines.push(b.tickets?.length ? 'NO PLAN MADE: fix the ticket details above first (ask the visitor to check the ticket).' : 'NO PLAN MADE: no ticket given.');
    return `${lines.join('\n')}\n`;
  }
  lines.push('BEFORE YOUR TICKET (from your start):', ...(b.before.length ? b.before.map(siteLine) : ['- Nothing open fits before it.']));
  lines.push('AFTER YOUR TICKET (from that site, when it ends):', ...(b.after.length ? b.after.map(siteLine) : ['- Nothing open nearby after it.']));
  lines.push(`SUGGESTED ORDER: ${b.itinerary.map((s) => `${s.at} ${s.name}${s.kind === 'your ticket' ? ' (your ticket)' : ''}`).join(' -> ')}`);
  lines.push(`CHECK: ${b.check.summary}`);
  for (const s of b.check.stops ?? []) for (const i of s.issues ?? []) lines.push(`- ${i.severity === 'blocking' ? 'PROBLEM' : 'NOTE'} at ${s.name ?? s.slug}: ${i.message}`);
  return `${lines.join('\n')}\n`;
}

export function nearbyText(b) {
  const lines = [...header('OHNY nearby', b)];
  for (const t of b.your_tickets ?? []) lines.push(...ticketLines(t));
  lines.push(...(b.results.length ? b.results.map(siteLine) : ['No matching place is open when you would arrive.']));
  if (b.in_range_breakdown) lines.push(`IN RANGE: ${b.in_range_total} places; ${Object.entries(b.in_range_breakdown).map(([k, v]) => `${k.replace(/_/g, ' ')} ${v}`).join(', ')}.`);
  lines.push(...skippedLines(b));
  if (b.has_more) lines.push('More results: call again with offset.');
  return `${lines.join('\n')}\n`;
}

export function searchText(b) {
  const lines = [...header('OHNY search', b)];
  if (b.no_match) {
    lines.push(`NO MATCH: no site by that name is in OHNY's lineup (all ${b.searched_sites} checked).`);
    if (b.partial_matches?.length) lines.push('Weaker partial matches (ideas only):', ...b.partial_matches.map((r, i) => `${i + 1}. ${r.name} (${r.slug})`));
  } else {
    lines.push(...b.results.map((r, i) => `${siteLine(r, i)}${r.address ? ` | ${r.address}` : ''}${r.next ? ` | next: ${r.next.date} ${r.next.from}` : ''}`));
  }
  return `${lines.join('\n')}\n`;
}

export function changesText(b) {
  const c = b.changes;
  const g = b.groups;
  const lines = [...header('OHNY changes', b), `CANCELED NOW: ${b.canceled_now.length}${b.canceled_now.length ? '' : ' (nothing is canceled)'}`];
  for (const x of b.canceled_now) lines.push(`- ${x.name} (${x.slug})${x.days.length ? `: ${x.days.join(', ')}` : ''}${x.removed ? ', removed from the lineup' : ''}`);
  lines.push('CHANGED SINCE THE SAVED COPY, by kind:');
  const section = (title, list, fmt) => { if (list.length) lines.push(`${title} (${list.length}):`, ...list.map(fmt)); };
  section('NEW SITES', c.added, (s) => `- ${s.name} (${s.slug})`);
  section('NEWLY SOLD OUT', g.newly_sold_out, (s) => `- ${s.name} (${s.slug})`);
  section('BACK ON SALE', g.back_on_sale, (s) => `- ${s.name} (${s.slug})`);
  section('TIMES CHANGED', g.times_changed, (s) => `- ${s.name} (${s.slug}): ${s.changes.filter((x) => x.field === 'times').map((x) => `${x.from} -> ${x.to}`).join('; ')}`);
  section('OTHER UPDATES', g.other_updates, (s) => `- ${s.name} (${s.slug}): ${s.changes.filter((x) => x.field !== 'times' && !/sold out|cancel/i.test(`${x.from} ${x.to}`)).map((x) => `${x.field} ${x.from} -> ${x.to}`).join('; ')}`);
  if (!c.added.length && !c.modified.length && !c.removed.length) lines.push('Nothing else changed.');
  lines.push(b.note);
  return `${lines.join('\n')}\n`;
}
