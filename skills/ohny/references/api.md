# The OHNY helper service

A tiny read-only service (`API_BASE` in SKILL.md). It holds **no visitor data**. It reads OHNY's public lineup live, adds saved descriptions and map positions, and does the "open now / closing soon / nearest first" maths so answers are consistent.

All calls are `GET`, return JSON, and accept `now=YYYY-MM-DDTHH:MM` (New York time) to test as if it were another moment. `plan/day`, `nearby`, `search` and `changes` also accept `format=text`: short plain lines with exact times, slugs and the as-of time already in New York time, for page readers that summarise what they fetch.

Every response has:
- `as_of`: when the lineup was last read from ohny.org. `live`: true if that was just now.
- `warning`: present when it couldn't reach ohny.org and used its saved copy.
- `now`: the time it used, `source` is `real` or `override`, and `during_festival`.

## Calls

| Call | Use |
|---|---|
| `GET {API_BASE}/v1/nearby?lat=&lng=&interests=&limit=3&offset=0` | Closest sites that **will be open when the visitor arrives** (now + walking time) with at least 10 minutes left, filtered by interests, closest first. Also: `max_walk_min` ("within 15 minutes' walk"), `near=<slug>` instead of lat/lng, `radius_km`, `borough`, `include_ticketed=false`, `exclude=slug,slug`, `closing_soon_min` (default 45), `min_time_left_min` (default 10), `child_age` (youngest child), `wheelchair=true`, `interests_mode` (`require` = only matches, default; `prefer` = matches first, others after). Results are ranked by a blend of interest fit, closeness and OHNY's own suggestions. |
| `GET {API_BASE}/v1/nearby ... &fixed=<slug>@<YYYY-MM-DDTHH:MM>` | **Tickets the visitor already holds.** Several separated by `;`; add `@lat,lng` after the time to use the exact address from the ticket. Suggestions then leave time to reach the ticket; the reply has `your_tickets` (`ticket_ok`, `state`, `leave_by`, `issues`) and each result has `time_before_your_ticket_min` and `leave_by`. Also `mode=walk\|transit\|car` (how they'll get to the ticket; transit and car are rough), `min_stay_min` (default 30), `ticket_buffer_min` (default 15). |
| `GET {API_BASE}/v1/plan/check?stops=<slug>@<YYYY-MM-DDTHH:MM>;...&held=<slug>,...` | **Validate an itinerary.** `stops` in time order: arrival time for a free site, session start for a tour. Per stop it checks: open on arrival, tour session exists at that time, ticket held or sold out, and whether the travel between stops fits (with an arrive-early buffer for tours). Also `mode`, `stay_min` (default 45), `buffer_min` (default 15). Returns `ok`, a one-line `summary`, and `issues` per stop, each *blocking* or *warning*. |
| `GET {API_BASE}/v1/plan/day?ticket=<slug or site name>@<YYYY-MM-DDTHH:MM>&from=<lat>,<lng>` | **Plan a day around tickets the visitor holds, in one call.** Finds each ticketed site by slug or name, confirms the session (if there is none at that time it lists the real times and plans nothing), then suggests places before the first ticket (from `from`, or `near=<slug>`) with `leave_by`, places after the last one (from that site, when it ends), a suggested order and a plan check. Several tickets separated by `;`. Also `interests`, `mode`, `child_age`, `wheelchair=true`, `limit` (default 3), `format=text`. |
| `GET {API_BASE}/v1/search?q=` | Find a site by name, partner, neighborhood or topic. Returns up to 5 cards with live status. |
| `GET {API_BASE}/v1/site/<slug>` | Everything about one site, fetched fresh: description, access notes, accessibility, websites, all visit times with ticket links, status now, maps links, related nearby sites, and `checkin` (OHNY's check-in form link), `heads_up`, and `related_sites` (OHNY's own nearby suggestions with walking time and status). |
| `GET {API_BASE}/v1/changes` | `canceled_now`: every site canceled right now (with its days), then what changed on ohny.org since the saved copy: new, removed, status changes, new times. Use for "anything new or canceled?" and before finalising a plan; answer cancellations from `canceled_now`, not from the diff. |
| `GET {API_BASE}/v1/meta` | Freshness and counts. |

### Reading a result card

- `state`: `open_now`, `starts_soon`, `later_today`, `later`, `done`, `canceled`.
- `status`: a ready-to-say line ("Open until 5:00 PM (closing in 30 min)").
- `ticket_required`, `sold_out`: ticketed tours need a ticket; `sold_out` means OHNY marks it sold out (the ticket page is the final word).
- `walk_min`, `distance_km` (`distance_approx` true when the exact address isn't public), `time_left_on_arrival_min` and `closing_soon` (both measured from the moment they'd arrive, not from now).
- `in_range_total` and `in_range_breakdown` on a `nearby` reply: how many places are within reach at all, and why each one that isn't listed isn't (`open_on_arrival`, `closes_before_you_arrive`, `too_little_time_left`, `opens_later_today`, `opens_another_day`, `no_more_times`, `sold_out`, `not_your_interests`, `not_suitable_for_your_group`, `ticketed_tour_not_included`). Explain it in one sentence so a short or empty list isn't a mystery.
- `official_record`: the exact small OHNY file for the site (`https://ohny.org/data/<id>.json`, always current). Open it to double-check a site directly at OHNY.
- `no_match` / `partial_matches` on a `search` reply: no site matches every word of the query, so no site by that name is in the lineup (all `searched_sites` were checked). Tell the visitor plainly; the partial matches are only ideas.
- `skipped` (with `skipped_total`) on a `nearby` reply: the places that are open now but were left out, each with `name`, `walk_min` and a ready-made `why` ("It closes at 4:55 PM, and it's a 13-minute walk, so it will be over by the time you get there" or "You'd get there with only 6 minutes left..."). Always tell the visitor which ones and why.
- `ohny_suggests`: only when you pass `near=<slug>`; OHNY itself lists this place as worth a visit near that site. It adds to the ranking but doesn't override interests or distance. `ohny_suggests_but_not_your_interests` lists suggestions that were left out because they don't match the visitor's interests.
- `fits_interests`: which of the visitor's interests the place matches. `kid_friendly`: has family activities or is aimed at kids. `group_notes`: soft caveats for this group (recommended age, only partly wheelchair accessible). Places with a firm age limit or no wheelchair access come back in `skipped` with the reason.
- `heads_up`: short hints from the site's access notes and age limit ("Photo ID needed", "Bag limits", "Age: 16+"...). `has_access_notes` means the full text is available from `site/<slug>` (`access_notes`).
- `next.ticket_url`: the page to buy/confirm a ticket for that tour.
- `maps`: `google_transit`, `google_walking`, `apple`, `destination`.

### Held tickets and plan checks

- `your_tickets[].ticket_ok: false`: the time given doesn't match a real OHNY session, the site is canceled, or the slug is wrong (see `issues`). Tell the visitor first.
- `your_tickets[].state`: `upcoming`, `go_now` (the leave-by time has passed), `in_progress`, `later` (another day) or `over`. `leave_by` is when to set off from where they are now; `location_approximate` means the ticket site's exact address isn't known: ask for it.
- A skipped place with `reason: ticket_conflict` would have made them late for the ticket; tell them which and why.
- the plan checker issue codes. *Blocking:* `no_session_at_that_time`, `closed_at_arrival`, `cannot_make_it`, `canceled`, `site_not_found`, `out_of_order`, `sold_out_no_ticket`. *Warning:* `very_tight`, `long_leg_check_maps`, `needs_ticket`, `closes_soon_after_arrival`, `ticket_address_needed`, `in_the_past`. Travel times are estimates; for long hops confirm with a maps app.

### Needing coordinates for the visitor's position

The service doesn't geocode. Use the phone's location if the platform shares it. Otherwise take a cross street or landmark, look up its coordinates with the platform's map tool or a search, then call `nearby`. If you can't, use `near=<slug>` of the last place they were, or ask which neighborhood.

## If the service is down

Follow "When the helper can't be reached" in the main guide: backup address first, then OHNY's own small per-site records (`https://ohny.org/data/<id>.json`, always current), then the saved lineup lists (small area files; open only the one or two near the visitor), and finally say plainly that you can't see live information. Never use the 400 KB `festival.json` to discover places: chat apps cut it off. Never guess hours, status or tickets.

## Never

Do not send visitor names, emails, zip codes or party sizes to this service. It has no use for them.
