import { parseDateLabel, parseTime } from './time.js';
import { deriveTags } from './tags.js';

const DAYS = [
  ['fri', 'friday_open_access_date', 'fri_opening_time', 'fri_closing_time'],
  ['sat', 'saturday_open_access_date', 'sat_opening_time', 'sat_closing_time'],
  ['sun', 'sunday_open_access_date', 'sun_opening_time', 'sun_closing_time'],
];

const arr = (v) => (Array.isArray(v) ? v : v == null || v === '' ? [] : [v]);
const str = (v) => (v == null ? undefined : String(v).trim() || undefined);

export function cleanUrl(u) {
  const s = str(u);
  if (!s) return undefined;
  return /^https?:\/\//i.test(s) ? s : `https://${s.replace(/^\/+/, '')}`;
}

/** Visit windows: drop-in opening hours and ticketed sessions. */
export function buildWindows(r) {
  const out = [];
  for (const [, dKey, oKey, cKey] of DAYS) {
    const date = parseDateLabel(r[dKey]);
    const start = parseTime(r[oKey]);
    const end = parseTime(r[cKey]);
    if (date && start != null && end != null) out.push({ kind: 'open', date, start, end: end <= start ? end + 1440 : end });
  }
  for (let i = 1; i <= 8; i++) {
    const date = parseDateLabel(r[`ticketed_session_day_${i}_date`]);
    const start = parseTime(r[`ticketed_session_start_time_${i}`]);
    const end = parseTime(r[`ticketed_session_end_time_${i}`]);
    if (date && start != null) {
      const w = { kind: 'session', date, start, end: end == null ? start + 60 : end <= start ? end + 1440 : end };
      const url = cleanUrl(r[`ticketed_session_url_${i}`]);
      if (url) w.url = url;
      out.push(w);
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);
}

/**
 * Works for both festival.json records (lightweight) and /data/<id>.json `.data` (full).
 * Fields a source doesn't have are simply left undefined.
 */
export function normalizeRecord(r, id) {
  const address = r.address_1
    ? { line1: str(r.address_1), note: str(r.address_2), city: str(r.city), state: str(r.state), zip: str(r.zip) }
    : undefined;
  const site = {
    id: id ?? r.record_id,
    slug: r.slug,
    name: str(r.experience_name),
    partner: str(r.partner_name),
    borough: str(r.borough),
    neighborhood: str(r.neighborhood),
    state: str(r.state),
    address,
    access: arr(r.access_type),
    windows: buildWindows(r),
    description: str(r.description),
    short: str(r.short_description),
    websites: [
      [r.primary_website_link_title, r.primary_website],
      [r.additional_website_link_title, r.additional_website],
    ].filter(([, u]) => str(u)).map(([t, u]) => ({ title: str(t), url: cleanUrl(u) })),
    social: [1, 2, 3].map((i) => [r[`social_media_handle_type_${i}`], r[`social_media_handle_name_${i}`]])
      .filter(([, n]) => str(n)).map(([t, n]) => ({ type: str(t), handle: str(n) })),
    access_notes: str(r.access_notes),
    accessibility: arr(r.accessibility),
    wheelchair: arr(r.wheelchair_accessibility),
    age: str(r.age_restrictions),
    family: str(r.family_activities),
    special: str(r.special_activities),
    duration: str(r.duration_of_program),
    series: arr(r.series),
    series_description: str(r.series_description),
    related: typeof r.whats_nearby_related_sites_text === 'string'
      ? r.whats_nearby_related_sites_text.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined,
    new_site: r.new_returning_location === 'New' ? true : undefined,
    photo: str(r.featured_photo),
  };
  site.tags = deriveTags(site);
  return site;
}

/** Stable text signature of what visitors care about, to diff snapshot vs live. */
export function windowSig(w) {
  return `${w.kind}|${w.date}|${w.start}-${w.end}`;
}
