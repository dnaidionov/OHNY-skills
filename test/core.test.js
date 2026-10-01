import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDateLabel, parseTime, fmtTime, parseNow, wallMinutes, nyWallClock } from '../src/core/time.js';
import { normalizeRecord } from '../src/core/normalize.js';
import { statusAt, statusLine } from '../src/core/status.js';
import { nearby } from '../src/core/search.js';
import { mergeLive } from '../src/core/lineup.js';
import { interpretInterests } from '../src/core/tags.js';
import { policyFlags } from '../src/core/policy.js';

const at = (d, hhmm) => { const [h, m] = hhmm.split(':').map(Number); return wallMinutes(d, h * 60 + m); };

test('date and time parsing, including messy upstream values', () => {
  assert.equal(parseDateLabel('Sat, Oct 17'), '2026-10-17');
  assert.equal(parseDateLabel('Fri, Oct 16'), '2026-10-16');
  assert.equal(parseDateLabel('nonsense'), null);
  assert.equal(parseTime('1:00 PM'), 780);
  assert.equal(parseTime('9:00PM'), 1260);
  assert.equal(parseTime('9:00 PM '), 1260);
  assert.equal(parseTime('12:00 AM'), 0);
  assert.equal(parseTime('12:30 PM'), 750);
  assert.equal(parseTime('25:00 PM'), null);
  assert.equal(fmtTime(780), '1:00 PM');
  assert.equal(fmtTime(0), '12:00 AM');
});

test('now override: wall clock is taken as New York time; instants are converted', () => {
  assert.equal(parseNow('2026-10-17 14:30').wall, '2026-10-17T14:30');
  assert.equal(parseNow('2026-10-17T18:30:00Z').wall, '2026-10-17T14:30'); // EDT = UTC-4
  assert.equal(parseNow('garbage'), null);
  assert.match(nyWallClock(new Date('2026-10-17T18:30:00Z')), /^2026-10-17T14:30$/);
});

const dropIn = (over = {}) => normalizeRecord({
  record_id: 'recA', slug: 'a-26', experience_name: 'Alpha Hall', access_type: ['Drop-In'], borough: 'Manhattan', neighborhood: 'SoHo',
  address_1: '1 Main St', city: 'New York', state: 'NY', zip: '10012',
  saturday_open_access_date: 'Sat, Oct 17', sat_opening_time: '10:00 AM', sat_closing_time: '5:00 PM',
  short_description: 'A rooftop garden with skyline views.', ...over,
});
const ticketed = (over = {}) => normalizeRecord({
  record_id: 'recB', slug: 'b-26', experience_name: 'Beta Tower', access_type: ['Ticketed'], borough: 'Manhattan', neighborhood: 'Midtown',
  ticketed_session_day_1_date: 'Sat, Oct 17', ticketed_session_start_time_1: '1:00 PM', ticketed_session_end_time_1: '2:00 PM',
  ticketed_session_day_2_date: 'Sat, Oct 17', ticketed_session_start_time_2: '3:00 PM', ticketed_session_end_time_2: '4:00 PM',
  ticketed_session_url_1: 'tickets.example/b1', ...over,
});

test('drop-in: open, closing soon, closed, later', () => {
  const s = dropIn();
  assert.equal(statusAt(s, at('2026-10-17', '12:00')).state, 'open_now');
  const soon = statusAt(s, at('2026-10-17', '16:30'));
  assert.equal(soon.closing_soon, true);
  assert.equal(soon.closes_in_min, 30);
  assert.match(statusLine(soon), /closing in 30 min/);
  assert.equal(statusAt(s, at('2026-10-17', '17:00')).state, 'done');          // end is exclusive
  assert.equal(statusAt(s, at('2026-10-17', '08:00')).state, 'later_today');
  assert.equal(statusAt(s, at('2026-10-17', '09:30')).state, 'starts_soon');
  assert.equal(statusAt(s, at('2026-10-16', '12:00')).state, 'later');
});

test('ticketed: only in-progress sessions count as open; sold out and canceled are flagged', () => {
  const t = ticketed();
  assert.equal(statusAt(t, at('2026-10-17', '13:30')).open_now, true);
  assert.equal(statusAt(t, at('2026-10-17', '14:30')).open_now, false);
  assert.equal(statusAt(t, at('2026-10-17', '14:30')).next.from, '3:00 PM');
  assert.equal(statusAt(t, at('2026-10-17', '13:30')).ticket_required, true);
  assert.equal(statusAt(ticketed({ access_type: ['Sold Out'] }), at('2026-10-17', '13:30')).sold_out, true);
  assert.equal(statusAt(ticketed({ access_type: ['Canceled'] }), at('2026-10-17', '13:30')).state, 'canceled');
});

