import { wallMinutes, fromWallMinutes, fmtTime } from './time.js';

export const DEFAULTS = { closingSoonMin: 45, startingSoonMin: 60 };

const has = (site, v) => (site.access ?? []).some((a) => a.toLowerCase() === v);

export const isCanceled = (site) => has(site, 'canceled') || has(site, 'cancelled');
export const isSoldOut = (site) => has(site, 'sold out');
export const needsTicket = (site) => has(site, 'ticketed') || has(site, 'sold out') || has(site, 'lottery');

const span = (w) => ({ start: wallMinutes(w.date, w.start), end: wallMinutes(w.date, w.end) });

function describeWindow(w) {
  const { start, end } = span(w);
  return { kind: w.kind, date: w.date, from: fmtTime(w.start), to: fmtTime(w.end), startAbs: start, endAbs: end, url: w.url };
}

/**
 * Where does this site stand at wall-clock `nowAbs`?
 * state: canceled | open_now | starts_soon | later_today | later | done
 */
export function statusAt(site, nowAbs, opts = {}) {
  const { closingSoonMin, startingSoonMin } = { ...DEFAULTS, ...opts };
  const base = { ticket_required: needsTicket(site), sold_out: isSoldOut(site) };
  if (isCanceled(site)) return { ...base, state: 'canceled', open_now: false };

  const wins = (site.windows ?? []).map((w) => ({ w, ...span(w) }));
  const current = wins.filter((x) => x.start <= nowAbs && nowAbs < x.end).sort((a, b) => b.end - a.end)[0];
  const upcoming = wins.filter((x) => x.start > nowAbs).sort((a, b) => a.start - b.start);
  const next = upcoming[0];
  const today = fromWallMinutes(nowAbs).date;

  if (current) {
    const closesIn = current.end - nowAbs;
    return {
      ...base, state: 'open_now', open_now: true,
      current: describeWindow(current.w), closes_in_min: closesIn, closing_soon: closesIn <= closingSoonMin,
      next: next ? describeWindow(next.w) : undefined,
    };
  }
  if (next) {
    const startsIn = next.start - nowAbs;
    const state = startsIn <= startingSoonMin ? 'starts_soon' : next.w.date === today ? 'later_today' : 'later';
    return { ...base, state, open_now: false, starts_in_min: startsIn, next: describeWindow(next.w) };
  }
  return { ...base, state: 'done', open_now: false };
}

/** Short human line, written to be read aloud. */
export function statusLine(st) {
  switch (st.state) {
    case 'canceled': return 'Canceled';
    case 'open_now': {
      const what = st.current.kind === 'session' ? 'Tour in progress' : 'Open';
      return `${what} until ${st.current.to}${st.closing_soon ? ` (closing in ${st.closes_in_min} min)` : ''}`;
    }
    case 'starts_soon': return `${st.next.kind === 'session' ? 'Next tour' : 'Opens'} at ${st.next.from} (in ${st.starts_in_min} min)`;
    case 'later_today': return `${st.next.kind === 'session' ? 'Next tour' : 'Opens'} at ${st.next.from} today`;
    case 'later': return `Next: ${st.next.date} ${st.next.from}`;
    default: return 'No more times';
  }
}
