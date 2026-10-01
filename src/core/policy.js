// Short, speakable "heads-up" hints pulled from a site's access notes and age limit.
// They are keyword hints, not a substitute for the notes: the skill reads the full note whenever it matters.

const RULES = [
  ['Photo ID needed', /photo id|valid id|government[- ]issued|id (is )?required|identification|must show id/i],
  ['Bag limits', /\bbags?\b|backpack|luggage|suitcase/i],
  ['Photography rules', /photograph|photos? (are )?(not|prohibited|restricted)|no photo|no filming|no video/i],
  ['Sign-in or waiver at the door', /waiver|sign[- ]in|sign in at/i],
  ['Footwear rules', /closed[- ]toe|footwear|heels|sturdy shoes|flat shoes/i],
  ['Security screening', /security (check|screening)|screening|metal detector|x-ray|bag check/i],
  ['Stairs or uneven ground', /\bstairs\b|\bsteps\b|climb|uneven|not wheelchair|no elevator|ladder/i],
  ['Capacity limits or lines', /capacity|first[- ]come|line forms|limited (space|entry)|wait/i],
];

export function policyFlags(site, max = 4) {
  const out = [];
  const age = site.age?.trim();
  if (age && !/^all ages$/i.test(age)) out.push(`Age: ${age}`);
  const notes = site.access_notes ?? '';
  for (const [label, re] of RULES) if (notes && re.test(notes)) out.push(label);
  return out.slice(0, max);
}
