import { NextRequest } from 'next/server';
import { fetchOverpassPlaces } from '@/lib/overpass';
import { prepareCandidates, diversifyCandidates, isFoodCategory } from '@/lib/candidate-scorer';
import { generateRoute } from '@/lib/route-engine';
import {
  Place, UserPreferences, GeneratedRoute, RouteStop, Vibe, ScoredPlace,
} from '@/lib/types';
import { generateId, getDistanceBetween, formatDistance, estimateWalkTime } from '@/lib/utils';
import { ROUTE_TITLES, VIBE_DESCRIPTIONS } from '@/lib/constants';

// ── Request / Response Types ─────────────────────────────────────────

interface PlanRequest {
  lat: number;
  lng: number;
  radius: number;       // meters
  vibe: Vibe;
  preferences: UserPreferences;
  city: string;
  neighborhood?: string;
}

interface AIItineraryResponse {
  route_title: string;
  route_vibe_summary: string;
  selected_stop_ids: string[];
  reason_for_each_stop: Record<string, string>;
  why_the_order_makes_sense: string;
  bonus_stop_id: string | null;
  overall_budget_summary: string;
  overall_time_summary: string;
}

// ── Stop Count by Time ───────────────────────────────────────────────

function getStopCount(time: UserPreferences['timeAvailable']): number {
  switch (time) {
    case '30-min': return 2;
    case '1-hour': return 2;
    case '2-hours': return 3;
    case '3-plus': return 4;
    default: return 3;
  }
}

// ── AI Validation ────────────────────────────────────────────────────

function validateAIResponse(
  data: unknown,
  validIds: Set<string>,
  stopCount: number,
): { valid: boolean; reason?: string } {
  if (!data || typeof data !== 'object') return { valid: false, reason: 'Response is not an object' };
  const d = data as Record<string, unknown>;

  if (!Array.isArray(d.selected_stop_ids)) return { valid: false, reason: 'selected_stop_ids is not an array' };
  if (d.selected_stop_ids.length !== stopCount) {
    return { valid: false, reason: `Expected ${stopCount} stops, got ${d.selected_stop_ids.length}` };
  }
  for (const id of d.selected_stop_ids) {
    if (!validIds.has(id as string)) {
      return { valid: false, reason: `ID "${id}" not found in candidate pool` };
    }
  }
  if (new Set(d.selected_stop_ids).size !== stopCount) {
    return { valid: false, reason: 'Duplicate stop IDs in selection' };
  }
  if (!d.route_title || typeof d.route_title !== 'string') {
    return { valid: false, reason: 'Missing or invalid route_title' };
  }
  if (!d.reason_for_each_stop || typeof d.reason_for_each_stop !== 'object') {
    return { valid: false, reason: 'Missing reason_for_each_stop' };
  }
  return { valid: true };
}

