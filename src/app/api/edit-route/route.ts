import { NextRequest } from 'next/server';
import {
  GeneratedRoute, RouteStop, ScoredPlace, EditRouteRequest, EditRouteResponse, EditIntent,
} from '@/lib/types';
import {
  rerollStop, addWildcardStop, makeCheaper, makeMoreFun, makeMoreChill,
  optimizeOrder, deleteStop,
} from '@/lib/route-engine';
import { getDistanceBetween, formatDistance, estimateWalkTime } from '@/lib/utils';

// ── AI Response Shape ─────────────────────────────────────────────────

interface AIEditResponse {
  updated_stop_ids: string[];                   // full ordered list of stop IDs in the new route
  changed_stop_ids: string[];                   // which IDs are new/replaced
  reason_for_each_change: Record<string, string>;
  overall_reason: string;
}

// ── Prompt Builder ────────────────────────────────────────────────────

function buildEditSystemPrompt(): string {
  return `You are Rally's route editing AI. Rally is a smart local outing generator.
Your job is to intelligently modify an existing outing itinerary based on the user's intent.
You receive the current route and a pool of nearby real places.
You MUST return ONLY valid JSON matching the schema. No markdown. No prose outside JSON.
CRITICAL: You may ONLY use place IDs from either (a) the original route's locked stops or (b) the provided candidate pool. Never invent IDs.`;
}

function buildEditUserPrompt(
  route: GeneratedRoute,
  intent: EditIntent,
  targetStopIndex: number | undefined,
  lockedStopIds: string[],
  candidates: Array<{
    id: string; name: string; category: string; estimatedCost: number;
    estimatedMinutes: number; indoor: boolean; vibeFitScore: number; tags: string[];
  }>,
): string {
  const lockedSet = new Set(lockedStopIds);

  const currentStops = route.stops.map((s, i) => ({
    index: i,
    id: s.place.id,
    name: s.place.name,
    category: s.place.category,
    estimatedCost: s.place.estimatedCost,
    locked: lockedSet.has(s.place.id),
  }));

  const intentInstructions: Record<EditIntent, string> = {
    wildcard: 'Add one surprising, fun, memorable bonus stop that fits the vibe. Append it after the last unlocked stop. Choose something interesting like dessert, a scenic spot, arcade, or local gem.',
    cheaper: 'Find the most expensive UNLOCKED stop and replace it with a cheaper alternative from the candidates. Preserve the route\'s emotional structure.',
    'more-fun': 'Find the least exciting UNLOCKED stop and replace it with something more energetic or memorable. Prefer arcades, attractions, activities, or dessert destinations.',
    shorter: `Remove the longest stop (by estimatedMinutes) that is NOT locked. Return ${route.stops.length - 1} stops total.`,
    'more-chill': 'Find the most high-energy UNLOCKED stop (arcade, nightlife, activity) and replace it with something calmer like a cafe, park, bookstore, or scenic view.',
    'optimize-order': 'Reorder all UNLOCKED stops to improve geographic flow and reduce backtracking. Keep locked stops at their current positions. Do not replace any stops — just reorder.',
    'swap-stop': targetStopIndex !== undefined
      ? `Replace stop at index ${targetStopIndex} ("${route.stops[targetStopIndex]?.place.name}") with a better alternative from the candidates. Keep the same general category if possible.`
      : 'Replace the weakest stop with a better alternative from the candidates.',
  };

  return `Edit this outing route for "${route.vibe}" vibe (${route.groupType}, budget: ~$${route.totalCost}).

CURRENT ROUTE:
${JSON.stringify(currentStops, null, 0)}

LOCKED STOPS (DO NOT change or remove): ${lockedStopIds.length > 0 ? lockedStopIds.join(', ') : 'none'}

EDIT INTENT: ${intentInstructions[intent]}

CANDIDATE POOL (select replacements ONLY from here, or keep original locked IDs):
${JSON.stringify(candidates, null, 0)}

Rules:
- Locked stop IDs MUST appear unchanged in updated_stop_ids
- All non-locked IDs in updated_stop_ids must come from the candidate pool
- No duplicate IDs
- Return ${intent === 'shorter' ? route.stops.length - 1 : intent === 'wildcard' ? route.stops.length + 1 : route.stops.length} stops total
- Preserve narrative flow (good opener, middle, closer)

Return EXACTLY this JSON (no other text):
{
  "updated_stop_ids": ["id1", "id2", ...],
  "changed_stop_ids": ["id_that_was_replaced_or_added"],
  "reason_for_each_change": {"changed_id": "why this change improves the route"},
  "overall_reason": "One sentence summary of what changed and why it improves the outing"
}`;
}

