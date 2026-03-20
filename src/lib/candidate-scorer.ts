// ── Candidate Scorer ─────────────────────────────────────────────────
// Pure logic: no React, no browser APIs, no side effects.
// Scores and filters Place[] before AI or deterministic planner sees them.

import { Place, PlaceCategory, ScoredPlace, Vibe } from './types';

// ── Chain Brand Detection ─────────────────────────────────────────────

const CHAIN_KEYWORDS: string[] = [
  'starbucks', "mcdonald's", 'mcdonalds', 'mcdonald',
  'dunkin', "dunkin'", 'dunkin donuts',
  'subway', 'chipotle', 'chick-fil-a', 'chick fil a', 'chickfila',
  'taco bell', 'burger king', "wendy's", 'wendys', 'wendy',
  'dominos', "domino's", 'pizza hut', 'kfc', 'popeyes', "popeye's",
  'panera', 'pret a manger', 'pret', 'sweetgreen',
  'five guys', 'shake shack', 'in-n-out', 'in n out',
  "jersey mike's", 'jersey mikes', "jimmy john's", 'jimmy johns',
  'tim hortons', "tim horton's", 'costa coffee', 'costa', 'greggs',
  "nando's", 'nandos', 'wagamama', 'itsu', 'leon',
  'pure gym', 'anytime fitness', 'planet fitness', 'crunch fitness',
  'equinox', 'la fitness',
  'jamba juice', 'smoothie king', 'tropical smoothie',
  'orange julius', 'auntie anne', "auntie anne's",
  'cinnabon', 'wetzel', 'pretzelmaker',
  "moe's", 'moes', 'qdoba', 'del taco', 'jack in the box',
  'whataburger', "hardee's", 'hardees', "carl's jr", 'carls jr',
  'sonic drive', 'sonic',
];

// Outing-unsuitable business types (service, utility, healthcare, etc.)
const UNSUITABLE_NAME_KEYWORDS: string[] = [
  // Apparel/tailoring
  'tailor', 'alterations', 'dry clean', 'dry-clean', 'laundry', 'laundrette', 'launderette',
  // Healthcare
  'dental', 'dentist', 'orthodont', 'optician', 'optometrist', 'optical',
  'pharmacy', 'chemist', 'drugstore', 'urgent care', 'clinic', 'hospital',
  'physio', 'chiropract', 'podiatrist', 'dermatolog',
  // Finance/banking
  'bank', 'banking', 'credit union', 'atm', 'cash machine', 'pawn', 'payday loan',
  'check cash', 'money transfer', 'western union', 'moneygram',
  // Postal/shipping
  'post office', 'postal', 'royal mail', 'usps', 'ups store', 'fedex office',
  'fedex kinko', 'the ups store', 'mailboxes etc',
  // Automotive
  'car wash', 'auto repair', 'auto body', 'mechanic', 'oil change', 'tire',
  'muffler', 'transmission', 'smog check', 'emissions',
  // Funeral/legal
  'funeral', 'mortuary', 'cremation', 'notary', 'law office', 'attorney',
  // Gambling
  'betting', 'sportsbook', 'lottery', 'casino',
  // Veterinary
  'veterinary', 'vet clinic', 'animal hospital', 'pet hospital',
  // Storage/logistics
  'storage unit', 'self storage', 'public storage', 'extra space',
  // Telecom/insurance/tax
  'insurance', 'tax prep', 'h&r block', 'liberty tax', 'sprint store', 'at&t store',
  't-mobile', 'verizon store',
];

// ── Vibe Fit Scoring ─────────────────────────────────────────────────
// Returns 0-10 score for how well a category fits each vibe.
// Missing categories default to 3 (neutral — not great, not excluded).

