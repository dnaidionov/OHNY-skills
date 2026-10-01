# Checking in at a site

OHNY asks every visitor to check in **at every site, before entry**, "even if you've filled out the form at another location". Check-in is one short anonymous form (no name, no account).

Official form: https://ohny.fillout.com/26weekend

## What the form collects

| Field | Required | Notes |
|---|---|---|
| Place or tour you are visiting now | Yes | One site from the lineup (picked by its exact name) |
| Zip or postal code | Yes | Free text, so non-US codes are fine |
| How many people are you checking in | Yes | A number (the whole party) |
| Email address | **No** | Optional |
| "Sign me up!" | **No** | Newsletter sign-up, **off unless the visitor clearly says yes** |

There is no name field. Don't ask for a name.

## Waiver (shown on the form; must be agreed to by taking part)

In plain words, say all three points when you read it back:
1. OHNY may **use photos and recordings of you** taken at the weekend, in any medium.
2. You **accept the risks** of taking part, including injury and property damage.
3. You agree to **hold OHNY, its volunteers and staff, and the site's owner or operator harmless** if something goes wrong.

Offer the full text if they want it. Never summarise it as "just a form" or skip it.

## Flow

### A. First time only: set up their check-in profile
1. "Do you want to leave an email with OHNY, or stay anonymous?" Anonymous is a perfectly good answer; don't push. If they want to leave one and you don't have it, ask for it. (Don't ask for a name.)
2. "What's your zip or postal code?"
3. "How many people are in your group?"
4. Ask: "Shall I remember these so you don't have to repeat them at the next site?" If yes, save in the platform's memory. Don't save the email unless they say so; if they'd rather not, ask each time.
5. Newsletter: **do not mention or tick it** unless they bring it up. If they ask whether they can join OHNY's mailing list, then yes, that's the "Sign me up!" box, and it needs an email.

On later visits, reuse the saved profile and just confirm party size ("Still three of you?").

### B. Find the site
- If they named it: `search` for it. If several match, give the top two or three and ask which.
- If they didn't: use the phone's location if available (`nearby` with their position, `limit=3`, `include_ticketed=true`) and ask "Are you at <name>?" If you have no location, ask: "Which site are you at?"
- Confirm the **exact lineup name** and the neighborhood. Check its `state`: if it's `canceled`, stop and say so. If `sold_out`, or it's a ticketed tour that isn't running now, tell them and ask if they still want to check in (they may have a ticket for a later session).

Before the confirmation, fetch the site (`site/<slug>`) and give a **one-breath reminder of its entry rules** from `access_notes` and `heads_up` if any apply ("Bring photo ID, no large bags, and photography isn't allowed inside"). Don't skip it: it's the last chance before they walk in.

### C. Confirm, then check in
Read back everything in one breath and ask for a clear yes:

> "Checking in **3 people** at **Grolier Club**, zip **10022**, **no email**. By checking in you agree OHNY can use photos of you from the weekend, you accept the risks of taking part, and you'll hold OHNY and the site's owner harmless. Shall I go ahead?"

Proceed only on an unambiguous yes ("yes", "go ahead", "do it"). Silence, "maybe", or changing the subject is not a yes. If they correct something, fix it and confirm again.

### D. Submit

**`CHECKIN_MODE = link` (current default).** The form can't be filled in for them from a link (its fields don't accept prefilled values), so:
1. Give the form link as tappable text.
2. Read out exactly what to enter, in the order they'll see it: "Tap Add, type *<exact site name>* and pick it. Zip *10022*. People *3*. Email: leave blank. Tick nothing else. Then Submit."
3. Ask "Tell me when you're done." When they say so, record the visit in memory and move on.

**`CHECKIN_MODE = direct`.** Not available yet (it needs OHNY's approval and a supported way to send the form). Don't try to submit the form any other way; use `link`.

Do **not** use a browser tool to open the form and click through it unless the visitor has asked you to and the waiver was confirmed first, and never solve or bypass any CAPTCHA or bot check; if one appears, hand the form to the visitor.

### E. After
- Remember the visit (site slug + time) in the visitor's memory for planning and "near where I just was".
- Offer a next step: "Want to hear about this place, or find something close by?"

## If something goes wrong
- Can't find the site in the lineup: it may be a late addition. Check `/v1/changes`, then try the exact name on the official form (the form's list is the final word).
- The form isn't loading or rejects the entry: apologise, give them the link, and suggest telling the volunteer at the door; they can usually check in on the spot.
- They want to change a check-in already submitted: you can't edit it; they should tell OHNY (info@ohny.org).
