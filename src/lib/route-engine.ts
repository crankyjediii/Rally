import {
  Place, PlaceCategory, UserPreferences, GeneratedRoute, RouteStop, Vibe, ScoredPlace
} from './types';
import { ROUTE_TITLES, VIBE_DESCRIPTIONS } from './constants';
import { generateId, pickRandom, getDistanceBetween, formatDistance, estimateWalkTime } from './utils';

// ── Vibe-to-Category Mapping ─────────────────────────────────────────

const VIBE_CATEGORIES: Record<Vibe, PlaceCategory[][]> = {
  cozy: [['cafe'], ['bookstore', 'museum'], ['restaurant', 'dessert']],
  date: [['scenic', 'cafe'], ['museum', 'attraction', 'park'], ['activity', 'scenic'], ['restaurant', 'dessert']],
  chaotic: [['activity', 'arcade'], ['attraction', 'scenic'], ['dessert', 'shopping'], ['bar', 'nightlife']],
  foodie: [['cafe'], ['restaurant'], ['dessert'], ['restaurant', 'cafe']],
  artsy: [['cafe'], ['museum', 'bookstore'], ['scenic', 'shopping'], ['dessert']],
  outdoorsy: [['park', 'scenic'], ['activity', 'cafe'], ['scenic', 'park'], ['cafe', 'dessert']],
  cheap: [['park', 'scenic'], ['bookstore', 'museum'], ['activity', 'scenic'], ['cafe', 'dessert']],
  'main-character': [['scenic', 'cafe'], ['attraction', 'park'], ['dessert', 'shopping'], ['scenic']],
  tourist: [['attraction'], ['museum', 'scenic'], ['cafe', 'activity'], ['dessert', 'shopping']],
  'rainy-day': [['cafe', 'bookstore'], ['museum', 'arcade'], ['activity', 'bookstore'], ['restaurant', 'dessert']],
};

// ── Budget Limits ────────────────────────────────────────────────────

function getBudgetMax(budget: UserPreferences['budget']): number {
  switch (budget) {
    case 'under-15': return 15;
    case 'under-30': return 30;
    case 'under-60': return 60;
    case 'flexible': return 200;
  }
}

// ── Stop Count ───────────────────────────────────────────────────────

function getStopCount(time: UserPreferences['timeAvailable']): number {
  switch (time) {
    case '30-min': return 2;
    case '1-hour': return 2;
    case '2-hours': return 3;
    case '3-plus': return 4;
  }
}

// ── Filter by Indoor/Outdoor ─────────────────────────────────────────

function filterByIndoorOutdoor(places: Place[], pref: UserPreferences['indoorOutdoor']): Place[] {
  if (pref === 'both') return places;
  if (pref === 'indoor') return places.filter(p => p.indoor);
  return places.filter(p => !p.indoor);
}

// ── Pick Best Place ──────────────────────────────────────────────────

function pickBestPlace(
  places: Place[],
  categories: PlaceCategory[],
  budget: number,
  usedIds: Set<string>,
  preferences: UserPreferences,
  prevLat?: number,
  prevLng?: number,
): Place | null {
  let candidates = places
    .filter(p => categories.includes(p.category))
    .filter(p => !usedIds.has(p.id))
    .filter(p => p.estimatedCost <= budget);

  candidates = filterByIndoorOutdoor(candidates, preferences.indoorOutdoor);

  // Sort by quality score + distance proximity
  if (prevLat !== undefined && prevLng !== undefined) {
    candidates.sort((a, b) => {
      const scoreA = (a as ScoredPlace).vibeFitScore ?? 5;
      const scoreB = (b as ScoredPlace).vibeFitScore ?? 5;
      // If scores differ significantly, prefer higher quality
      if (Math.abs(scoreA - scoreB) >= 2) return scoreB - scoreA;
      // Otherwise sort by proximity
      const distA = getDistanceBetween(prevLat, prevLng, a.lat, a.lng);
      const distB = getDistanceBetween(prevLat, prevLng, b.lat, b.lng);
      return distA - distB;
    });
    candidates = candidates.slice(0, 5);
  } else {
    // No previous stop — sort by vibeFitScore if available
    candidates.sort((a, b) => {
      const scoreA = (a as ScoredPlace).vibeFitScore ?? 5;
      const scoreB = (b as ScoredPlace).vibeFitScore ?? 5;
      return scoreB - scoreA;
    });
    candidates = candidates.slice(0, 8);
  }

  if (candidates.length === 0) {
    // Fallback: relax category constraint
    candidates = places
      .filter(p => !usedIds.has(p.id))
      .filter(p => p.estimatedCost <= budget);
    candidates = filterByIndoorOutdoor(candidates, preferences.indoorOutdoor);
    if (candidates.length === 0) {
      candidates = places.filter(p => !usedIds.has(p.id));
    }
  }

  if (candidates.length === 0) return null;
  return pickRandom(candidates, 1)[0];
}