test('nearby: open now, nearest first, interests filter, paging, excludes canceled/sold out', () => {
  const geo = (lat, lng) => ({ lat, lng, conf: 'address' });
  const sites = [
    { ...dropIn({ slug: 'far', experience_name: 'Far Park', short_description: 'A quiet garden.' }), geo: geo(40.80, -73.95) },
    { ...dropIn({ slug: 'near', experience_name: 'Near Roof', short_description: 'Rooftop views.' }), geo: geo(40.7301, -73.9951) },
    { ...dropIn({ slug: 'closed', sat_closing_time: '11:00 AM', short_description: 'Rooftop views.' }), geo: geo(40.7302, -73.9952) },
    { ...dropIn({ slug: 'cx', access_type: ['Canceled'], short_description: 'Rooftop views.' }), geo: geo(40.7303, -73.9953) },
    { ...ticketed({ slug: 'tix', short_description: 'Rooftop views.' }), geo: geo(40.7305, -73.9955) },
    { ...ticketed({ slug: 'sold', access_type: ['Sold Out'], short_description: 'Rooftop views.' }), geo: geo(40.7306, -73.9956) },
  ];
  const here = { lat: 40.7295, lng: -73.9965, nowAbs: at('2026-10-17', '13:30') };
  const all = nearby(sites, { ...here, limit: 10 });
  assert.deepEqual(all.results.map((r) => r.slug), ['near', 'tix', 'far']);
  assert.equal(all.results[1].ticket_required, true);

  const rooftops = nearby(sites, { ...here, interests: 'rooftops', limit: 10 });
  assert.deepEqual(rooftops.results.map((r) => r.slug), ['near', 'tix']);

  const page = nearby(sites, { ...here, limit: 1, offset: 1 });
  assert.equal(page.results[0].slug, 'tix');
  assert.equal(page.has_more, true);

  assert.deepEqual(nearby(sites, { ...here, includeTicketed: false, limit: 10 }).results.map((r) => r.slug), ['near', 'far']);
  assert.equal(nearby(sites, { ...here, limit: 10, closingSoonMin: 600 }).results[0].closing_soon, true);
});

test('interest phrases map to tags', () => {
  const i = interpretInterests('old churches, rooftops and kids stuff');
  assert.ok(i.tags.includes('sacred') && i.tags.includes('views') && i.tags.includes('kids'));
});

test('mergeLive: live status/hours win; cancellations, new and removed sites are reported', () => {
  const snap = [dropIn(), ticketed()].map((s) => ({ ...s, geo: { lat: 40.7, lng: -74, conf: 'address' }, description: 'Long text' }));
  snap[1].windows[0].url = 'https://tickets.example/b1';
  const live = [
    { record_id: 'recA', slug: 'a-26', experience_name: 'Alpha Hall', access_type: ['Canceled'], borough: 'Manhattan', neighborhood: 'SoHo' },
    { record_id: 'recB', slug: 'b-26', experience_name: 'Beta Tower', access_type: ['Ticketed'], borough: 'Manhattan', neighborhood: 'Midtown',
      ticketed_session_day_1_date: 'Sat, Oct 17', ticketed_session_start_time_1: '1:00 PM', ticketed_session_end_time_1: '2:30 PM' },
    { record_id: 'recC', slug: 'c-26', experience_name: 'Gamma', access_type: ['Drop-In'] },
  ];
  const { sites, changes } = mergeLive(snap, live);
  const bySlug = Object.fromEntries(sites.map((s) => [s.slug, s]));
  assert.deepEqual(bySlug['a-26'].access, ['Canceled']);
  assert.equal(bySlug['a-26'].description, 'Long text');            // static data kept
  assert.equal(bySlug['b-26'].windows.length, 1);                   // second session dropped upstream
  assert.equal(bySlug['b-26'].windows[0].end, 870);                 // new end time
  assert.equal(changes.added[0].slug, 'c-26');
  assert.ok(changes.modified.find((m) => m.slug === 'a-26').changes.some((c) => c.field === 'status'));
  assert.ok(changes.modified.find((m) => m.slug === 'b-26').changes.some((c) => c.field === 'times'));

  const { sites: s2, changes: c2 } = mergeLive(snap, live.slice(0, 1));
  assert.equal(c2.removed[0].slug, 'b-26');
  assert.deepEqual(s2.find((s) => s.slug === 'b-26').access, ['Canceled']);
});

