# Phone test for Ask OHNY

Run this on a real phone, in each app (Claude, ChatGPT, Gemini), in a **fresh chat**, once by typing and once by voice. It takes about 10 minutes per app. Open this page on your phone and copy the prompts from the boxes.

Before you start, note: phone model, app name and version, free or paid plan, and how OHNY is set up in that app (Claude connector, or the pasted line).

- **Claude with the connector added:** just paste Test 1. The prompt only opens the web file if the OHNY tools aren't already there.
- **ChatGPT and Gemini:** paste Test 1 as is. It loads the instructions from the web file itself.

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
T6. Check me in at the Grolier Club: 3 people, zip 10022, no email. TEST ONLY: show exactly what you would say and ask before checking in, but do not submit anything.
T7. How do I get from Washington Square to the Grolier Club by subway?

When done, write the report as plain lines, short enough to read on a phone:
T0 ... T7: PASS / PARTLY / FAIL / CAN'T, one-sentence evidence, HOW I GOT IT.
Then: "Live data?" (did any result say it was live, and the as-of time), "Unsure about:", and "Route used: connector, web browsing, or neither".
```

## Test 2: does the fallback work? (paste this in the same chat, after Test 1)

```
OHNY FALLBACK TEST. Pretend the main OHNY service is broken. Do NOT use any OHNY connector or tools, and do not use naidionov.com. Be honest: if you can't do a step write CAN'T and say why, and say HOW you got each answer. It's Saturday October 17, 2026, 2:30 PM New York time; I'm at Washington Square Park (40.7308, -73.9973); I like history.

F0. One line each: can you open web pages? read a plain-text file from raw.githubusercontent.com? read a JSON page?
F1. Backup address: open https://ohny-skills.dnaidionov.workers.dev/v1/nearby?lat=40.7308&lng=-73.9973&interests=history&max_walk_min=15&now=2026-10-17T14:30 and tell me the top 3 places.
F2. Saved lists: open https://raw.githubusercontent.com/dnaidionov/OHNY-skills/main/skills/ohny/assets/lineup/index.md , choose the ONE area file that covers my position (and say which neighbour you'd also open), open only that file, and list up to 3 history places open right now, with open-until time and walking distance.
F3. Check one of those places directly at OHNY: open https://ohny.org/data/<its id>.json (the id is in brackets on its line in the list) and tell me its status and today's hours.
F4. If none of F1 to F3 had worked, what exactly would you tell me? Two sentences, as if talking to me.

Report as plain lines: F0 ... F4: PASS / PARTLY / FAIL / CAN'T, one-sentence evidence, HOW I GOT IT.
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
   *Expect:* asks anonymous or email, zip and party size; reads out the photo/risk notice in plain words; waits for your "yes"; does not claim to have checked you in (it can only give you the form link).
5. "Actually I have a six-year-old and my mom uses a wheelchair."
   *Expect:* it re-checks and drops or flags places that don't suit.
6. "How do I get there?"
   *Expect:* directions in a sentence or two, or a maps link it offers to open.

Score each line: understood you? short enough to listen to? did it stop and wait for you? did it read out something silly (a URL, a table)?

## Answer key (live data as of Oct 2, 2026; sites and hours can change)

| Step | What a good answer looks like |
|---|---|
| T0 / F0 | Honest yes/no. If it says it can't open web pages, paste-and-go can't work in that app. |
| T1 | Three real sites with walking times and open-until times, tied to history. Typically the Renee & Chaim Gross Foundation (about 5 min, until 4 PM; bag limits, stairs), the Lower East Side Arts & Culture Open House (about 12 min, until 5 PM; photography rules) and Church of The Village (about 14 min, until 4 PM). Order and members can vary. |
| T2 | Nothing worth the walk. It should **name Sotheby's Breuer** as left out: it closes at 5:00 PM and you'd arrive with about 1 minute left. |
| T3 | Open Saturday 1:00 to 5:00 PM, drop-in. Entry rules: sign in at the front desk, plus bag, coat and photography limits. One sourced fact (not invented). |
| T4 | **Canceled** (as of today). It should not say it's open. |
| T5 | There is **no site by that name**. It must not invent tours. (A search may show unrelated sites with "tower" in them; it should say none is Zebra Tower.) |
| T6 | Asks you to confirm, reads the waiver (photos, risks, holding OHNY and the site's owner harmless), waits for a clear yes, gives the form link `https://ohny.fillout.com/26weekend` and says what to type, does **not** ask for a name and does **not** claim it submitted. |
| T7 | A sensible route, for example the 6 train from Astor Place to 59th St / Lexington Ave, then about two blocks to 47 East 60th Street. |
| F1 | The same kind of list as T1, from the backup address. |
| F2 | It picks `manhattan-2.md` (latitude 40.725 to 40.754) and mentions `manhattan-1.md` as the neighbour, opens only that one file, and lists real open history places (for example New York Marble Cemetery, 10 AM to 6 PM). |
| F3 | Shows a status (Drop-In, Ticketed, Sold Out or Canceled) and the hours for the chosen place. |
| F4 | "I can't see live information right now", pointing to ohny.org. No guessed hours. |

## What the results tell you

| If you see | It means |
|---|---|
| T0: can't use OHNY tools, and can't open web pages | That app can't use any of our routes. Say so on the landing page. |
| T1 gives plausible places but says "from memory", or no "live" | It isn't reaching our service. It's guessing: a fail. |
| T4 says Monumental Labs is open | It isn't using live data: a fail. |
| T5 invents tours | Hallucination risk: a fail. |
| T6 says "you're checked in" | A serious fail: it must not claim that. |
| F2 opens many files or the 400 KB lineup file | It isn't following the fallback; tell me and I'll tighten the wording. |
| Voice reads URLs or long lists aloud | Tell me the exact words it said so I can fix the style rules. |

## Send back

Paste each assistant's report, plus the note from the top (phone, app and version, plan, text or voice, connector or pasted line), and anything that annoyed you.