const VIBE_FIT_MAP: Record<Vibe, Partial<Record<PlaceCategory, number>>> = {
  cozy: {
    cafe: 10, bookstore: 9, dessert: 8, restaurant: 6,
    museum: 5, park: 4, scenic: 4, shopping: 3,
    bar: 4, activity: 3, arcade: 2, attraction: 3, nightlife: 2,
  },
  date: {
    restaurant: 10, scenic: 9, dessert: 9, cafe: 7,
    museum: 8, park: 7, attraction: 8, bookstore: 5,
    bar: 6, activity: 6, shopping: 5, arcade: 3, nightlife: 4,
  },
  chaotic: {
    arcade: 10, activity: 10, attraction: 8, dessert: 8,
    restaurant: 7, cafe: 6, shopping: 7, scenic: 5,
    bar: 8, nightlife: 9, park: 4, museum: 3, bookstore: 2,
  },
  foodie: {
    restaurant: 10, dessert: 10, cafe: 9, bar: 7,
    attraction: 4, museum: 3, park: 3, bookstore: 3,
    scenic: 3, shopping: 3, arcade: 2, activity: 3, nightlife: 5,
  },
  artsy: {
    museum: 10, bookstore: 9, scenic: 8, cafe: 8,
    shopping: 6, attraction: 6, park: 5, restaurant: 5,
    dessert: 5, activity: 4, bar: 4, arcade: 2, nightlife: 3,
  },
  outdoorsy: {
    park: 10, scenic: 10, activity: 7, cafe: 6,
    restaurant: 5, attraction: 5, bookstore: 3, museum: 3,
    dessert: 4, shopping: 2, bar: 3, arcade: 1, nightlife: 1,
  },
  cheap: {
    park: 10, scenic: 8, bookstore: 7, cafe: 7, dessert: 7,
    museum: 6, restaurant: 5, attraction: 5, activity: 5,
    shopping: 4, bar: 3, arcade: 4, nightlife: 2,
  },
  'main-character': {
    scenic: 10, attraction: 9, cafe: 8, dessert: 8, shopping: 7,
    park: 7, museum: 6, restaurant: 6, bookstore: 5,
    activity: 5, bar: 5, arcade: 3, nightlife: 5,
  },
  tourist: {
    attraction: 10, museum: 9, scenic: 9, cafe: 7,
    restaurant: 7, dessert: 7, park: 6, bookstore: 5,
    shopping: 6, activity: 6, bar: 4, arcade: 3, nightlife: 4,
  },
  'rainy-day': {
    cafe: 10, museum: 10, bookstore: 9, arcade: 9,
    activity: 8, restaurant: 7, dessert: 7, shopping: 6,
    bar: 5, nightlife: 4, attraction: 5, scenic: 2, park: 1,
  },
};

// ── Chain Detection Helpers ───────────────────────────────────────────

export function isLikelyChain(name: string): boolean {
  const lower = name.toLowerCase().trim();
  return CHAIN_KEYWORDS.some(kw => lower.includes(kw));
}

// Returns a normalized brand key for deduplication (e.g. "starbucks")
export function detectBrandKey(name: string): string {
  const lower = name.toLowerCase().trim();
  for (const kw of CHAIN_KEYWORDS) {
    if (lower.includes(kw)) return kw;
  }
  // Fallback: first 12 chars of normalized name
  return lower.replace(/[^a-z0-9]/g, '').slice(0, 12);
}

// ── Suitability Check ────────────────────────────────────────────────

export function isOutingSuitable(name: string): boolean {
  const lower = name.toLowerCase().trim();
  return !UNSUITABLE_NAME_KEYWORDS.some(kw => lower.includes(kw));
}

// ── Core Scoring ─────────────────────────────────────────────────────

export function scoreCandidates(places: Place[], vibe: Vibe): ScoredPlace[] {
  return places.map(place => {
    const likelyChain = isLikelyChain(place.name);
    const suitable = isOutingSuitable(place.name);
    const outingSuitabilityScore = suitable ? 8 : 0;
    const vibeFitScore = VIBE_FIT_MAP[vibe]?.[place.category] ?? 3;

    let exclusionReason: string | undefined;
    if (!suitable) exclusionReason = 'unsuitable_venue_type';
    else if (likelyChain) exclusionReason = 'chain'; // flagged but not excluded yet

    return {
      ...place,
      outingSuitabilityScore,
      vibeFitScore,
      likelyChain,
      exclusionReason,
    };
  });
}

// ── Outing Filter ────────────────────────────────────────────────────

export function filterForOuting(scored: ScoredPlace[]): ScoredPlace[] {
  // Step 1: Remove unsuitable venues (score === 0)
  const suitable = scored.filter(p => p.outingSuitabilityScore > 0);

  // Step 2: Allow at most 1 representative per chain brand
  const seenChainBrands = new Set<string>();
  return suitable.filter(p => {
    if (!p.likelyChain) return true;
    const brand = detectBrandKey(p.name);
    if (seenChainBrands.has(brand)) return false;
    seenChainBrands.add(brand);
    return true;
  });
}

// ── Combined Pipeline ────────────────────────────────────────────────

export function prepareCandidates(places: Place[], vibe: Vibe): ScoredPlace[] {
  const scored = scoreCandidates(places, vibe);
  return filterForOuting(scored);
}