test('walking-time search: within N minutes, and open when you ARRIVE (not just now)', () => {
  const geo = (lat, lng) => ({ lat, lng, conf: 'address' });
  // ~1 km north of "here" is about 16 walking minutes; ~0.5 km is about 8.
  const here = { lat: 40.7300, lng: -73.9950 };
  const at500m = geo(40.7345, -73.9950), at1km = geo(40.7390, -73.9950);
  const sites = [
    { ...dropIn({ slug: 'close' }), geo: at500m },
    { ...dropIn({ slug: 'far' }), geo: at1km },
    // closes at 1:40 PM; we ask at 1:30 and it is ~8 min away -> only ~2 min left on arrival
    { ...dropIn({ slug: 'closing', sat_closing_time: '1:40 PM' }), geo: at500m },
    // opens 1:35 PM; ask at 1:30, 8 min walk -> open when we arrive
    { ...dropIn({ slug: 'opens', sat_opening_time: '1:35 PM' }), geo: at500m },
  ];
  const nowAbs = at('2026-10-17', '13:30');
  const all = nearby(sites, { ...here, nowAbs, limit: 10 });
  assert.deepEqual(all.results.map((r) => r.slug).sort(), ['close', 'far', 'opens']);
  assert.equal(all.skipped_total, 1);
  assert.equal(all.skipped[0].slug, 'closing');
  assert.equal(all.skipped[0].reason, 'little_time_left');
  assert.match(all.skipped[0].why, /only 2 minutes left before it closes at 1:40 PM/);

  const within10 = nearby(sites, { ...here, nowAbs, limit: 10, maxWalkMin: 10 });
  assert.deepEqual(within10.results.map((r) => r.slug).sort(), ['close', 'opens']);
  assert.ok(within10.results.every((r) => r.walk_min <= 10));

  const within15 = nearby(sites, { ...here, nowAbs, limit: 10, maxWalkMin: 20 });
  assert.ok(within15.results.some((r) => r.slug === 'far'));

  // Old behaviour still available
  const naive = nearby(sites, { ...here, nowAbs, limit: 10, arrivalAware: false, minRemainingMin: 0 });
  assert.ok(naive.results.some((r) => r.slug === 'closing') && !naive.results.some((r) => r.slug === 'opens'));
});