// ── Validation ────────────────────────────────────────────────────────

function validateEditResponse(
  data: unknown,
  validNewIds: Set<string>,
  lockedIds: Set<string>,
  originalIds: string[],
  intent: EditIntent,
  originalCount: number,
): { valid: boolean; reason: string } {
  if (!data || typeof data !== 'object') return { valid: false, reason: 'Not an object' };
  const d = data as Record<string, unknown>;

  if (!Array.isArray(d.updated_stop_ids)) return { valid: false, reason: 'updated_stop_ids missing or not array' };

  const expectedCount =
    intent === 'shorter' ? originalCount - 1 :
    intent === 'wildcard' ? originalCount + 1 :
    originalCount;

  if (d.updated_stop_ids.length !== expectedCount) {
    return { valid: false, reason: `Expected ${expectedCount} stops, got ${d.updated_stop_ids.length}` };
  }
  if (new Set(d.updated_stop_ids).size !== d.updated_stop_ids.length) {
    return { valid: false, reason: 'Duplicate IDs in updated_stop_ids' };
  }

  const originalIdSet = new Set(originalIds);
  for (const id of d.updated_stop_ids as string[]) {
    if (!lockedIds.has(id) && !validNewIds.has(id) && !originalIdSet.has(id)) {
      return { valid: false, reason: `ID "${id}" not in candidate pool or original route` };
    }
  }

  // All locked IDs must be present
  for (const lockedId of lockedIds) {
    if (!(d.updated_stop_ids as string[]).includes(lockedId)) {
      return { valid: false, reason: `Locked stop "${lockedId}" was removed` };
    }
  }

  return { valid: true, reason: '' };
}

// ── Assemble Route from AI Result ─────────────────────────────────────

function assembleRoute(
  aiResult: AIEditResponse,
  originalRoute: GeneratedRoute,
  candidateMap: Map<string, ScoredPlace>,
): GeneratedRoute {
  const originalStopMap = new Map(originalRoute.stops.map(s => [s.place.id, s]));
  const stops: RouteStop[] = [];
  let prevLat: number | undefined;
  let prevLng: number | undefined;

  for (let i = 0; i < aiResult.updated_stop_ids.length; i++) {
    const id = aiResult.updated_stop_ids[i];
    // Use original stop if available (preserves completed, rating, etc.)
    const original = originalStopMap.get(id);
    const place = original?.place ?? candidateMap.get(id);
    if (!place) continue;

    const dist = prevLat !== undefined && prevLng !== undefined
      ? getDistanceBetween(prevLat, prevLng, place.lat, place.lng)
      : 0;

    const aiReason = aiResult.reason_for_each_change?.[id];
    const isChanged = aiResult.changed_stop_ids?.includes(id);

    stops.push({
      ...(original ?? {}),
      place,
      order: i,
      reason: isChanged && aiReason ? aiReason : (original?.reason ?? 'Part of your outing.'),
      aiReason: aiReason || original?.aiReason,
      distanceFromPrev: i === 0 ? 'Start' : formatDistance(dist),
      travelTimeFromPrev: i === 0 ? '' : estimateWalkTime(dist),
      completed: original?.completed ?? false,
    });

    prevLat = place.lat;
    prevLng = place.lng;
  }

  const totalCost = stops.reduce((sum, s) => sum + s.place.estimatedCost, 0);
  const totalMinutes = stops.reduce((sum, s) => sum + s.place.estimatedMinutes, 0) + Math.max(0, stops.length - 1) * 8;

  return {
    ...originalRoute,
    stops,
    totalCost,
    totalTime: `~${Math.round(totalMinutes / 5) * 5} min`,
    aiGenerated: true,
  };
}

// ── Call OpenRouter ───────────────────────────────────────────────────

async function callOpenRouter(systemPrompt: string, userPrompt: string): Promise<unknown> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_CONVEX_SITE_URL || 'https://rally.app',
      'X-Title': 'Rally Route Editor',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.65,
      max_tokens: 800,
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

// ── Deterministic Fallback ────────────────────────────────────────────