// ── Generate Route Reason ────────────────────────────────────────────

function generateReason(place: Place, vibe: Vibe, order: number, totalStops: number): string {
  const reasons: Record<string, string[]> = {
    cafe: ['Perfect warm-up spot to set the vibe.', 'Start with caffeine. Always.', 'Cozy corner, great drinks.'],
    restaurant: ['Time to refuel — this spot delivers.', 'A delicious pit stop you\'ll thank us for.', 'Food break, and a good one.'],
    dessert: ['Treat yourself. You\'ve earned it.', 'Sweet ending to keep the momentum.', 'The sugar rush you didn\'t know you needed.'],
    park: ['Fresh air and good energy.', 'Scenic break to reset your senses.', 'Nature\'s own vibe check.'],
    museum: ['Culture hit. Brain food.', 'Because art > doomscrolling.', 'Expand your mind between stops.'],
    bookstore: ['Get lost in the stacks for a bit.', 'Find a book you\'ll pretend to read.', 'The coziest kind of browsing.'],
    arcade: ['Game on. No excuses.', 'Time to prove who\'s actually the best.', 'Button-mashing therapy session.'],
    scenic: ['Stop and look. This view hits different.', 'Main character moment incoming.', 'A photo op that doesn\'t need a filter.'],
    shopping: ['Retail therapy, light edition.', 'Browse, don\'t buy. (Or do, we won\'t judge.)', 'Unique finds in this neighborhood.'],
    attraction: ['This is the kind of thing you tell people about.', 'Tourist mode, but make it cool.', 'Experience points: unlocked.'],
    activity: ['Let\'s get active. Or at least entertainingly lazy.', 'This is the fun part.', 'Peak group energy moment.'],
    bar: ['Drinks with a vibe.', 'Wind down with something smooth.', 'The social lubricant stop.'],
    nightlife: ['The night is young. You are not (but pretend).', 'When the sun goes down, this lights up.', 'End with energy.'],
  };

  if (order === 0) {
    return 'Kick things off right — ' + (reasons[place.category]?.[0] || 'Great starting point.');
  }
  if (order === totalStops - 1) {
    return 'The grand finale — ' + (reasons[place.category]?.[2] || 'End on a high note.');
  }
  return reasons[place.category]?.[1] || 'A solid pick for this route.';
}

// ── Main Route Generation ────────────────────────────────────────────