// ── Build AI Prompt ──────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You are Rally's route planning AI. Rally is a smart local outing generator.
Your job is to select and order stops for a fun, coherent real-world outing.
You receive a list of real nearby places fetched from OpenStreetMap.
You MUST return ONLY valid JSON matching the schema. No markdown. No prose outside JSON.`;
}

// ── Variety Validation ───────────────────────────────────────────────

function validateVariety(
  stopIds: string[],
  candidateMap: Map<string, Place>,
  vibe: Vibe,
): { valid: boolean; reason?: string } {
  if (vibe === 'foodie') return { valid: true };

  const categories = stopIds
    .map(id => candidateMap.get(id)?.category)
    .filter(Boolean) as string[];

  const foodCount = categories.filter(c => isFoodCategory(c as Place['category'])).length;
  const maxFood = Math.max(1, Math.floor(stopIds.length * 0.5));

  if (foodCount > maxFood) {
    return {
      valid: false,
      reason: `Too many food/drink stops (${foodCount}/${stopIds.length}). For a ${vibe} outing, include at most ${maxFood} food stop(s) and fill the rest with experiential stops like attractions, museums, parks, scenic spots, or activities.`,
    };
  }
  return { valid: true };
}

// ── Per-Vibe Composition Hints ──────────────────────────────────────

function getVibeCompositionHint(vibe: Vibe, foodRequired: boolean): string {
  const foodNote = foodRequired ? ' You may include 1 restaurant/cafe since food is required.' : '';
  switch (vibe) {
    case 'foodie':
      return 'This is a foodie outing — food-heavy composition is expected and encouraged.';
    case 'date':
      return `Prioritize romantic/experiential stops: scenic viewpoints, museums, parks, unique attractions. Limit food stops to 1 (a closer or midpoint refuel).${foodNote}`;
    case 'artsy':
      return `Lead with museums, galleries, bookstores, and scenic spots. Food should only appear as a support stop (1 max).${foodNote}`;
    case 'outdoorsy':
      return `Focus on parks, scenic spots, and outdoor activities. A cafe or dessert stop is fine as a break, but no restaurants as primary stops.${foodNote}`;
    case 'tourist':
      return `Prioritize attractions, museums, and scenic landmarks. Include at most 1 food stop as a break.${foodNote}`;
    case 'chaotic':
      return `Go wild with arcades, activities, nightlife, and attractions. Food/drink should complement the energy, not dominate.${foodNote}`;
    case 'main-character':
      return `Choose photogenic, iconic, and unique stops: scenic spots, attractions, parks. Limit food to 1 dessert or cafe stop.${foodNote}`;
    case 'cheap':
      return `Focus on free/low-cost experiences: parks, scenic spots, bookstores, museums. Minimize paid food stops.${foodNote}`;
    case 'cozy':
      return `A cozy outing should center around a great cafe or bookstore, with variety from museums or scenic walks. Max 1 restaurant.${foodNote}`;
    case 'rainy-day':
      return `Indoor experiences: museums, bookstores, arcades, activities. A cafe is great as a start/end, but keep food to 1 stop.${foodNote}`;
    default:
      return `Ensure variety — include experiential stops (attractions, museums, parks, scenic, activities) alongside at most 1 food stop.${foodNote}`;
  }
}

function buildUserPrompt(
  stopCount: number,
  prefs: UserPreferences,
  city: string,
  neighborhood: string | undefined,
  candidates: Array<{
    id: string; name: string; category: string; estimatedCost: number;
    estimatedMinutes: number; indoor: boolean; vibeFitScore: number; tags: string[];
  }>,
): string {
  const locationStr = neighborhood ? `${neighborhood}, ${city}` : city;
  const foodLine = prefs.foodRequired ? '\nREQUIRED: Include at least one restaurant or cafe.' : '';
  const attractionLine = prefs.attractionRequired ? '\nREQUIRED: Include at least one attraction or museum.' : '';
  const compositionHint = getVibeCompositionHint(prefs.vibe, prefs.foodRequired);

  return `Plan a ${stopCount}-stop ${prefs.vibe} outing for ${prefs.groupType} in ${locationStr}.
Budget: ${prefs.budget}. Time available: ${prefs.timeAvailable}. Indoor/Outdoor: ${prefs.indoorOutdoor}.${foodLine}${attractionLine}

ROUTE COMPOSITION GUIDE:
${compositionHint}

Planning rules:
- Select ONLY IDs from the candidates list below — never invent places
- No duplicate chain brands (e.g. two Starbucks)
- No utility businesses (tailor, bank, dental, pharmacy, etc.)
- IMPORTANT: Build a real outing, not a meal crawl. Think anchor experience + support stops + a closer
- Vary categories — never put two restaurants/cafes/dessert stops back-to-back
- Create a beginning / middle / end narrative arc
- Prefer local and independent places over generic chains when alternatives exist
- Respect the indoor/outdoor preference
- Consider geographic flow — avoid unnecessary backtracking
- Each stop should add something NEW and DIFFERENT to the experience

Available candidates:
${JSON.stringify(candidates, null, 0)}

