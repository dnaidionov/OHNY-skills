import { normalizeRecord, windowSig } from './normalize.js';
import { fmtTime } from './time.js';
import { isCanceled } from './status.js';

const sameSet = (a = [], b = []) => a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');

/** Carry ticket URLs from the snapshot onto live windows (live festival.json has none). */
function carryUrls(liveWins, snapWins = []) {
  return liveWins.map((w) => {
    if (w.url || w.kind !== 'session') return w;
    const m = snapWins.find((s) => s.kind === 'session' && s.date === w.date && s.start === w.start);
    return m?.url ? { ...w, url: m.url } : w;
  });
}

/**
 * Overlay live festival.json records on the snapshot. Live wins for everything volatile
 * (status, hours, sessions, name, location text); the snapshot supplies descriptions,
 * websites and coordinates.
 */
export function mergeLive(snapSites, liveRecords) {
  const bySlug = new Map(snapSites.map((s) => [s.slug, s]));
  const liveSlugs = new Set();
  const sites = [];
  const changes = { added: [], removed: [], modified: [] };

  for (const rec of liveRecords) {
    const live = normalizeRecord(rec);
    liveSlugs.add(live.slug);
    const snap = bySlug.get(live.slug);
    if (!snap) {
      sites.push({ ...live, is_new: true });
      changes.added.push({ slug: live.slug, name: live.name });
      continue;
    }
    const merged = {
      ...snap,
      name: live.name ?? snap.name,
      borough: live.borough ?? snap.borough,
      neighborhood: live.neighborhood ?? snap.neighborhood,
      access: live.access,
      windows: carryUrls(live.windows, snap.windows),
      address: live.address ?? snap.address,
      accessibility: live.accessibility.length ? live.accessibility : snap.accessibility,
      photo: live.photo ?? snap.photo,
    };
    // Moved? The saved position is for the old address, so don't trust it.
    if (live.address?.line1 && snap.address?.line1 && live.address.line1 !== snap.address.line1) {
      merged.geo = undefined;
      merged.geo_stale = true;
    }
    sites.push(merged);

    const diffs = [];
    if (merged.geo_stale) diffs.push({ field: 'address', from: snap.address.line1, to: live.address.line1 });
    if (!sameSet(snap.access, live.access)) diffs.push({ field: 'status', from: snap.access.join(', '), to: live.access.join(', ') });
    const a = snap.windows.map(windowSig).sort().join(';');
    const b = live.windows.map(windowSig).sort().join(';');
    if (a !== b) diffs.push({ field: 'times', from: describeWins(snap.windows), to: describeWins(live.windows) });
    if (snap.name !== merged.name) diffs.push({ field: 'name', from: snap.name, to: merged.name });
    if (diffs.length) changes.modified.push({ slug: live.slug, name: live.name, changes: diffs });
  }

  for (const s of snapSites) {
    if (!liveSlugs.has(s.slug)) {
      changes.removed.push({ slug: s.slug, name: s.name });
      // No longer in the lineup: treat as canceled so we never send anyone there.
      sites.push({ ...s, access: ['Canceled'], removed: true });
    }
  }
  return { sites, changes };
}

function describeWins(wins) {
  return wins.map((w) => `${w.date} ${fmtTime(w.start)}-${fmtTime(w.end)}${w.kind === 'session' ? ' (tour)' : ''}`).join('; ') || 'none';
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayName = (date) => {
  const [y, m, d] = date.split('-').map(Number);
  return `${WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${MONTHS[m - 1]} ${d}`;
};

/**
 * Every site canceled right now, whether it was canceled before or after the snapshot was taken.
 * The since-snapshot diff alone misses sites that were already canceled when the snapshot was built.
 */
export function canceledNow(sites, changes) {
  const recent = new Set([
    ...changes.removed.map((s) => s.slug),
    ...changes.modified.filter((m) => m.changes.some((c) => c.field === 'status' && /cancel/i.test(c.to))).map((m) => m.slug),
  ]);
  return sites.filter(isCanceled).map((s) => ({
    slug: s.slug,
    name: s.name,
    days: [...new Set((s.windows ?? []).map((w) => w.date))].sort().map(dayName),
    since_snapshot: recent.has(s.slug),
    ...(s.removed ? { removed: true } : {}),
  })).sort((a, b) => a.name.localeCompare(b.name));
}
