# Phone test for Ask OHNY

Run this on a real phone, in each app (Claude, ChatGPT, Gemini), in a **fresh chat**, once by typing and once by voice. It takes about 10 minutes per app. Open this page on your phone and copy the prompts from the boxes.

Before you start, note: phone model, app name and version, free or paid plan, and how OHNY is set up in that app (Claude connector, or the pasted line).

- **Claude with the connector added:** just paste Test 1. The prompt only opens the web file if the OHNY tools aren't already there.
- **ChatGPT mobile:** first run M1–M3 in [the mobile setup requirements](chatgpt-mobile.md) using only your phone. The finished route must be usable in the native app without pasting the guide into each new chat. No route has passed this yet. You can paste Test 1 as a separate **one-chat trial**, but its automatic web-guide fallback cannot count as successful installation. Record whether installed tools or the fallback answered each scenario.
- **Gemini:** paste Test 1 as is. It attempts to load the instructions from the web file itself.

## Test 0: does the connector work the way a first-time visitor would use it? (Claude with the connector)

Run each in a **brand-new chat** with the OHNY connector switched on. About three minutes in all.

**Why the first check changed:** Claude shows only a one-line summary of a connector until it needs it, then loads the tools on demand ("I'd confirm that by loading the tool details"). So a question that forbids tools can't test the rules: the earlier version of this test failed for that reason, not because anything was wrong. Test the real flow instead.

**0a. Check-in as the very first message** (paste exactly):

```
ohny, check me in
```