export function generateRoute(
  places: Place[],
  preferences: UserPreferences,
  locationCity: string,
  neighborhood?: string,
  isDemo: boolean = false,
): GeneratedRoute {
  const vibe = preferences.vibe;
  const stopCount = getStopCount(preferences.timeAvailable);
  const budgetMax = getBudgetMax(preferences.budget);
  const categorySlots = VIBE_CATEGORIES[vibe] || VIBE_CATEGORIES.cozy;

  const usedIds = new Set<string>();
  const stops: RouteStop[] = [];
  let remainingBudget = budgetMax;
  let prevLat: number | undefined;
  let prevLng: number | undefined;

  for (let i = 0; i < stopCount; i++) {
    const categories = categorySlots[i % categorySlots.length];
    const perStopBudget = remainingBudget / (stopCount - i);

    // Enforce food if required and this is middle stop
    let cats = [...categories];
    if (preferences.foodRequired && i === Math.floor(stopCount / 2)) {
      cats = ['restaurant', 'cafe'];
    }
    if (preferences.attractionRequired && i === 0) {
      cats = ['attraction', 'museum', 'scenic'];
    }

    const place = pickBestPlace(places, cats, perStopBudget, usedIds, preferences, prevLat, prevLng);
    if (!place) continue;

    usedIds.add(place.id);
    const dist = prevLat !== undefined && prevLng !== undefined
      ? getDistanceBetween(prevLat, prevLng, place.lat, place.lng)
      : 0;

    stops.push({
      place,
      order: i,
      reason: generateReason(place, vibe, i, stopCount),
      distanceFromPrev: i === 0 ? 'Start' : formatDistance(dist),
      travelTimeFromPrev: i === 0 ? '' : estimateWalkTime(dist),
      completed: false,
    });

    remainingBudget -= place.estimatedCost;
    prevLat = place.lat;
    prevLng = place.lng;
  }

  const totalCost = stops.reduce((sum, s) => sum + s.place.estimatedCost, 0);
  const totalMinutes = stops.reduce((sum, s) => sum + s.place.estimatedMinutes, 0) + (stops.length - 1) * 8;

  const titles = ROUTE_TITLES[vibe] || ROUTE_TITLES.cozy;
  const descriptions = VIBE_DESCRIPTIONS[vibe] || VIBE_DESCRIPTIONS.cozy;

  return {
    id: generateId(),
    title: pickRandom(titles, 1)[0],
    vibeDescription: pickRandom(descriptions, 1)[0],
    stops,
    totalTime: `~${Math.round(totalMinutes / 5) * 5} min`,
    totalCost,
    travelMode: preferences.radius === 'walking' ? 'Walking' : 'Walking + Transit',
    vibe,
    groupType: preferences.groupType,
    createdAt: new Date().toISOString(),
    city: locationCity,
    neighborhood,
    isDemo,
    saved: false,
  };
}

// ── Reroll Single Stop ───────────────────────────────────────────────

export function rerollStop(
  route: GeneratedRoute,
  stopIndex: number,
  allPlaces: Place[],
  preferences: UserPreferences,
): GeneratedRoute {
  const usedIds = new Set(route.stops.map(s => s.place.id));
  const oldStop = route.stops[stopIndex];
  const categories: PlaceCategory[] = [oldStop.place.category];

  const prevStop = stopIndex > 0 ? route.stops[stopIndex - 1] : null;
  const newPlace = pickBestPlace(
    allPlaces,
    categories,
    oldStop.place.estimatedCost + 10,
    usedIds,
    preferences,
    prevStop?.place.lat,
    prevStop?.place.lng,
  );

  if (!newPlace) return route;

  const dist = prevStop
    ? getDistanceBetween(prevStop.place.lat, prevStop.place.lng, newPlace.lat, newPlace.lng)
    : 0;

  const newStops = [...route.stops];
  newStops[stopIndex] = {
    ...oldStop,
    place: newPlace,
    reason: generateReason(newPlace, route.vibe, stopIndex, route.stops.length),
    distanceFromPrev: stopIndex === 0 ? 'Start' : formatDistance(dist),
    travelTimeFromPrev: stopIndex === 0 ? '' : estimateWalkTime(dist),
  };

  const totalCost = newStops.reduce((sum, s) => sum + s.place.estimatedCost, 0);
  return { ...route, stops: newStops, totalCost };
}

// ── Add Wildcard Stop ────────────────────────────────────────────────

