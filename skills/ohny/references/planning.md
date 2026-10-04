# Planning a day or the weekend

Festival days: **Fri Oct 16, Sat Oct 17, Sun Oct 18, 2026.** Most free sites are open Saturday and Sunday; Friday has fewer. Ticketed tours run in fixed time slots.

## 1. Interview (one question at a time, skip what you already know)

Ask, in roughly this order, and remember the answers:
1. Which day(s)? How many hours do they have, and when do they start and finish?
2. Interests (architecture, history, art, rooftops and views, gardens, sacred spaces, industry, kids' activities...).
3. Boroughs or neighborhoods they prefer, and any specific places they already want to see.
4. Who's coming: party size, kids (ages), anyone with accessibility needs (wheelchair, limited stairs, seating).
5. Getting around: walking, subway/bus, bike, car or taxi. Typical limit on walking (e.g., "no more than 15 minutes").
6. Priorities: tickets they already hold (which site, which time), "must-do" vs. "nice-to-have", pace (relaxed or packed).
7. **Do they have a Passport?** (Passport holders get priority entry ahead of the line at the free drop-in sites, which matters most at popular ones.) Skip the question if you already know. If they don't have one and the plan leans on popular free sites, mention the Passport once, in a line, with ohny.org/festival/passport; never push it.
8. Food: if the plan is longer than four hours, ask about budget and cuisine/dietary needs (see §4).

## 2. Build the options

Pull candidates from `search`, `nearby` and `site/<slug>`. Always work from fresh data: call `changes` before presenting a plan, and drop anything `canceled`, and anything `sold_out` **unless the visitor already holds a ticket for it** (a Sold Out mark only means nobody can buy more).

**Tickets they already hold (do this first)**
1. Collect each one: site, the session's date and start time, party size. Ask for the exact address or meeting point on the ticket (ticketed sites publish none).
2. Check each against OHNY with `nearby ... fixed=<slug>@<YYYY-MM-DDTHH:MM>` (or the plan checker): `ticket_ok: false` means the time doesn't match a real session or the site is canceled. Tell them first, show the listed times, and ask to see the ticket before planning around it.
3. Place the ticketed sessions on the timeline as **immovable blocks**: arrive 15 minutes early, and keep the whole session. Fill the gaps around them: use `nearby` with `fixed=` so every suggestion leaves time to get there (it reports `time_before_your_ticket_min` and `leave_by`), and give the visitor a **leave-by time for each ticket**.
4. A "Sold Out" mark never applies to someone who holds a ticket. Never drop such a tour, and never "offer alternatives" to it.
5. Never put two things in the same time slot, and never schedule something that would make them late for a ticket.

**Rules of thumb**
- Only schedule a site inside one of its **real visit windows** (`windows` in the site result; for drop-in sites use opening hours, for ticketed ones a listed tour start). Never plan arrival in the last 20 minutes of a drop-in window, or after a tour's start time.
- **Travel time** between stops: use the platform's maps tool if available (with the traffic or transit schedule for that time of day); otherwise use `walk_min` from the service for walkable hops and an estimate for subway or car. Add a **10-15 minute buffer** per hop (and 20+ for ticketed tours: arrive early, there's often a check-in or ID check). Say when a leg is tight.
- **Ticketed sites:** say clearly which stops need a ticket and whether it's still available: *sold out* (marked by OHNY), *has sessions listed* (give the ticket link, and add "availability is confirmed on the ticket page"), or *no times left*. **Tickets they already hold are hard constraints: anchor the plan around them first** (see below).
- **Distance:** cluster stops by neighborhood; avoid zig-zagging between boroughs. Cross-borough hops cost 30-60 minutes.
- **Opening hours and lines:** put the most popular free sites **first thing** (at opening) or late, when lines are shorter. Passport holders can skip the line; others should expect a wait, so add 30-45 minutes at popular free sites.
- **Pace:** 60-90 minutes per stop including travel for a relaxed day; 45-60 for a packed one. Four to six stops is a full day.
- **Entry rules:** read each candidate's `access_notes` (via `site/<slug>`) before putting it in a plan. Drop or warn about anything that conflicts with the group: age limits, bag limits with strollers or backpacks, stairs, no photography, ID needed, closed-toe shoes. Carry the relevant rules into that stop's note in the itinerary ("Bring photo ID, arrive 15 min early").
- **Use the same preferences everywhere:** pass `interests`, `child_age` and `wheelchair=true` to every `nearby` call while planning.
- **OHNY's own pairings:** each site lists nearby places OHNY suggests (`related_sites`, or `nearby?near=<slug>` where results carry `ohny_suggests`). Prefer them when clustering stops: they're usually good walking pairs and often complement each other.
- **Accessibility and kids:** use `accessibility`, `wheelchair`, `age` and `family` from each site. Exclude what doesn't fit; flag partial access ("partly wheelchair accessible: check the notes").
- **Weather:** if the forecast is rainy, favor indoor sites and mention it.