function deterministicFallback(
  route: GeneratedRoute,
  intent: EditIntent,
  targetStopIndex: number | undefined,
  candidates: ScoredPlace[],
  lockedIds: Set<string>,
  prefs: EditRouteRequest['preferences'],
): GeneratedRoute {
  switch (intent) {
    case 'wildcard':
      return addWildcardStop(route, candidates, prefs);
    case 'cheaper':
      return makeCheaper(route, candidates, prefs);
    case 'more-fun':
      return makeMoreFun(route, candidates, prefs);
    case 'shorter': {
      // Remove the longest unlocked stop
      const idx = route.stops.reduce((bestIdx, s, i) => {
        if (lockedIds.has(s.place.id)) return bestIdx;
        return s.place.estimatedMinutes > (route.stops[bestIdx]?.place.estimatedMinutes ?? 0) ? i : bestIdx;
      }, -1);
      return idx >= 0 ? deleteStop(route, idx) : route;
    }
    case 'more-chill':
      return makeMoreChill(route, candidates, prefs, lockedIds);
    case 'optimize-order':
      return optimizeOrder(route, lockedIds);
    case 'swap-stop':
      return targetStopIndex !== undefined
        ? rerollStop(route, targetStopIndex, candidates, prefs)
        : route;
    default:
      return route;
  }
}

// ── Main POST Handler ─────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: EditRouteRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { route, intent, targetStopIndex, lockedStopIds, preferences, candidatePool } = body;

  if (!route || !intent || !preferences) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const lockedSet = new Set(lockedStopIds ?? []);
  const originalIds = route.stops.map(s => s.place.id);

  // Skip AI if pool is too small or no API key
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || !candidatePool || candidatePool.length < 3) {
    const fallback = deterministicFallback(
      route, intent, targetStopIndex, candidatePool ?? [], lockedSet, preferences
    );
    const response: EditRouteResponse = {
      route: fallback,
      changedStopIds: [],
      reason: getFallbackReason(intent),
    };
    return Response.json(response);
  }

  // Build candidate map and top candidates for prompt
  const topCandidates = [...candidatePool]
    .sort((a, b) => (b.vibeFitScore ?? 0) - (a.vibeFitScore ?? 0))
    .slice(0, 35)
    .map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      estimatedCost: p.estimatedCost,
      estimatedMinutes: p.estimatedMinutes,
      indoor: p.indoor,
      vibeFitScore: p.vibeFitScore,
      tags: p.tags.slice(0, 3),
    }));

  const candidateMap = new Map<string, ScoredPlace>(candidatePool.map(p => [p.id, p]));
  const validNewIds = new Set(candidatePool.map(p => p.id));

  const systemPrompt = buildEditSystemPrompt();
  const userPrompt = buildEditUserPrompt(route, intent, targetStopIndex, lockedStopIds, topCandidates);

  let aiResult: unknown;
  let validation = { valid: false, reason: '' };

  // Attempt 1
  try {
    aiResult = await callOpenRouter(systemPrompt, userPrompt);
    validation = validateEditResponse(aiResult, validNewIds, lockedSet, originalIds, intent, route.stops.length);
  } catch (err) {
    console.error('[edit-route] AI attempt 1 failed:', err);
  }

  // Attempt 2 (retry with failure reason)
  if (!validation.valid && aiResult !== undefined) {
    try {
      const retryPrompt = `${userPrompt}\n\nYour previous response failed validation: ${validation.reason}. Please fix this and try again.`;
      aiResult = await callOpenRouter(systemPrompt, retryPrompt);
      validation = validateEditResponse(aiResult, validNewIds, lockedSet, originalIds, intent, route.stops.length);
    } catch (err) {
      console.error('[edit-route] AI attempt 2 failed:', err);
    }
  }

  if (validation.valid && aiResult) {
    const edited = aiResult as AIEditResponse;
    const newRoute = assembleRoute(edited, route, candidateMap);
    const response: EditRouteResponse = {
      route: newRoute,
      changedStopIds: edited.changed_stop_ids ?? [],
      reason: edited.overall_reason ?? getFallbackReason(intent),
      perStopReasons: edited.reason_for_each_change,
    };
    return Response.json(response);
  }

  // Deterministic fallback
  console.warn('[edit-route] AI failed validation, using deterministic fallback for intent:', intent);
  const fallback = deterministicFallback(route, intent, targetStopIndex, candidatePool, lockedSet, preferences);
  const response: EditRouteResponse = {
    route: fallback,
    changedStopIds: [],
    reason: getFallbackReason(intent),
  };
  return Response.json(response);
}

function getFallbackReason(intent: EditIntent): string {
  const reasons: Record<EditIntent, string> = {
    wildcard: 'Added a surprise stop to keep things interesting.',
    cheaper: 'Swapped in a more budget-friendly option.',
    'more-fun': 'Upgraded a stop for more energy and fun.',
    shorter: 'Removed a stop to tighten the route.',
    'more-chill': 'Swapped in a calmer stop for a more relaxed pace.',
    'optimize-order': 'Reordered stops for better geographic flow.',
    'swap-stop': 'Swapped in a nearby alternative for this stop.',
  };
  return reasons[intent];
}