export function addWildcardStop(
  route: GeneratedRoute,
  allPlaces: Place[],
  preferences: UserPreferences,
): GeneratedRoute {
  const usedIds = new Set(route.stops.map(s => s.place.id));
  const wildcardCategories: PlaceCategory[] = ['dessert', 'scenic', 'activity', 'arcade'];
  const lastStop = route.stops[route.stops.length - 1];

  const place = pickBestPlace(
    allPlaces,
    wildcardCategories,
    50,
    usedIds,
    preferences,
    lastStop.place.lat,
    lastStop.place.lng,
  );

  if (!place) return route;

  const dist = getDistanceBetween(lastStop.place.lat, lastStop.place.lng, place.lat, place.lng);

  const newStop: RouteStop = {
    place,
    order: route.stops.length,
    reason: '🎲 Wildcard! A surprise bonus stop to keep things interesting.',
    distanceFromPrev: formatDistance(dist),
    travelTimeFromPrev: estimateWalkTime(dist),
    completed: false,
  };

  const newStops = [...route.stops, newStop];
  const totalCost = newStops.reduce((sum, s) => sum + s.place.estimatedCost, 0);
  return { ...route, stops: newStops, totalCost };
}

// ── Make Cheaper ─────────────────────────────────────────────────────

export function makeCheaper(
  route: GeneratedRoute,
  allPlaces: Place[],
  preferences: UserPreferences,
): GeneratedRoute {
  // Find the most expensive stop and try to replace it
  let maxCostIdx = 0;
  route.stops.forEach((s, i) => {
    if (s.place.estimatedCost > route.stops[maxCostIdx].place.estimatedCost) maxCostIdx = i;
  });
  return rerollStop(route, maxCostIdx, allPlaces, { ...preferences, budget: 'under-15' });
}

// ── Make More Fun ────────────────────────────────────────────────────

export function makeMoreFun(
  route: GeneratedRoute,
  allPlaces: Place[],
  preferences: UserPreferences,
): GeneratedRoute {
  // Find a chill stop and replace with something more exciting
  const funCategories: PlaceCategory[] = ['arcade', 'activity', 'attraction', 'dessert'];
  const boringIdx = route.stops.findIndex(s =>
    !funCategories.includes(s.place.category)
  );
  if (boringIdx === -1) return route;

  const usedIds = new Set(route.stops.map(s => s.place.id));
  const prevStop = boringIdx > 0 ? route.stops[boringIdx - 1] : null;
  const newPlace = pickBestPlace(
    allPlaces,
    funCategories,
    100,
    usedIds,
    preferences,
    prevStop?.place.lat,
    prevStop?.place.lng,
  );

  if (!newPlace) return route;
  const dist = prevStop
    ? getDistanceBetween(prevStop.place.lat, prevStop.place.lng, newPlace.lat, newPlace.lng)
    : 0;

  const newStops = [...route.stops];
  newStops[boringIdx] = {
    ...route.stops[boringIdx],
    place: newPlace,
    reason: '🎉 Upgraded for maximum fun!',
    distanceFromPrev: boringIdx === 0 ? 'Start' : formatDistance(dist),
    travelTimeFromPrev: boringIdx === 0 ? '' : estimateWalkTime(dist),
  };

  const totalCost = newStops.reduce((sum, s) => sum + s.place.estimatedCost, 0);
  return { ...route, stops: newStops, totalCost };
}

// ── Recalculate Distances ────────────────────────────────────────────

export function recalcDistances(stops: RouteStop[]): RouteStop[] {
  return stops.map((stop, i) => {
    if (i === 0) {
      return { ...stop, order: 0, distanceFromPrev: 'Start', travelTimeFromPrev: '' };
    }
    const prev = stops[i - 1];
    const dist = getDistanceBetween(prev.place.lat, prev.place.lng, stop.place.lat, stop.place.lng);
    return {
      ...stop,
      order: i,
      distanceFromPrev: formatDistance(dist),
      travelTimeFromPrev: estimateWalkTime(dist),
    };
  });
}

