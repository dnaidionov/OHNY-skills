// The lineup has no category field, so interests are matched on keyword-derived tags.
// Each tag: a label visitors would recognise + the words that imply it.

export const TAG_RULES = {
  architecture: /\b(architect\w*|skyscraper|tower|facade|landmark|building|design(ed)? by|art deco|brutalis\w*|modernis\w*|preservation|restoration|adaptive reuse)\b/i,
  history: /\b(histor\w*|heritage|colonial|19th|18th|20th century|centur(y|ies)|founded|museum of the city|memorial|civil war|immigra\w*|ellis island|landmark)\b/i,
  art: /\b(art(s|ist\w*|work)?|gallery|galleries|studio|sculpt\w*|mural\w*|exhibit\w*|paint\w*|print ?shop|craft\w*)\b/i,
  design: /\b(design\w*|interior\w*|lighting|furniture|material\w*|fabricat\w*)\b/i,
  nature: /\b(garden\w*|park|farm\w*|green ?house|ecolog\w*|wildlife|nature|trees?|botanic\w*|wetland\w*|habitat)\b/i,
  waterfront: /\b(water(front|works)?|harbor|harbour|river|pier|ferry|marina|boat\w*|canal|bay|shore\w*|island)\b/i,
  views: /\b(rooftop|roof deck|terrace|observation|skyline|penthouse|views?|top floor|\d{2,3}(th|st|nd|rd) floor)\b/i,
  sacred: /\b(church|cathedral|synagogue|temple|mosque|chapel|sacred|worship|congregation|monastery|shrine|religio\w*)\b/i,
  industrial: /\b(industrial|factory|power (plant|station)|generating|infrastructure|treatment|sanitation|digester|pump\w*|substation|foundry|warehouse|terminal|shipyard)\b/i,
  transit: /\b(subway|train|rail(road|way)?|station|transit|bus|trolley|tunnel|bridge|mta|airport|aviation)\b/i,
  science: /\b(science|scientific|laborator\w*|research|astronom\w*|observatory|engineer\w*|technolog\w*|innovation|robot\w*)\b/i,
  civic: /\b(city hall|courthouse|court|civic|government|council|legislat\w*|municipal|fire ?house|police|library|archive\w*)\b/i,
  performance: /\b(theat(er|re)|music\w*|concert|perform\w*|stage|dance|opera|film|cinema|orchestra|jazz)\b/i,
  food: /\b(food|restaurant|kitchen|brew\w*|distill\w*|bak(ery|ing)|coffee|chocolate|winery|taste|tasting|cook\w*)\b/i,
  kids: /\b(kids?|child(ren)?|famil(y|ies)|playground|youth|all ages|hands-on)\b/i,
  sports: /\b(sport\w*|skate\w*|rowing|paddl\w*|squash|tennis|stadium|rink|gym\w*|climb\w*|swim\w*)\b/i,
  hidden: /\b(behind[- ]the[- ]scenes|private|rarely|first[- ]time|never before|exclusive|hidden|secret|not usually open|closed to the public|special access)\b/i,
  residential: /\b(residen\w*|apartment\w*|home|house|brownstone|townhouse|condo\w*|housing|loft)\b/i,
};

/** Natural-language interest words -> tag names (for matching what visitors say). */
export const INTEREST_ALIASES = {
  architecture: ['architecture', 'buildings', 'skyscrapers', 'design'],
  history: ['history', 'historic', 'historical'],
  art: ['art', 'arts', 'galleries', 'museums', 'museum', 'artists'],
  design: ['design', 'interiors', 'lighting'],
  nature: ['nature', 'gardens', 'parks', 'green', 'outdoors', 'farms', 'plants'],
  waterfront: ['water', 'waterfront', 'boats', 'harbor', 'ferries', 'river'],
  views: ['views', 'rooftops', 'rooftop', 'skyline', 'terrace'],
  sacred: ['churches', 'religious', 'sacred', 'synagogues', 'temples', 'spiritual'],
  industrial: ['industrial', 'infrastructure', 'factories', 'engineering', 'power'],
  transit: ['transit', 'subway', 'trains', 'transportation', 'bridges', 'railroad'],
  science: ['science', 'technology', 'tech', 'research', 'innovation'],
  civic: ['civic', 'government', 'courthouses', 'libraries', 'politics', 'law'],
  performance: ['music', 'theater', 'theatre', 'performance', 'dance', 'film'],
  food: ['food', 'restaurants', 'drink', 'brewery', 'coffee', 'baking'],
  kids: ['kids', 'children', 'family', 'families', 'playgrounds'],
  sports: ['sports', 'skating', 'rowing', 'fitness', 'active'],
  hidden: ['hidden', 'secret', 'behind the scenes', 'exclusive', 'rare', 'unusual'],
  residential: ['homes', 'houses', 'apartments', 'residential', 'housing', 'interiors'],
};

export function deriveTags(site) {
  const text = [site.name, site.short, site.description, site.partner, ...(site.series ?? []), site.series_description, site.special]
    .filter(Boolean).join(' . ');
  const tags = Object.entries(TAG_RULES).filter(([, re]) => re.test(text)).map(([t]) => t);
  if (site.family) tags.push('kids');
  return [...new Set(tags)];
}

/** Rough English singular, so "gardens"/"garden" and "galleries"/"gallery" match alike. Leaves glass, campus, bus alone. */
export function singular(word) {
  const w = word.toLowerCase();
  if (w.length <= 3 || /(ss|us|is)$/.test(w)) return w;
  if (/ies$/.test(w) && w.length > 4) return `${w.slice(0, -3)}y`;
  if (/(ches|shes|sses|xes|zes)$/.test(w)) return w.slice(0, -2);
  if (/s$/.test(w)) return w.slice(0, -1);
  return w;
}

const norm = (phrase) => phrase.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map(singular).join(' ');
const NORMALIZED_ALIASES = Object.entries(INTEREST_ALIASES).map(([tag, aliases]) => [tag, aliases.map(norm)]);

/** "rooftops and old churches" -> { tags: ['views','sacred'], words: ['rooftop','old','church'] } (words are singular stems) */
export function interpretInterests(input) {
  const list = (Array.isArray(input) ? input : String(input ?? '').split(/[,;]| and /i))
    .map((s) => s.trim().toLowerCase()).filter(Boolean);
  const tags = new Set();
  const words = new Set();
  for (const phrase of list) {
    const p = ` ${norm(phrase)} `;
    for (const [tag, aliases] of NORMALIZED_ALIASES) {
      if (aliases.some((a) => p.includes(` ${a} `))) tags.add(tag);
    }
    for (const w of phrase.split(/\s+/)) if (w.length > 3) words.add(singular(w));
  }
  return { tags: [...tags], words: [...words] };
}

/** Does site text contain this interest word in singular or plural form? */
export function hasWord(text, stem) {
  const lower = text.toLowerCase();
  if (lower.includes(stem)) return true;
  return lower.split(/[^a-z0-9]+/).some((t) => t && singular(t) === stem);
}
