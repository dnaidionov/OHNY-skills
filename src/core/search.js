import { statusAt, statusLine, isCanceled } from './status.js';
import { haversineKm, walkMinutes, mapsLinks } from './geo.js';
import { interpretInterests } from './tags.js';
import { policyFlags } from './policy.js';

const clip = (s, n) => (s && s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** Compact, voice-friendly view of a site. */
export function card(site, st, extra = {}) {
  const a = site.address;
  return {
    slug: site.slug,
    name: site.name,
    where: [site.neighborhood, site.borough].filter(Boolean).join(', '),
    address: a?.line1 ? [a.line1, a.zip].filter(Boolean).join(' ') : undefined,
    address_note: a?.line1 ? undefined : site.access?.some((x) => /ticket/i.test(x)) ? 'Exact address is given with the ticket' : undefined,
    access: site.access,
    ticket_required: st.ticket_required,
    sold_out: st.sold_out || undefined,
    state: st.state,
    status: statusLine(st),
    closing_soon: st.closing_soon || undefined,
    closes_in_min: st.state === 'open_now' ? st.closes_in_min : undefined,
    next: st.next && { date: st.next.date, from: st.next.from, to: st.next.to, kind: st.next.kind, ticket_url: st.next.url },
    official_record: site.id ? `https://ohny.org/data/${site.id}.json` : undefined,
    summary: clip(site.short ?? site.description, 220),
    heads_up: policyFlags(site).length ? policyFlags(site) : undefined,
    has_access_notes: site.access_notes ? true : undefined,
    tags: site.tags,
    ...extra,
  };
}

function interestScore(site, interest) {
  if (!interest.tags.length && !interest.words.length) return 0;
  const tagHits = interest.tags.filter((t) => site.tags?.includes(t)).length;
  const hay = `${site.name} ${site.short ?? ''} ${site.description ?? ''} ${site.partner ?? ''}`.toLowerCase();
  const wordHits = interest.words.filter((w) => hay.includes(w)).length;
  return tagHits * 3 + wordHits;
}

/** Walking minutes -> straight-line km (inverse of walkMinutes). */
export const kmForWalkMinutes = (min) => (min / 60) * 4.8 / 1.3;

/** "Ages 12+" -> { min: 12, firm: true }; "Ages 12+ recommended" -> firm: false; "All ages" -> null */
export function ageLimit(site) {
  const m = /(\d+)\s*\+/.exec(site.age ?? '');
  return m ? { min: Number(m[1]), firm: !/recommend/i.test(site.age) } : null;
}

/** Can this group go? Hard "no" only for firm limits and sites marked not wheelchair accessible. */
export function suitability(site, { childAge, wheelchair }) {
  const flags = [];
  const lim = ageLimit(site);
  if (childAge != null && lim && childAge < lim.min) {
    if (lim.firm) return { ok: false, why: `It's for ${site.age?.replace(/^Ages /, 'ages ')}, and your youngest is ${childAge}.` };
    flags.push(`Recommended for ages ${lim.min}+`);
  }
  if (wheelchair) {
    const w = site.wheelchair ?? [];
    if (w.includes('Not wheelchair accessible')) return { ok: false, why: "OHNY lists it as not wheelchair accessible." };
    if (w.includes('Partially wheelchair accessible')) flags.push('Only partly wheelchair accessible');
  }
  return { ok: true, flags };
}

const kidFriendly = (site) => Boolean(site.family) || (site.tags ?? []).includes('kids');

/**
 * Sites that will be open WHEN THE VISITOR ARRIVES (now + walking time), with enough time left to be
 * worth the trip, suitable for the group, ranked by a blend of:
 *   - how well they match the visitor's interests,
 *   - how close they are,
 *   - whether OHNY itself suggests them as nearby (only with `suggested`, i.e. near=<site>),
 *   - being kid-friendly, when there's a child in the group.
 * interestsMode "require" (default) leaves out non-matches; "prefer" keeps them, ranked lower.
 * Ticketed sites appear only if a tour is in progress on arrival (flagged ticket_required) and not sold out.
 */
export function nearby(sites, o) {
  const {
    lat, lng, interests, nowAbs, limit = 3, offset = 0, radiusKm, maxWalkMin, includeTicketed = true,
    includeSoldOut = false, closingSoonMin, borough, exclude = [], minRemainingMin = 10, arrivalAware = true,
    suggested = [], childAge, wheelchair = false, interestsMode = 'require',
  } = o;
  const interest = interpretInterests(interests);
  const hasInterests = interest.tags.length > 0 || interest.words.length > 0;
  const here = { lat, lng };
  const stOpts = closingSoonMin ? { closingSoonMin } : {};
  const maxKm = Math.min(radiusKm ?? Infinity, maxWalkMin ? kmForWalkMinutes(maxWalkMin) : Infinity);
  const refKm = Number.isFinite(maxKm) ? maxKm : 2;
  const suggestedSet = new Set(suggested);

  let unlocated = 0;
  let inRange = 0;
  const tally = {};
  const bump = (k) => { tally[k] = (tally[k] ?? 0) + 1; };
  const rows = [];
  const skipped = [];
  const suggestedButOffInterest = [];
  for (const site of sites) {
    if (exclude.includes(site.slug) || isCanceled(site)) continue;
    if (borough && site.borough?.toLowerCase() !== borough.toLowerCase()) continue;
    if (!site.geo) { unlocated++; continue; }
    const km = haversineKm(here, site.geo);
    if (km > maxKm) continue;
    inRange++;
    const walk = walkMinutes(km);
    const score = interestScore(site, interest);
    const offInterest = hasInterests && score === 0;
    if (offInterest && interestsMode === 'require' && !suggestedSet.has(site.slug)) { bump('not_your_interests'); continue; }

    const stNow = statusAt(site, nowAbs, stOpts);
    const st = arrivalAware ? statusAt(site, nowAbs + walk, stOpts) : stNow;
    if (st.sold_out && !includeSoldOut) { bump('sold_out'); continue; }
    if (st.ticket_required && !includeTicketed) { bump('ticketed_tour_not_included'); continue; }
    const kind = (stNow.current ?? st.current)?.kind === 'session' ? 'tour' : 'site';
    if (st.state !== 'open_now') {
      bump(stNow.state === 'open_now' ? 'closes_before_you_arrive'
        : st.state === 'starts_soon' || st.state === 'later_today' ? 'opens_later_today'
        : st.state === 'later' ? 'opens_another_day' : 'no_more_times');
      if (stNow.state === 'open_now') {
        skipped.push({ site, km, walk, reason: 'closes_before_arrival', why:
          `${kind === 'tour' ? 'The tour ends' : 'It closes'} at ${stNow.current.to}, and it's a ${walk}-minute walk, so it will be over by the time you get there.` });
      }
      continue;
    }
    if (st.closes_in_min < minRemainingMin) {
      bump('too_little_time_left');
      skipped.push({ site, km, walk, reason: 'little_time_left', why:
        `You'd get there with only ${st.closes_in_min} minute${st.closes_in_min === 1 ? '' : 's'} left before ${kind === 'tour' ? 'the tour ends' : 'it closes'} at ${st.current.to}.` });
      continue;
    }
    const fit = suitability(site, { childAge, wheelchair });
    if (!fit.ok) { bump('not_suitable_for_your_group'); skipped.push({ site, km, walk, reason: 'not_suitable', why: fit.why }); continue; }

    if (offInterest && interestsMode === 'require') {       // OHNY suggests it, but it isn't what they like
      bump('not_your_interests');
      suggestedButOffInterest.push({ slug: site.slug, name: site.name, walk_min: walk });
      continue;
    }

    bump('open_on_arrival');
    const sug = suggestedSet.has(site.slug);
    const match = Math.min(score, 6) / 6;
    const prox = 1 - Math.min(km / refKm, 1);
    const kid = childAge != null && kidFriendly(site) ? 1 : 0;
    const rank = hasInterests
      ? 0.45 * match + 0.35 * prox + 0.2 * Number(sug) + 0.1 * kid
      : 0.75 * prox + 0.25 * Number(sug) + 0.1 * kid;
    rows.push({ site, st, km, walk, rank, sug, fit, score, kid });
  }
  rows.sort((a, b) => b.rank - a.rank || a.km - b.km);
  skipped.sort((a, b) => a.km - b.km);
  const page = rows.slice(offset, offset + limit).map(({ site, st, km, walk, sug, fit, kid }) => card(site, st, {
    ohny_suggests: sug || undefined,
    fits_interests: hasInterests ? interest.tags.filter((t) => site.tags?.includes(t)) : undefined,
    kid_friendly: kid ? true : undefined,
    group_notes: fit.flags?.length ? fit.flags : undefined,
    distance_km: Math.round(km * 10) / 10,
    walk_min: walk,
    time_left_on_arrival_min: st.closes_in_min,
    distance_approx: site.geo.conf !== 'address' ? true : undefined,
    maps: mapsLinks(site),
  }));
  return {
    total: rows.length, offset, has_more: offset + limit < rows.length, unlocated,
    in_range_total: inRange,
    in_range_breakdown: tally,
    search: {
      max_walk_min: maxWalkMin, arrival_aware: arrivalAware, min_time_left_min: minRemainingMin,
      interests: hasInterests ? { tags: interest.tags, mode: interestsMode } : undefined,
      child_age: childAge, wheelchair: wheelchair || undefined,
    },
    skipped_total: skipped.length || undefined,
    skipped: skipped.length ? skipped.slice(0, 8).map(({ site, walk, reason, why }) => ({ slug: site.slug, name: site.name, walk_min: walk, reason, why })) : undefined,
    ohny_suggests_but_not_your_interests: suggestedButOffInterest.length ? suggestedButOffInterest.slice(0, 5) : undefined,
    results: page,
  };
}

const STOPWORDS = new Set(['the', 'of', 'at', 'and', 'in', 'on', 'an', 'to', 'for', 'with']);

/**
 * Free-text lookup by name / partner / neighborhood / topic. Every word must match somewhere, so a name
 * that isn't in the lineup comes back as an explicit no_match (with weaker partial matches kept separate)
 * instead of a pile of loosely related sites.
 */
export function search(sites, { q, nowAbs, limit = 5 }) {
  const terms = String(q ?? '').toLowerCase().split(/[^a-z0-9&'-]+/).filter((t) => t.length > 1 && !STOPWORDS.has(t));
  if (!terms.length) return { total: 0, results: [] };
  const all = [];
  const some = [];
  for (const site of sites) {
    const name = (site.name ?? '').toLowerCase();
    const hay = `${site.partner ?? ''} ${site.neighborhood ?? ''} ${site.borough ?? ''} ${(site.series ?? []).join(' ')} ${site.short ?? ''} ${site.description ?? ''}`.toLowerCase();
    let score = 0;
    let matched = 0;
    for (const t of terms) {
      const inName = name.includes(t);
      const inHay = hay.includes(t);
      if (inName) score += 5;
      if (inHay) score += 1;
      if (inName || inHay) matched++;
    }
    if (name === terms.join(' ')) score += 10;
    if (matched === terms.length) all.push({ site, score });
    else if (matched > 0) some.push({ site, score: score + matched });
  }
  const byScore = (a, b) => b.score - a.score;
  all.sort(byScore);
  const view = ({ site }) => card(site, statusAt(site, nowAbs), { maps: mapsLinks(site) });
  if (all.length) return { total: all.length, searched_sites: sites.length, results: all.slice(0, limit).map(view) };
  some.sort(byScore);
  return {
    total: 0,
    searched_sites: sites.length,
    no_match: true,
    message: `No site in OHNY's lineup (all ${sites.length} sites checked) matches all of: ${terms.join(', ')}. `
      + 'Tell the visitor plainly that no site by that name is listed; the name may differ, so offer to search by neighborhood or topic. '
      + 'Do not present the weaker partial matches as the answer.',
    results: [],
    partial_matches: some.slice(0, limit).map(view),
  };
}
