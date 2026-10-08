import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { handle, _resetCacheForTests } from '../src/handler.js';
import { _resetEnrichMemoForTests } from '../src/core/enrich.js';
import { normalizeRecord } from '../src/core/normalize.js';
import { REMINDER } from '../src/mcp.js';

// Opal read "19 changed" as "19 sold out" (2026-10-08), and Claude told ticket holders to check sold-out tours.
// The changes reply now counts each kind of change separately and says sell-outs don't affect held tickets.
const rec = (o) => ({ access_type: ['Ticketed'], borough: 'Manhattan', neighborhood: 'SoHo', city: 'New York', state: 'NY',
  ticketed_session_day_1_date: 'Sat, Oct 17', ticketed_session_start_time_1: '2:00 PM', ticketed_session_end_time_1: '3:00 PM', ...o });
const base = [
  rec({ record_id: 'r1', slug: 'sold-26', experience_name: 'Now Sold Tour' }),
  rec({ record_id: 'r2', slug: 'back-26', experience_name: 'Back Again Tour', access_type: ['Sold Out'] }),
  rec({ record_id: 'r3', slug: 'moved-26', experience_name: 'Moved Cottage', access_type: ['Drop-In'], address_1: '1 Old Rd', zip: '10012' }),
  rec({ record_id: 'r4', slug: 'retimed-26', experience_name: 'Retimed Tour' }),
];
const live = [
  { ...base[0], access_type: ['Sold Out'] },
  { ...base[1], access_type: ['Ticketed'] },
  { ...base[2], address_1: '79-1 West Dr' },
  { ...base[3], ticketed_session_start_time_1: '3:00 PM', ticketed_session_end_time_1: '4:00 PM' },
];
const snapshot = { generated_at: '2026-10-01T00:00:00Z', sites: base.map((r) => ({ ...normalizeRecord(r), geo: { lat: 40.73, lng: -73.99, conf: 'address' } })) };
const get = (path) => handle(new Request(`https://x.test${path}`), { snapshot, realNow: new Date('2026-10-08T12:00:00Z'),
  fetchImpl: async (url) => url.endsWith('/festival.json') ? Response.json({ records: live }) : new Response('', { status: 404 }) });

beforeEach(() => { _resetCacheForTests(); _resetEnrichMemoForTests(); });

test('/v1/changes counts each kind of change separately', async () => {
  const b = await (await get('/v1/changes')).json();
  assert.deepEqual(b.summary, { canceled_now: 0, newly_sold_out: 1, back_on_sale: 1, times_changed: 1, other_updates: 1, added: 0, removed: 0 });
  assert.match(b.note, /tickets already held/i);
});

test('format=text groups changes by kind with their own counts, and no misleading overall total', async () => {
  const t = await (await get('/v1/changes?format=text')).text();
  assert.match(t, /NEWLY SOLD OUT \(1\):\n- Now Sold Tour/);
  assert.match(t, /BACK ON SALE \(1\):\n- Back Again Tour/);
  assert.match(t, /TIMES CHANGED \(1\):\n- Retimed Tour/);
  assert.match(t, /OTHER UPDATES \(1\):\n- Moved Cottage \(moved-26\): address/);
  assert.doesNotMatch(t, /\d+ changed\b/);
  assert.match(t, /Sold out doesn't affect tickets already held/);
});

test('every connector reply reminds that sold out never affects a ticket the visitor holds', () => {
  assert.match(REMINDER, /Sold out never affects a ticket they hold/);
  assert.ok(REMINDER.length < 400);
});