// ── Delete Stop ──────────────────────────────────────────────────────

export function deleteStop(route: GeneratedRoute, index: number): GeneratedRoute {
  if (route.stops.length <= 1) return route; // never empty a route
  const filtered = route.stops.filter((_, i) => i !== index);
  const newStops = recalcDistances(filtered);
  const totalCost = newStops.reduce((sum, s) => sum + s.place.estimatedCost, 0);
  const totalMinutes = newStops.reduce((sum, s) => sum + s.place.estimatedMinutes, 0) + (newStops.length - 1) * 8;
  return {
    ...route,
    stops: newStops,
    totalCost,
    totalTime: `~${Math.round(totalMinutes / 5) * 5} min`,
  };
}

// ── Optimize Order (nearest-neighbor TSP) ───────────────────────────

export function optimizeOrder(route: GeneratedRoute, lockedIds: Set<string>): GeneratedRoute {
  const stops = route.stops;
  if (stops.length <= 2) return route;

  // Partition stops
  const lockedWithIdx = stops
    .map((s, i) => ({ stop: s, origIdx: i }))
    .filter(({ stop }) => lockedIds.has(stop.place.id));
  const unlockedStops = stops.filter(s => !lockedIds.has(s.place.id));

  // Nearest-neighbor TSP on unlocked stops only
  const reordered: RouteStop[] = [];
  const visited = new Set<string>();

  // Start from the unlocked stop closest to the first stop in the route
  const firstStop = stops[0];
  let currentLat = firstStop.place.lat;
  let currentLng = firstStop.place.lng;

  for (let step = 0; step < unlockedStops.length; step++) {
    let bestIdx = -1;
    let bestDist = Infinity;
    unlockedStops.forEach((s, i) => {
      if (visited.has(s.place.id)) return;
      const d = getDistanceBetween(currentLat, currentLng, s.place.lat, s.place.lng);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    });
    if (bestIdx === -1) break;
    const chosen = unlockedStops[bestIdx];
    visited.add(chosen.place.id);
    reordered.push(chosen);
    currentLat = chosen.place.lat;
    currentLng = chosen.place.lng;
  }

  // Merge: locked stops return to their original positions; gaps filled with reordered unlocked
  const merged: RouteStop[] = new Array(stops.length);
  lockedWithIdx.forEach(({ stop, origIdx }) => { merged[origIdx] = stop; });

  let unlockedCursor = 0;
  for (let i = 0; i < merged.length; i++) {
    if (!merged[i]) {
      merged[i] = reordered[unlockedCursor++];
    }
  }

  const newStops = recalcDistances(merged.filter(Boolean));
  const totalCost = newStops.reduce((sum, s) => sum + s.place.estimatedCost, 0);
  const totalMinutes = newStops.reduce((sum, s) => sum + s.place.estimatedMinutes, 0) + (newStops.length - 1) * 8;
  return {
    ...route,
    stops: newStops,
    totalCost,
    totalTime: `~${Math.round(totalMinutes / 5) * 5} min`,
  };
}

// ── Make More Chill ──────────────────────────────────────────────────

export function makeMoreChill(
  route: GeneratedRoute,
  allPlaces: Place[],
  preferences: UserPreferences,
  lockedIds: Set<string> = new Set(),
): GeneratedRoute {
  const chillCategories: PlaceCategory[] = ['cafe', 'park', 'bookstore', 'scenic', 'museum'];
  const highEnergyCategories: PlaceCategory[] = ['arcade', 'nightlife', 'activity', 'attraction'];

  // Find first unlocked high-energy stop
  const targetIdx = route.stops.findIndex(s =>
    !lockedIds.has(s.place.id) && highEnergyCategories.includes(s.place.category)
  );
  if (targetIdx === -1) return route;

  return rerollStop(
    route,
    targetIdx,
    allPlaces.filter(p => chillCategories.includes(p.category)),
    preferences,
  );
}
