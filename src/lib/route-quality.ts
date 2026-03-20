import { GeneratedRoute, UserPreferences, ScoredPlace, RouteQualityResult } from './types';

const CLOSER_CATEGORIES = ['restaurant', 'bar', 'nightlife', 'dessert', 'scenic', 'attraction'];
const BUDGET_MAP: Record<string, number> = {
  'under-15': 15,
  'under-30': 30,
  'under-60': 60,
  'flexible': 999,
};

export function computeRouteQuality(
  route: GeneratedRoute,
  prefs: UserPreferences,
): RouteQualityResult {
  const stops = route.stops;
  if (stops.length === 0) {
    return { score: 0, label: 'Rough Draft', breakdown: { variety: 0, coherence: 0, budgetFit: 0, closingStrength: 0, chainPenalty: 0 } };
  }

  // Variety: unique categories / stop count → 0–25
  const uniqueCats = new Set(stops.map(s => s.place.category)).size;
  const variety = Math.min(uniqueCats / stops.length, 1.0) * 25;

  // Coherence: average vibeFitScore → 0–25
  const avgVibeFit =
    stops.reduce((sum, s) => sum + ((s.place as ScoredPlace).vibeFitScore ?? 5), 0) / stops.length;
  const coherence = (avgVibeFit / 10) * 25;

  // Budget fit → 0–25
  const budgetMax = BUDGET_MAP[prefs.budget] ?? 30;
  const budgetFit =
    route.totalCost <= budgetMax
      ? 25
      : Math.max(0, 25 - (route.totalCost - budgetMax) * 0.5);

  // Closing strength: last stop in a high-vibe category → 10 or 25
  const lastCat = stops[stops.length - 1]?.place.category;
  const closingStrength = CLOSER_CATEGORIES.includes(lastCat) ? 25 : 10;

  // Chain penalty: -3 per chain stop
  const chainCount = stops.filter(s => (s.place as ScoredPlace).likelyChain).length;
  const chainPenalty = chainCount * 3;

  const raw = variety + coherence + budgetFit + closingStrength - chainPenalty;
  const score = Math.min(100, Math.max(0, Math.round(raw)));

  const label: RouteQualityResult['label'] =
    score >= 86 ? 'Elite Route' :
    score >= 71 ? 'Strong Night' :
    score >= 56 ? 'Solid Plan' :
    score >= 41 ? 'Getting There' :
    'Rough Draft';

  return {
    score,
    label,
    breakdown: { variety, coherence, budgetFit, closingStrength, chainPenalty },
  };
}

export function getQualityColor(label: RouteQualityResult['label']): string {
  switch (label) {
    case 'Elite Route':  return 'text-rally-400';
    case 'Strong Night': return 'text-emerald-400';
    case 'Solid Plan':   return 'text-blue-400';
    case 'Getting There': return 'text-yellow-400';
    default:             return 'text-text-muted';
  }
}

export function getQualityBarColor(label: RouteQualityResult['label']): string {
  switch (label) {
    case 'Elite Route':  return 'from-rally-500 to-rally-pink';
    case 'Strong Night': return 'from-emerald-500 to-teal-400';
    case 'Solid Plan':   return 'from-blue-500 to-cyan-400';
    case 'Getting There': return 'from-yellow-500 to-amber-400';
    default:             return 'from-white/20 to-white/10';
  }
}

export function getWeakestFactor(breakdown: RouteQualityResult['breakdown']): string {
  const factors = [
    { name: 'variety', value: breakdown.variety, hint: 'Try adding stops from different categories' },
    { name: 'coherence', value: breakdown.coherence, hint: 'Some stops don\'t fit the vibe well — try Swap or Reroll' },
    { name: 'budgetFit', value: breakdown.budgetFit, hint: 'Route is over budget — try Make Cheaper' },
    { name: 'closingStrength', value: breakdown.closingStrength, hint: 'Weak closer — move a restaurant or bar to the end' },
  ];
  // Sort by value ascending, skip chainPenalty (handled separately)
  factors.sort((a, b) => a.value - b.value);
  return factors[0].hint;
}