Return EXACTLY this JSON schema (no other text):
{
  "route_title": "A catchy, creative title for this specific outing (not generic)",
  "route_vibe_summary": "One evocative sentence describing what this outing feels like",
  "selected_stop_ids": ["id1", "id2", ...],
  "reason_for_each_stop": {"id1": "why this stop was chosen (1-2 sentences)", ...},
  "why_the_order_makes_sense": "Brief explanation of the route's narrative flow",
  "bonus_stop_id": null,
  "overall_budget_summary": "Estimated total spend e.g. '$15-25 total'",
  "overall_time_summary": "Estimated total time e.g. '~2.5 hours'"
}`;
}

// ── Map AI Response to GeneratedRoute ────────────────────────────────

function mapAIResponseToRoute(
  aiResult: AIItineraryResponse,
  candidateMap: Map<string, Place>,
  prefs: UserPreferences,
  city: string,
  neighborhood: string | undefined,
  isDemo: boolean,
): GeneratedRoute {
  const stops: RouteStop[] = [];
  let prevLat: number | undefined;
  let prevLng: number | undefined;

  for (let i = 0; i < aiResult.selected_stop_ids.length; i++) {
    const id = aiResult.selected_stop_ids[i];
    const place = candidateMap.get(id);
    if (!place) continue;

    const dist = prevLat !== undefined && prevLng !== undefined
      ? getDistanceBetween(prevLat, prevLng, place.lat, place.lng)
      : 0;

    const aiReason = aiResult.reason_for_each_stop?.[id];

    stops.push({
      place,
      order: i,
      reason: aiReason || (i === 0 ? 'Starting point.' : 'A great addition to this route.'),
      aiReason,
      distanceFromPrev: i === 0 ? 'Start' : formatDistance(dist),
      travelTimeFromPrev: i === 0 ? '' : estimateWalkTime(dist),
      completed: false,
    });

    prevLat = place.lat;
    prevLng = place.lng;
  }

  // Optionally add bonus stop if provided and valid
  if (aiResult.bonus_stop_id && candidateMap.has(aiResult.bonus_stop_id)) {
    const bonusPlace = candidateMap.get(aiResult.bonus_stop_id)!;
    const lastStop = stops[stops.length - 1];
    const dist = lastStop
      ? getDistanceBetween(lastStop.place.lat, lastStop.place.lng, bonusPlace.lat, bonusPlace.lng)
      : 0;
    const bonusReason = aiResult.reason_for_each_stop?.[aiResult.bonus_stop_id];
    stops.push({
      place: bonusPlace,
      order: stops.length,
      reason: bonusReason || '🎲 Bonus stop — a little extra.',
      aiReason: bonusReason,
      distanceFromPrev: formatDistance(dist),
      travelTimeFromPrev: estimateWalkTime(dist),
      completed: false,
    });
  }

  const totalCost = stops.reduce((sum, s) => sum + s.place.estimatedCost, 0);
  const totalMinutes = stops.reduce((sum, s) => sum + s.place.estimatedMinutes, 0) + Math.max(0, stops.length - 1) * 8;

  const titles = ROUTE_TITLES[prefs.vibe] || ROUTE_TITLES.cozy;
  const descriptions = VIBE_DESCRIPTIONS[prefs.vibe] || VIBE_DESCRIPTIONS.cozy;

  return {
    id: generateId(),
    title: aiResult.route_title || titles[Math.floor(Math.random() * titles.length)],
    vibeDescription: aiResult.route_vibe_summary || descriptions[0],
    stops,
    totalTime: `~${Math.round(totalMinutes / 5) * 5} min`,
    totalCost,
    travelMode: prefs.radius === 'walking' ? 'Walking' : 'Walking + Transit',
    vibe: prefs.vibe,
    groupType: prefs.groupType,
    createdAt: new Date().toISOString(),
    city,
    neighborhood,
    isDemo,
    saved: false,
    aiGenerated: true,
    aiReasonForOrder: aiResult.why_the_order_makes_sense,
    aiBudgetSummary: aiResult.overall_budget_summary,
    aiTimeSummary: aiResult.overall_time_summary,
  };
}

// ── Call OpenRouter ──────────────────────────────────────────────────

async function callOpenRouter(
  systemPrompt: string,
  userPrompt: string,
): Promise<unknown> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_CONVEX_SITE_URL || 'https://rally.app',
      'X-Title': 'Rally Route Planner',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenRouter');

  return JSON.parse(content);
}

// ── Deterministic Variety Repair ─────────────────────────────────────
// If AI output is still food-heavy, swap excess food stops for
// the best available experience candidates.

function repairFoodHeavyRoute(
  route: GeneratedRoute,
  scored: ScoredPlace[],
  candidateMap: Map<string, Place>,
): GeneratedRoute {
  const usedIds = new Set(route.stops.map(s => s.place.id));
  const foodStopIndices = route.stops
    .map((s, i) => ({ index: i, category: s.place.category, score: (candidateMap.get(s.place.id) as ScoredPlace)?.vibeFitScore ?? 0 }))
    .filter(s => isFoodCategory(s.category as Place['category']))
    .sort((a, b) => a.score - b.score); // worst food stops first

  // Keep at most 1 food stop
  const maxFood = 1;
  const toReplace = foodStopIndices.slice(0, Math.max(0, foodStopIndices.length - maxFood));

  // Find replacement experience candidates
  const experienceCandidates = scored
    .filter(p => !isFoodCategory(p.category) && !usedIds.has(p.id) && p.outingSuitabilityScore > 0)
    .sort((a, b) => b.vibeFitScore - a.vibeFitScore);

  const newStops = [...route.stops];
  let replacementIdx = 0;

  for (const { index } of toReplace) {
    if (replacementIdx >= experienceCandidates.length) break;
    const replacement = experienceCandidates[replacementIdx++];
    const oldStop = newStops[index];
    newStops[index] = {
      ...oldStop,
      place: replacement,
      reason: oldStop.aiReason || oldStop.reason,
      aiReason: `Swapped in for better route variety — ${replacement.name} adds a unique experience.`,
    };
    usedIds.add(replacement.id);
  }

  const totalCost = newStops.reduce((sum, s) => sum + s.place.estimatedCost, 0);
  return { ...route, stops: newStops, totalCost };
}

// ── Main POST Handler ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: PlanRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { lat, lng, radius, vibe, preferences, city, neighborhood } = body;

  if (!lat || !lng) {
    return Response.json({ error: 'Missing lat/lng' }, { status: 400 });
  }
  if (!preferences || !vibe) {
    return Response.json({ error: 'Missing preferences or vibe' }, { status: 400 });
  }

  try {
    // Step 1: Fetch real nearby places via Overpass
    const rawPlaces = await fetchOverpassPlaces(lat, lng, radius || 2000);

    // Step 2: Score and filter candidates
    const scored = prepareCandidates(rawPlaces, vibe);

    // Step 3: Try AI planning if key is available
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (apiKey && scored.length >= 3) {
      const stopCount = getStopCount(preferences.timeAvailable);

      // Take top candidates with balanced category diversity
      const diversified = diversifyCandidates(scored, 40, vibe);
      const topCandidates = diversified.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        estimatedCost: p.estimatedCost,
        estimatedMinutes: p.estimatedMinutes,
        indoor: p.indoor,
        vibeFitScore: p.vibeFitScore,
        tags: p.tags.slice(0, 3),
      }));

      const validIds = new Set(topCandidates.map(c => c.id));
      const candidateMap = new Map<string, Place>(
        scored.filter(p => validIds.has(p.id)).map(p => [p.id, p])
      );

      const systemPrompt = buildSystemPrompt();
      const userPrompt = buildUserPrompt(stopCount, preferences, city, neighborhood, topCandidates);

      // Attempt 1
      let aiResult: unknown;
      let validation: { valid: boolean; reason?: string } = { valid: false };
      let varietyCheck: { valid: boolean; reason?: string } = { valid: false };

      try {
        aiResult = await callOpenRouter(systemPrompt, userPrompt);
        validation = validateAIResponse(aiResult, validIds, stopCount);
        if (validation.valid) {
          varietyCheck = validateVariety(
            (aiResult as AIItineraryResponse).selected_stop_ids,
            candidateMap,
            vibe,
          );
        }
      } catch (err) {
        console.error('[plan] AI attempt 1 failed:', err);
      }

      // Attempt 2 (retry with failure reason — structural or variety)
      const needsRetry = !validation.valid || !varietyCheck.valid;
      if (needsRetry) {
        const retryReason = !validation.valid
          ? validation.reason
          : varietyCheck.reason;
        try {
          const retryPrompt = `${userPrompt}\n\nYour previous response was invalid: ${retryReason}. Please fix it and try again.`;
          aiResult = await callOpenRouter(systemPrompt, retryPrompt);
          validation = validateAIResponse(aiResult, validIds, stopCount);
          if (validation.valid) {
            varietyCheck = validateVariety(
              (aiResult as AIItineraryResponse).selected_stop_ids,
              candidateMap,
              vibe,
            );
          }
        } catch (err) {
          console.error('[plan] AI attempt 2 failed:', err);
        }
      }

      if (validation.valid && aiResult) {
        let route = mapAIResponseToRoute(
          aiResult as AIItineraryResponse,
          candidateMap,
          preferences,
          city,
          neighborhood,
          false,
        );

        // If variety still fails after retry, repair deterministically
        if (!varietyCheck.valid && vibe !== 'foodie') {
          route = repairFoodHeavyRoute(route, scored, candidateMap);
        }

        return Response.json(route);
      }

      console.warn('[plan] AI planning failed validation, falling back to deterministic planner');
    }

    // Step 4: Deterministic fallback (uses scored candidates which are filtered/scored)
    const fallbackPlaces: Place[] = scored.length >= 2 ? scored : rawPlaces;
    const route = generateRoute(fallbackPlaces, preferences, city, neighborhood, false);
    return Response.json({ ...route, aiGenerated: false });

  } catch (error) {
    console.error('[plan] Pipeline error:', error);
    return Response.json({ error: 'Failed to generate plan' }, { status: 500 });
  }
}
