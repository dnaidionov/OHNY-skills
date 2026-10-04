# Phone test for Ask OHNY

Run this on a real phone, in each app (Claude, ChatGPT, Gemini), in a **fresh chat**, once by typing and once by voice. It takes about 10 minutes per app. Open this page on your phone and copy the prompts from the boxes.

Before you start, note: phone model, app name and version, free or paid plan, and how OHNY is set up in that app (Claude connector, or the pasted line).

- **Claude with the connector added:** just paste Test 1. The prompt only opens the web file if the OHNY tools aren't already there.
- **ChatGPT and Gemini:** paste Test 1 as is. It loads the instructions from the web file itself.

## Test 0: do the connector's rules reach the assistant? (Claude with the connector)

Run this **first**, in a brand-new chat with the OHNY connector switched on. It takes one minute.

```
Without using any tools and without searching the web: what is the exact web address for checking in at an OHNY site, and what would you do if I asked you to check me in?
```

The assistant can only answer exactly if the connector's rules reached it.

- **Pass:** it gives exactly `https://ohny.fillout.com/26weekend`, says it can't check you in itself, and says it would give you that link without asking anything first.
- **Fail:** it doesn't know the address, gives some other address, or says it would ask for your zip code and group size.

Then, in a second new chat, paste: *"ohny, I'm at Washington Square Park (40.7308, -73.9973). Pretend it's Saturday October 17, 2026, 2:30 PM. I like history. What's open within 15 minutes' walk?"* and look at the tool-use lines in the reply. Ideally `ohny_guide` appears first, then `ohny_nearby`.

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