**Estimating popularity** (be honest it's a guess; say "likely busy", never "will be"):
- A site OHNY marks **Sold Out**, or has few or short tour slots, is in demand.
- Past years' press repeatedly highlighted: ConEd East River Generating Station, The Refinery at Domino (penthouse and terrace), the Yankee Ferry, the Digester Eggs, and the Jefferson Market Courthouse library. Check whether they're in this year's lineup before mentioning them.
- Skyscraper rooftops and observation floors, private residences, and rarely-open industrial or infrastructure sites tend to draw lines. Quiet neighborhood sites, small churches and galleries usually don't.
- Tickets for the most sought-after tours go in minutes when released; if tickets haven't been grabbed yet, tell them to act quickly.

## 3. Offer 2 or 3 options

Give each a name and a one-line character ("Rooftops and skyline: busy, three stops, one ticket needed" / "Quiet downtown history: relaxed, five free stops"). Keep it brief enough to hear. Ask what to change. Iterate until they pick one.

## 4. Meals (for plans longer than ~4 hours)

Offer a stop around 12-2 PM (lunch) and/or 6-8 PM, placed **near the surrounding stops**. Ask budget (`$`, `$$`, `$$$`) and tastes if you haven't. Suggest **two or three real places** using the platform's maps/places tool if available, else web search. Give name, distance from the previous stop and why. Note opening hours and whether to reserve. Don't recommend anywhere you can't verify exists and is open.

## 5. Save and deliver the itinerary

**Before you present the plan, validate it with `/v1/plan/check` (tool `ohny_check_plan`)** (list the stops in time order as `slug@YYYY-MM-DDTHH:MM`, pass tickets in `held`, and the exact ticket coordinates when you have them). Fix every *blocking* problem first (a tour time that doesn't exist, a free site that's closed when they arrive, a hop that can't be made, a ticket held for a canceled site). Warnings (a tight hop, a long leg to confirm in a maps app, a ticket address still needed) go into the stop's note in a few words.

Once they choose, save the plan to the platform's memory (stops, times, tickets, party size, mode) and present a **followable itinerary**:

- **If the platform can show a web page or artifact:** build a single self-contained page from `assets/itinerary-template.html`: a numbered list of stops with time, address, travel leg, ticket link, a "Directions" link, a "Done" checkbox and an "Ask about this" and "Change" button (these send a message back to chat). Fill the `ITINERARY` JSON block only; don't redesign the page. If it's a presentation tool, one slide per stop works the same way.
- **Otherwise (voice or plain chat):** run it as a guided walk-through. Give one stop at a time: where, when, how to get there, one fun fact. Say "Tell me when you're done and I'll bring up the next stop." Keep a running list of what's been checked off; "what's left?" reads it back.

Either way, at each stop offer: the check-in link (see `checkin.md`), "tell me about this place", directions to the next stop, or "change the plan". Before each leg, re-check the next stop with `site/<slug>` so a last-minute cancellation or time change gets caught, and tell them right away.

## 6. Changing the plan on the fly

If they're running late, a site is canceled or closed early, or the line is too long: re-run the options from where they are now (`nearby`, honouring remaining time and tickets), propose the smallest change that keeps their must-dos, and confirm before replacing the saved plan.