- **Pass:** a short reply saying it can't check you in itself, with a **tappable link** to `https://ohny.fillout.com/26weekend`, and **no questions first** (no email, zip or group size, no waiver).
- **Fail:** it asks questions before giving a link, makes up or can't find a link, or claims you're checked in. (If it first says it will look at its tools and then gives the right link, that's a pass.)

**0b. A normal first question:**

```
ohny, I'm at Washington Square Park (40.7308, -73.9973). Pretend it's Saturday October 17, 2026, 2:30 PM. I like history. What's open within 15 minutes' walk?
```

Pass: three places with walking times and closing times, a note about anything left out, and the "unofficial, not affiliated with OHNY" line. If your app shows tool use, `ohny_guide` and/or `ohny_nearby` will appear.

**Control test (non-OHNY chat).** With the connector still switched on, start another new chat and ask something unrelated, for example: *"What's a good cheap lunch near Union Square that's open now?"* Pass: it answers as usual, doesn't call any OHNY tool and doesn't mention Open House New York. Fail: any OHNY tool appears or the answer talks about the festival.

## Test 1: does it work? (paste this)

```
OHNY PHONE TEST. Run these steps one at a time and report honestly. Never guess: if you can't do a step, write CAN'T and say why. For every answer, say HOW you got it: an OHNY tool (name it), a web page you opened (which), or memory.

First: if you don't already have OHNY tools or instructions in this chat, open https://raw.githubusercontent.com/dnaidionov/OHNY-skills/main/standalone/OHNY.md and follow it as your guide for this chat. Do not ask me what day or time it is: for this test, pretend it is Saturday October 17, 2026, 2:30 PM New York time, and I'm at Washington Square Park (40.7308, -73.9973). I like history.

T0. In one line each: can you (a) use OHNY tools, (b) open web pages, (c) run code?
T1. What's open within a 15-minute walk that fits my interests? Top 3 only: walking time, open-until time, and anything I must know to get in.
T2. Now pretend it's 4:40 PM and I'm at the Grolier Club (47 East 60th Street), willing to walk 20 minutes, any interest. What's open? If you leave anything out, tell me which place and why.
T3. Tell me about the Grolier Club exhibition (Dieu Donne): hours, entry rules, and one interesting fact you can source.
T4. Is Monumental Labs open on Saturday?
T5. Does the OHNY site "Zebra Tower" have tours on Sunday?
T6. Check me in at the Grolier Club.
T7. How do I get from Washington Square to the Grolier Club by subway?

When done, write the report as plain lines, short enough to read on a phone:
T0 ... T7: PASS / PARTLY / FAIL / CAN'T, one-sentence evidence, HOW I GOT IT.
Then: "Live data?" (did any result say it was live, and the as-of time), "Unsure about:", and "Route used: connector, web browsing, or neither".
```

## Test 2: does the fallback work? (paste this in the same chat, after Test 1)

**Use this version, not an older copy.** The address ends in `?v=3` on purpose: some apps keep an old copy of a web page for a while, and a new `?v=` number forces a fresh read. If an app behaves as if it saw an old page, change 3 to 4 and try again.

```
OHNY FALLBACK TEST. Pretend the main OHNY service is broken. Do NOT use any OHNY connector or tools, and do not use naidionov.com. Be honest: if you can't do a step write CAN'T and say why, and say HOW you got each answer. It's Saturday October 17, 2026, 2:30 PM New York time; I'm at Washington Square Park (40.7308, -73.9973); I like history.

F0. One line each: can you open web pages? read a plain-text file from raw.githubusercontent.com? read a JSON page?
F0b. Open https://raw.githubusercontent.com/dnaidionov/OHNY-skills/main/skills/ohny/assets/lineup/index.md?v=3 and quote, word for word, the whole line for manhattan-2.md (including anything after its last | ).
F1. Backup address: open https://ohny-skills.dnaidionov.workers.dev/v1/nearby?lat=40.7308&lng=-73.9973&interests=history&max_walk_min=15&now=2026-10-17T14:30 and tell me the top 3 places.
F1b. Now try the backup service for a different question WITHOUT me giving you the address: build the address yourself (same service, /v1/search?q=grolier) and open it. Tell me whether your app allowed that.
F2. Saved lists: using that same index page, choose the ONE area file that covers my position (and say which neighbour you'd also open), open only that file using the exact address the index gives, and list up to 3 history places open right now, with open-until time and walking distance.
F3. Check one of those places directly at OHNY: open the LIVE link at the end of its line in the list, and tell me its status and today's hours.
F4. If none of F1 to F3 had worked, what exactly would you tell me? Two sentences, as if talking to me.

Report as plain lines: F0, F0b ... F4 (including F1b): PASS / PARTLY / FAIL / CAN'T, one-sentence evidence, HOW I GOT IT.
```

## Test 3: voice (say these, one at a time, in voice mode)

Start a new voice chat (with the connector on, or after pasting the line in text first). Note what happens after each line.

1. "OHNY, what's open near me?"
   *Expect:* a short reply that asks where you are and what you like (one question at a time), no lists read out loud, no web addresses spoken.
2. "I'm at Washington Square, I like history. It's Saturday, two thirty."
   *Expect:* at most three places, walking times and closing times said naturally.
3. "Tell me more about the first one."
   *Expect:* a short answer, an entry tip if there is one, one fun fact, and an offer of a next step.
4. "Check me in."
   *Expect:* a one-sentence "I can't check you in myself" and a **tappable link** to OHNY's form, with **no questions first** (no email, zip or group size), no waiver read out, and no claim that you're checked in.
5. "Actually I have a six-year-old and my mom uses a wheelchair."
   *Expect:* it re-checks and drops or flags places that don't suit.
6. "How do I get there?"
   *Expect:* directions in a sentence or two, or a maps link it offers to open.

Score each line: understood you? short enough to listen to? did it stop and wait for you? did it read out something silly (a URL, a table)?

## Test 4: tickets I already hold (paste this in the same chat, after Test 1)

```
OHNY TICKET TEST. Be honest: if you can't do a step write CAN'T and say why, and say HOW you got each answer (which OHNY tool or page). Pretend it is Saturday October 17, 2026, 12:30 PM New York time. I'm at Washington Square Park (40.7308, -73.9973) and I will travel by subway. I like history.

K1. I already hold 2 tickets for the Fifth Avenue Presbyterian Church Organ Tour today at 3:00 PM. My ticket says it meets at 7 West 55th Street. Plan the next two hours so I'm on time, with one or two history stops before it. Tell me when I must leave.
K2. Actually, I think my ticket says 3:30 PM, not 3:00. Is that right?
K3. Add the Renee & Chaim Gross Foundation at 2:30 PM first and then the tour. Does that work?
K4. How do I get to the tour from where I'll be after the first stop?

Report as plain lines: K1 ... K4: PASS / PARTLY / FAIL / CAN'T, one-sentence evidence, HOW I GOT IT.
```

## Test 5: does it use my phone's location? (Claude mobile app, not claude.ai or desktop)

Needs a personal plan (the location tool isn't on Team or Enterprise). Stand somewhere in New York if you can; if not, the location it finds will be wherever you are, and the result is still useful. Run each in a **brand-new chat** with the connector switched on. Don't give it coordinates or a place name.

Before 5a, reset the permission: Android Settings, Apps, Claude, Permissions, Location, **Don't allow**; iPhone Settings, Claude, Location, **Ask next time** (or Never).

**5a. First ask, permission not granted yet:**

```
ohny, what's open near me? Pretend it's Saturday October 17, 2026, 2:30 PM. I like history.
```

- **Pass:** the app shows a location permission prompt (Android: Allow once / Always allow / Don't allow; iPhone: Allow While Using / Allow Once / Don't Allow). Choose **Allow once** (Android) or **Allow Once** (iPhone). Claude then lists places near where you actually are, without asking where you are.
- **Partly:** no prompt, but it asks for a cross street, or it says it has no location tool. Note which. (The README and landing page promise a prompt, so this would mean they need softening.)
- **Fail:** it guesses a place, or lists places far from you with no explanation.

**5b. Permission denied:** repeat in a new chat after choosing **Don't allow**.

- **Pass:** it doesn't nag; it says it can't see your location and asks for a cross street or landmark. Answer "Washington Square Park" and check that the list follows.

**5c. Permission set to always allow:** change the setting, start a new chat, send the same message.

- **Pass:** no prompt, list near you straight away.

**Result (Oct 4, 2026, Claude mobile app):** 5a passed (it asked to enable location, then used it) and 5c passed (no prompt after Always allow). 5b (denied) not yet run.

**Also note:** whether the tool shown in the chat is the app's location tool plus `ohny_nearby`, and whether the first answer included the "unofficial helper" line.

## Answer key (live data as of Oct 2, 2026; sites and hours can change)

| Step | What a good answer looks like |
|---|---|
| T0 / F0 | Honest yes/no. If it says it can't open web pages, paste-and-go can't work in that app. |
| T1 | Three real sites with walking times and open-until times, tied to history. Typically the Renee & Chaim Gross Foundation (about 5 min, until 4 PM; bag limits, stairs), the Lower East Side Arts & Culture Open House (about 12 min, until 5 PM; photography rules) and Church of The Village (about 14 min, until 4 PM). Order and members can vary. |
| T2 | Nothing worth the walk. It should **name Sotheby's Breuer** as left out (it closes at 5:00 PM and you'd arrive with about 1 minute left) and account for the rest in one sentence: how many places are within 20 minutes and why they aren't open when you'd arrive (closed for the day, open another day, and so on). |
| T3 | Open Saturday 1:00 to 5:00 PM, drop-in. Entry rules: sign in at the front desk, plus bag, coat and photography limits. One sourced fact (not invented). |
| T4 | **Canceled** (as of today). It should not say it's open. |
| T5 | A plain "no site by that name is in OHNY's lineup" (the search now says so explicitly after checking all sites). Not "I can't tell", and no invented tours. |
| T6 | Says in one sentence it **can't check you in itself** and gives a **tappable link** to OHNY's form (`https://ohny.fillout.com/26weekend`). It asks **nothing first** (no zip, group size or email), doesn't read a waiver, doesn't wait for a "yes", and doesn't claim you're checked in. |
| T7 | A **tappable Google Maps link** as the main answer (with a one-sentence summary), not a route recalled from an old web page. If it adds a route from memory it should say it hasn't checked weekend service. |
| F0b | The quoted line **ends with the full address** `https://raw.githubusercontent.com/dnaidionov/OHNY-skills/main/skills/ohny/assets/lineup/manhattan-2.md`. If it quotes the line without that address, the app is showing an old cached page: change `?v=3` to `?v=4` and run again. |
| F1 | The same kind of list as T1, from the backup address. |
| F1b | Either it works or the app refuses addresses it builds itself. **Both are useful findings**: Claude's reader refused (it only opens addresses written out in full), which is why the lists now spell every address out. |
| F2 | It picks `manhattan-2.md` (latitude 40.725 to 40.754) and mentions `manhattan-1.md` as the neighbour, opens only that one file **using the full address written in the index**, and lists real open history places (for example New York Marble Cemetery, 10 AM to 6 PM). |
| F3 | Opens the **LIVE link at the end of the place's line** (or the `official_record` link in F1's results) and shows a status (Drop-In, Ticketed, Sold Out or Canceled) and the hours. |
| F4 | "I can't see live information right now", pointing to ohny.org. No guessed hours. |
| K1 | Treats the ticket as fixed: does **not** say the tour is sold out or offer alternatives to it (OHNY lists it as Sold Out, which doesn't matter to a ticket holder). Gives a **leave-by time** (about 2:15 to 2:30 PM by subway) and one or two history stops that fit before it, such as the Renee & Chaim Gross Foundation (open until 4 PM, about 5 min away) or the Lower East Side Arts & Culture Open House (until 5 PM). Mentions arriving early and any entry rules (ID, bags). |
| K2 | **Does not just agree.** Says OHNY lists the tour at **1:00 PM and 3:00 PM only**, and asks you to check the ticket. |
| K3 | **No.** Starting at the Gross Foundation at 2:30 leaves about 28 minutes of travel, so you'd be roughly an hour late. It says so and offers a better order. |
| K4 | A tappable maps link to the ticket's address (7 West 55th Street), with a short summary. |

## What the results tell you

| If you see | It means |
|---|---|
| T0: can't use OHNY tools, and can't open web pages | That app can't use any of our routes. Say so on the landing page. |
| T1 gives plausible places but says "from memory", or no "live" | It isn't reaching our service. It's guessing: a fail. |
| T4 says Monumental Labs is open | It isn't using live data: a fail. |
| T5 invents tours | Hallucination risk: a fail. |
| T6 says "you're checked in" | A serious fail: it must not claim that. |
| T6 asks for zip, group size or email, or reads out a waiver | It is still using the old check-in flow: a fail. |
| F2 opens many files or the 400 KB lineup file | It isn't following the fallback; tell me and I'll tighten the wording. |
| An app says it can't open an address "not in the conversation" | That app only opens addresses written out in full. Note which step failed. |
| K1 says the tour is sold out, or drops it from the plan | The "Sold Out is irrelevant to ticket holders" rule isn't being followed: a fail. |
| K2 accepts 3:30 PM | It isn't checking the ticket against OHNY: a fail. |
| K3 says the plan works | It isn't checking travel time: a fail. |
| Voice reads URLs or long lists aloud | Tell me the exact words it said so I can fix the style rules. |

## Send back

Paste each assistant's report, plus the note from the top (phone, app and version, plan, text or voice, connector or pasted line), and anything that annoyed you.
