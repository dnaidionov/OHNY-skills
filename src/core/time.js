// All festival times are New York wall-clock times. We compare them as "wall minutes"
// (minutes since 1970-01-01 on a timezone-free calendar), so DST never enters the maths.

export const FESTIVAL = {
  year: 2026,
  tz: 'America/New_York',
  dates: ['2026-10-16', '2026-10-17', '2026-10-18'],
};

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

/** "Sat, Oct 17" -> "2026-10-17" (null if unparseable) */
export function parseDateLabel(label, year = FESTIVAL.year) {
  const m = /([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2})\s*$/.exec(String(label ?? '').trim());
  if (!m) return null;
  const mon = MONTHS[m[1].toLowerCase()];
  if (!mon) return null;
  return `${year}-${String(mon).padStart(2, '0')}-${String(Number(m[2])).padStart(2, '0')}`;
}

/** "1:00 PM" / "9:00PM " -> minutes after midnight (null if unparseable) */
export function parseTime(label) {
  const m = /^\s*(\d{1,2}):(\d{2})\s*([AaPp])\.?[Mm]?\.?\s*$/.exec(String(label ?? ''));
  if (!m) return null;
  const h = Number(m[1]);
  if (h < 1 || h > 12) return null;
  return (h % 12) * 60 + Number(m[2]) + (m[3].toLowerCase() === 'p' ? 720 : 0);
}

/** minutes after midnight -> "1:00 PM" */
export function fmtTime(min) {
  const m = ((min % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  return `${((h24 + 11) % 12) + 1}:${mm} ${h24 >= 12 ? 'PM' : 'AM'}`;
}

/** ("2026-10-17", 780) -> absolute wall minutes */
export function wallMinutes(dateStr, minutes) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, mo - 1, d) / 60000 + minutes;
}

/** absolute wall minutes -> { date: "2026-10-17", minutes: 780 } */
export function fromWallMinutes(abs) {
  const dayMs = Math.floor(abs / 1440) * 1440 * 60000;
  return { date: new Date(dayMs).toISOString().slice(0, 10), minutes: abs - Math.floor(abs / 1440) * 1440 };
}

/** Current New York wall clock as "YYYY-MM-DDTHH:MM". */
export function nyWallClock(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: FESTIVAL.tz, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    }).formatToParts(date).map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/**
 * Parse a tester-supplied "now". Accepts wall-clock "2026-10-17T14:30" / "2026-10-17 14:30"
 * (interpreted as New York time) or a full ISO instant with Z/offset (converted to New York).
 * Returns { wall: "YYYY-MM-DDTHH:MM", abs } or null.
 */
export function parseNow(input) {
  if (!input) return null;
  const s = String(input).trim().replace(' ', 'T');
  let wall;
  if (/(Z|[+-]\d{2}:?\d{2})$/.test(s)) {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return null;
    wall = nyWallClock(d);
  } else {
    const m = /^(\d{4}-\d{2}-\d{2})T(\d{1,2}):(\d{2})/.exec(s);
    if (!m) return null;
    wall = `${m[1]}T${m[2].padStart(2, '0')}:${m[3]}`;
  }
  return { wall, abs: wallToAbs(wall) };
}

export function wallToAbs(wall) {
  const [date, time] = wall.split('T');
  const [h, m] = time.split(':').map(Number);
  return wallMinutes(date, h * 60 + m);
}

export function isFestivalDay(dateStr) {
  return FESTIVAL.dates.includes(dateStr);
}

/** Resolve "now": explicit override, else real clock. */
export function resolveNow(overrideInput, realDate = new Date()) {
  const o = parseNow(overrideInput);
  if (overrideInput && !o) throw new Error(`Could not read now="${overrideInput}". Use e.g. 2026-10-17T14:30 (New York time).`);
  if (o) return { ...o, source: 'override' };
  const wall = nyWallClock(realDate);
  return { wall, abs: wallToAbs(wall), source: 'real' };
}
