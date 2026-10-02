# The OHNY helper service

A tiny read-only service (`API_BASE` in SKILL.md). It holds **no visitor data**. It reads OHNY's public lineup live, adds saved descriptions and map positions, and does the "open now / closing soon / nearest first" maths so answers are consistent.

All calls are `GET`, return JSON, and accept `now=YYYY-MM-DDTHH:MM` (New York time) to test as if it were another moment.

Every response has:
- `as_of`: when the lineup was last read from ohny.org. `live`: true if that was just now.
- `warning`: present when it couldn't reach ohny.org and used its saved copy.
- `now`: the time it used, `source` is `real` or `override`, and `during_festival`.

## Calls

| Call | Use |
|---|---|
| `GET {API_BASE}/v1/nearby?lat=&lng=&interests=&limit=3&offset=0` | Closest sites that **will be open when the visitor arrives** (now + walking time) with at least 10 minutes left, filtered by interests, closest first. Also: `max_walk_min` ("within 15 minutes' walk"), `near=<slug>` instead of lat/lng, `radius_km`, `borough`, `include_ticketed=false`, `exclude=slug,slug`, `closing_soon_min` (default 45), `min_time_left_min` (default 10), `child_age` (youngest child), `wheelchair=true`, `interests_mode` (`require` = only matches, default; `prefer` = matches first, others after). Results are ranked by a blend of interest fit, closeness and OHNY's own suggestions. |
| `GET {API_BASE}/v1/search?q=` | Find a site by name, partner, neighborhood or topic. Returns up to 5 cards with live status. |
| `GET {API_BASE}/v1/site/<slug>` | Everything about one site, fetched fresh: description, access notes, accessibility, websites, all visit times with ticket links, status now, maps links, related nearby sites, and `checkin` info, `heads_up`, and `related_sites` (OHNY's own nearby suggestions with walking time and status). |
| `GET {API_BASE}/v1/changes` | What changed on ohny.org since the saved copy: new, removed, status changes, new times. Use for "anything new?" and before finalising a plan. |
| `GET {API_BASE}/v1/meta` | Freshness and counts. |

### Reading a result card

- `state`: `open_now`, `starts_soon`, `later_today`, `later`, `done`, `canceled`.
- `status`: a ready-to-say line ("Open until 5:00 PM (closing in 30 min)").
- `ticket_required`, `sold_out`: ticketed tours need a ticket; `sold_out` means OHNY marks it sold out (the ticket page is the final word).
- `walk_min`, `distance_km` (`distance_approx` true when the exact address isn't public), `time_left_on_arrival_min` and `closing_soon` (both measured from the moment they'd arrive, not from now).
- `skipped` (with `skipped_total`) on a `nearby` reply: the places that are open now but were left out, each with `name`, `walk_min` and a ready-made `why` ("It closes at 4:55 PM, and it's a 13-minute walk, so it will be over by the time you get there" or "You'd get there with only 6 minutes left..."). Always tell the visitor which ones and why.
- `ohny_suggests`: only when you pass `near=<slug>`; OHNY itself lists this place as worth a visit near that site. It adds to the ranking but doesn't override interests or distance. `ohny_suggests_but_not_your_interests` lists suggestions that were left out because they don't match the visitor's interests.
- `fits_interests`: which of the visitor's interests the place matches. `kid_friendly`: has family activities or is aimed at kids. `group_notes`: soft caveats for this group (recommended age, only partly wheelchair accessible). Places with a firm age limit or no wheelchair access come back in `skipped` with the reason.
- `heads_up`: short hints from the site's access notes and age limit ("Photo ID needed", "Bag limits", "Age: 16+"...). `has_access_notes` means the full text is available from `site/<slug>` (`access_notes`).
- `next.ticket_url`: the page to buy/confirm a ticket for that tour.
- `maps`: `google_transit`, `google_walking`, `apple`, `destination`.

### Needing coordinates for the visitor's position

The service doesn't geocode. Use the phone's location if the platform shares it. Otherwise take a cross street or landmark, look up its coordinates with the platform's map tool or a search, then call `nearby`. If you can't, use `near=<slug>` of the last place they were, or ask which neighborhood.

## If the service is down

Follow "When the helper can't be reached" in the main guide: backup address first, then the offline tool or the saved lineup lists, then OHNY's own per-site files (`https://ohny.org/data/<id>.json`, small and always current; avoid the 400 KB `festival.json` unless you can process it with code), and finally say plainly that you can't see live information. Never guess hours, status or tickets.

## Never

Do not send visitor names, emails, zip codes or party sizes to this service. It has no use for them.