test('skipped list names each place and explains why (closed by arrival vs. too little time)', () => {
  const g = { lat: 40.7345, lng: -73.9950, conf: 'address' };           // ~8 min walk from `here`
  const here = { lat: 40.7300, lng: -73.9950 };
  const sites = [
    { ...dropIn({ slug: 'gone', experience_name: 'Gone By Then', sat_closing_time: '1:36 PM' }), geo: g },
    { ...ticketed({ slug: 'tour', experience_name: 'Tour Ending', ticketed_session_end_time_1: '1:34 PM' }), geo: g },
  ];
  const r = nearby(sites, { ...here, nowAbs: at('2026-10-17', '13:30'), limit: 10 });
  assert.equal(r.results.length, 0);
  const by = Object.fromEntries(r.skipped.map((x) => [x.slug, x]));
  assert.equal(by.gone.reason, 'closes_before_arrival');
  assert.match(by.gone.why, /It closes at 1:36 PM, and it's a \d+-minute walk/);
  assert.match(by.tour.why, /The tour ends at 1:34 PM/);
  assert.equal(by.gone.name, 'Gone By Then');
});

test("OHNY's own nearby picks for a reference site come first", () => {
  const g = (lat) => ({ lat, lng: -73.995, conf: 'address' });
  const sites = [
    { ...dropIn({ slug: 'closest' }), geo: g(40.7301) },
    { ...dropIn({ slug: 'pick' }), geo: g(40.7340) },
  ];
  const r = nearby(sites, { lat: 40.73, lng: -73.995, nowAbs: at('2026-10-17', '12:00'), limit: 5, suggested: ['pick'] });
  assert.deepEqual(r.results.map((c) => c.slug), ['pick', 'closest']);
  assert.equal(r.results[0].ohny_suggests, true);
  assert.equal(r.results[1].ohny_suggests, undefined);
});

test('heads-up flags come from access notes and age limits', () => {
  const s = dropIn({ access_notes: 'Visitors must show valid photo ID. Large bags are not permitted. No photography inside. Closed-toe shoes required. Includes stairs.', age_restrictions: '16+' });
  const f = policyFlags(s, 10);
  assert.ok(f.includes('Age: 16+') && f.includes('Photo ID needed') && f.includes('Bag limits'));
  assert.ok(f.includes('Photography rules') && f.includes('Footwear rules') && f.includes('Stairs or uneven ground'));
  assert.deepEqual(policyFlags(dropIn({ age_restrictions: 'All ages' })), []);
});

test('ranking blends interests, distance and OHNY suggestions: a strong match beats a mere suggestion', () => {
  const g = (lat) => ({ lat, lng: -73.995, conf: 'address' });
  const sites = [
    { ...dropIn({ slug: 'pick-offtopic', short_description: 'A quiet accounting office.' }), geo: g(40.7305) },        // OHNY suggests, not the visitor's taste
    { ...dropIn({ slug: 'pick-fits', short_description: 'A rooftop with skyline views.' }), geo: g(40.7320) },         // suggested AND matches
    { ...dropIn({ slug: 'best-match', short_description: 'Rooftop terrace with skyline views and a penthouse.' }), geo: g(40.7330) },
    { ...dropIn({ slug: 'meh', short_description: 'A rooftop.' }), geo: g(40.7360) },
  ];
  const base = { lat: 40.73, lng: -73.995, nowAbs: at('2026-10-17', '12:00'), limit: 10, interests: 'rooftops', suggested: ['pick-offtopic', 'pick-fits'], maxWalkMin: 20 };
  const r = nearby(sites, base);
  assert.equal(r.results[0].slug, 'pick-fits');                                   // fits + suggested + close
  assert.ok(r.results.findIndex((c) => c.slug === 'best-match') < r.results.findIndex((c) => c.slug === 'meh'));
  assert.ok(!r.results.some((c) => c.slug === 'pick-offtopic'));                   // not their taste -> not recommended...
  assert.equal(r.ohny_suggests_but_not_your_interests[0].slug, 'pick-offtopic');   // ...but we say OHNY suggested it
  assert.ok(r.results[0].fits_interests.includes('views'));

  const lax = nearby(sites, { ...base, interestsMode: 'prefer' });
  assert.ok(lax.results.some((c) => c.slug === 'pick-offtopic'));                  // prefer mode keeps it, ranked lower
  assert.ok(lax.results.findIndex((c) => c.slug === 'pick-offtopic') > 0);
});

test('group needs: child age and wheelchair use filter, and are explained', () => {
  const g = { lat: 40.7305, lng: -73.995, conf: 'address' };
  const sites = [
    { ...dropIn({ slug: 'adults', age_restrictions: 'Ages 18+' }), geo: g },
    { ...dropIn({ slug: 'rec12', age_restrictions: 'Ages 12+ recommended' }), geo: g },
    { ...dropIn({ slug: 'steps', wheelchair_accessibility: ['Not wheelchair accessible'] }), geo: g },
    { ...dropIn({ slug: 'partial', wheelchair_accessibility: ['Partially wheelchair accessible'] }), geo: g },
    { ...dropIn({ slug: 'fam', family_activities: 'Scavenger hunt for kids' }), geo: g },
  ];
  const r = nearby(sites, { lat: 40.73, lng: -73.995, nowAbs: at('2026-10-17', '12:00'), limit: 10, childAge: 7, wheelchair: true });
  const slugs = r.results.map((c) => c.slug);
  assert.ok(!slugs.includes('adults') && !slugs.includes('steps'));
  assert.ok(slugs.includes('rec12') && slugs.includes('partial'));                 // soft limits stay, with a note
  assert.deepEqual(r.results.find((c) => c.slug === 'rec12').group_notes, ['Recommended for ages 12+']);
  assert.deepEqual(r.results.find((c) => c.slug === 'partial').group_notes, ['Only partly wheelchair accessible']);
  assert.equal(slugs[0], 'fam');                                                    // kid-friendly boosted
  const by = Object.fromEntries(r.skipped.map((x) => [x.slug, x]));
  assert.equal(by.adults.reason, 'not_suitable');
  assert.match(by.adults.why, /ages 18\+.*youngest is 7/);
  assert.match(by.steps.why, /not wheelchair accessible/);
});
