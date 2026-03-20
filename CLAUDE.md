# Rally MVP — Project Guide

Rally is a location-based outing generator built with Next.js 15, TypeScript, Tailwind CSS, and Framer Motion. It uses **Clerk** for authentication and **Convex** as the backend/database, with `localStorage` preserved as a session cache and guest fallback.

## 🚀 Commands

- **Dev Server**: `npm run dev` (running on port 3000)
- **Convex Dev**: `npx convex dev` (run in parallel with dev server)
- **Production Build**: `npm run build`
- **Linting**: `npm run lint`
- **Type Checking**: `npx tsc --noEmit`
- **Dependency Clean**: `del /s /q node_modules package-lock.json && npm install` (Windows)

## 🔐 Auth & Backend

### Clerk (Authentication)

- Provider: `ClerkProvider` wraps `<html>` in `src/app/layout.tsx` (server-safe in Clerk v5)
- Sign-in page: `/sign-in` (`src/app/sign-in/[[...sign-in]]/page.tsx`)
- Sign-up page: `/sign-up` (`src/app/sign-up/[[...sign-up]]/page.tsx`)
- Middleware: `src/middleware.ts` — non-blocking, initializes auth context on all routes
- Auth UI: `UserButton` / `SignInButton` in `Navbar.tsx`. Modal mode (`mode="modal"`) used throughout so users never leave their current page.
- **Clerk v5 note**: `afterSignOutUrl` prop was removed. Use `NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL` env var instead.
- Guest experience is fully preserved — all pages work without sign-in.

### Convex (Database & Backend)

- Client provider: `src/components/providers/ConvexClientProvider.tsx` — `'use client'`, uses `ConvexProviderWithClerk` from `convex/react-clerk`
- `ConvexReactClient` is instantiated **outside** the component to prevent re-instantiation on re-renders
- Import generated API with path alias: `import { api } from '@convex/_generated/api'`
- **Always read `convex/_generated/ai/guidelines.md` before writing Convex code**

### Provider Nesting Order (layout.tsx)

```text
ClerkProvider         ← wraps <html> (server-safe)
  ConvexClientProvider  ← 'use client', inside <body>
    DataMigrationProvider  ← mounts migration hooks globally
      {children}
```

### Data Migration (localStorage → Convex)

- `src/hooks/useEnsureUser.ts` — runs `createOrUpdateUser` mutation on every sign-in
- `src/hooks/useDataMigration.ts` — one-time migration triggered when `convexUser.localDataImported === false`
  - Runs all `importLocal*` mutations in parallel
  - Uses `useRef` to prevent React Strict Mode double-fire
  - Non-fatal — retries next session on error
- **localStorage is NOT cleared after migration** — it remains as a session cache and guest fallback

## 🗄️ Convex Schema (`convex/schema.ts`)

5 tables:

- **`users`** — Clerk user data + stats (routesCompleted, streak, referralCode, localDataImported). Index: `by_clerk_id`.
- **`savedRoutes`** — saved route records. `routeData: v.any()` stores full JSON; denormalized fields (`title`, `vibe`, `city`) enable list queries. Indexes: `by_user`, `by_user_and_route`.
- **`routeHistory`** — completed route records. Same pattern as savedRoutes. Indexes: `by_user`, `by_user_and_route`.
- **`userPreferences`** — all `UserPreferences` fields. Index: `by_user`.
- **`userBadges`** — earned badge records. Indexes: `by_user`, `by_user_and_badge`.

## 🗄️ Convex Functions

- `convex/users.ts` — `getCurrentUser`, `createOrUpdateUser` (upsert on clerkId), `updateUserProfile`, `markLocalDataImported`, `updateStreak`
- `convex/savedRoutes.ts` — `getSavedRoutes`, `saveRoute` (idempotent by routeId), `unsaveRoute`, `importLocalRoutes`
- `convex/routeHistory.ts` — `getHistory` (max 50), `addHistoryEntry` (idempotent, increments routesCompleted), `importLocalHistory`
- `convex/preferences.ts` — `getPreferences`, `updatePreferences` (upsert)
- `convex/badges.ts` — `getBadges`, `updateBadge` (upsert), `importLocalBadges`

## 🎛️ Route Editor Studio (Phase 12)

Rally's `/route` page has been upgraded from a basic 503-line monolith into a **premium interactive itinerary studio** with AI-powered quick actions, drag-and-drop reordering, real-time map sync, stop locking, route quality metrics, and full undo/redo support.

### Route Editor Architecture

The editor is powered by three core systems:

#### 1. **Central State Hook (`useRouteEditor`)**

- **File**: `src/hooks/useRouteEditor.ts` (~260 lines)
- **Purpose**: Single source of truth for all route mutations and UI state
- **State managed**:
  - `route: GeneratedRoute | null` — current itinerary
  - `undoStack: GeneratedRoute[]` — up to 20 prior snapshots
  - `redoStack: GeneratedRoute[]` — forward history
  - `lockedStopIds: Set<string>` — pinned stops (AI edits skip these)
  - `activeStopIndex: number | null` — highlighted stop on map
  - `isEditing: boolean` — AI call in progress
  - `editingIntent: EditIntent | null` — which action triggered the edit
  - `editReason: string` — why the route changed
  - `alternativesForIndex: number | null` — alternatives panel for which stop
  - `allRevealed: boolean` — all stops animated in
  - `revealed: Set<number>` — which stops have animated in

- **Key pattern - `applyMutation(newRoute, reason)`**:

  ```typescript
  // Push current route to undo stack (keep last 20), clear redo, set new route,
  // sync to localStorage, optionally set edit reason
  setUndoStack(prev => [...prev.slice(-19), route!]);
  setRedoStack([]);
  setRoute(newRoute);
  setCurrentRoute(newRoute); // localStorage sync
  ```

- **Actions** (all return `Promise<void>`):
  - **Synchronous**: `handleComplete(i)`, `handleRate(i, rating)`, `handleReorder(oldIdx, newIdx)`, `handleDeleteStop(i)`, `handleToggleLock(i)`, `handleSetActiveStop(i)`, `handleShowAlternatives(i | null)`, `handleSelectAlternative(i, place)`, `handleUndo()`, `handleRedo()`, `clearEditReason()`
  - **AI-powered async**: `handleRerollAI(i)`, `handleWildcard()`, `handleMakeCheaper()`, `handleMakeMoreFun()`, `handleMakeShorter()`, `handleMakeChill()`, `handleOptimizeOrder()`
  - **Persistence**: `handleSave()`, `handleFinish()`

- **AI action pattern**:

  ```typescript
  async function handleWildcard() {
    if (!route || isEditing) return;
    setIsEditing(true);
    try {
      const res = await fetch('/api/edit-route', {
        method: 'POST',
        body: JSON.stringify({
          route, intent: 'wildcard', lockedStopIds: [...lockedStopIds],
          preferences: getPreferences(), candidatePool: getCandidatePool()?.places ?? []
        })
      });
      const data: EditRouteResponse = await res.json();
      applyMutation(data.route, data.reason);
    } catch {
      // Fallback: deterministic function
      applyMutation(addWildcardStop(route, getAvailablePlaces(route), getPreferences()));
    } finally {
      setIsEditing(false);
    }
  }
  ```

#### 2. **AI Route Editing API (`/api/edit-route`)**

- **File**: `src/app/api/edit-route/route.ts` (~370 lines)
- **Endpoint**: `POST /api/edit-route`
- **Request shape**:

  ```typescript
  interface EditRouteRequest {
    route: GeneratedRoute;
    intent: EditIntent; // 'wildcard'|'cheaper'|'more-fun'|'shorter'|'more-chill'|'optimize-order'|'swap-stop'
    targetStopIndex?: number; // for 'swap-stop'
    lockedStopIds: string[]; // IDs that AI must preserve
    preferences: UserPreferences;
    candidatePool: ScoredPlace[]; // available replacements
  }
  ```

- **Response shape**:

  ```typescript
  interface EditRouteResponse {
    route: GeneratedRoute; // full updated route
    changedStopIds: string[]; // which stops were added/changed
    reason: string; // "Added a wildcard coffee spot to boost variety"
    perStopReasons?: Record<string, string>; // optional per-stop explanations
  }
  ```

- **Processing pipeline**:
  1. **Validation**: Check request shape, candidate pool freshness, locked stop validity
  2. **Prompt construction**:
     - System prompt: Instructs AI that it can only select from locked stops or the provided candidate pool (no hallucinations)
     - User prompt: Shows current route with locked flags, intent-specific instructions ("Replace the most expensive unlocked stop with a cheaper option from candidates"), top 35 candidates sorted by `vibeFitScore`
  3. **OpenRouter call** (same pattern as `/api/plan`): Uses existing `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`
  4. **Validation**: Checks response has correct intent-specific stop count, no duplicates, all new IDs exist in pool, all locked IDs preserved
  5. **Retry**: One automatic retry if validation fails (with failure appended to prompt)
  6. **Fallback**: If AI fails twice, applies deterministic equivalent (see "Intent Fallback Mapping" below)
  7. **Assembly**: Merges AI selections back into full `RouteStop[]`, preserving unchanged stops' `completed` and `rating` fields

- **Intent fallback mapping** (deterministic functions called on AI failure):

  | Intent | Fallback Function |
  | --- | --- |
  | `wildcard` | `addWildcardStop()` |
  | `cheaper` | `makeCheaper()` |
  | `more-fun` | `makeMoreFun()` |
  | `shorter` | `deleteStop(route, longestStopIndex)` |
  | `more-chill` | `makeMoreChill()` |
  | `optimize-order` | `optimizeOrder()` |
  | `swap-stop` | `rerollStop(route, targetStopIndex)` |

#### 3. **Route Quality Scoring (`route-quality.ts`)**

- **File**: `src/lib/route-quality.ts`
- **Purpose**: Evaluate route quality on a 0–100 scale with detailed breakdown
- **Main export**:

  ```typescript
  export function computeRouteQuality(route: GeneratedRoute, prefs: UserPreferences): RouteQualityResult
  ```

  Returns:

  ```typescript
  interface RouteQualityResult {
    score: number; // 0–100
    label: 'Rough Draft' | 'Getting There' | 'Solid Plan' | 'Strong Night' | 'Elite Route';
    breakdown: {
      variety: number; // unique categories / stop count × 25
      coherence: number; // avg vibeFitScore / 10 × 25
      budgetFit: number; // 25 if under budget, degrades otherwise
      closingStrength: number; // 25 if last stop is restaurant/bar/dessert/nightlife/scenic/attraction, else 10
      chainPenalty: number; // −3 per chain stop
    };
  }
  ```

- **Helper exports**:
  - `getQualityColor(label)` → Tailwind text color class (gray / yellow / green / purple)
  - `getQualityBarColor(label)` → Tailwind gradient class for score bar animation
  - `getWeakestFactor(breakdown)` → Human-readable improvement hint (e.g., "Add more variety by swapping a chain restaurant for an indie spot")

### Route Editor Components

Five new purpose-built components compose the editor UI:

#### **`RouteMap.tsx`** (Reactive MapLibre Integration)

- **File**: `src/components/route/RouteMap.tsx` (~190 lines)
- **Purpose**: Always-in-sync map showing current itinerary with live marker updates
- **Critical pattern** (two separate effects):

  ```typescript
  // Effect 1: Initialize map ONCE (empty deps)
  useEffect(() => {
    // Create Map instance, load dark tile style, set mapLoaded=true on 'load' event
  }, []);

  // Effect 2: Update markers + polyline on ANY route change
  useEffect(() => {
    // Clear old markers, update GeoJSON polyline source, redraw markers
    // Fit bounds only when stop IDs change (avoid refitting on active highlight)
  }, [route, activeStopIndex, lockedStopIds, mapLoaded, onStopClick]);
  ```

  **Why two effects?** The first ensures the map initializes exactly once (no memory leaks, no remounts). The second stays reactive to all content changes—reordering, locking, AI edits, etc.

- **Marker styles**:
  - **Normal**: Purple/pink gradient (`#a855f7` → `#ec4899`)
  - **Active** (highlighted): Larger (44px), white border glow
  - **Completed**: Green gradient (`#10b981` → `#06b6d4`)
  - **Locked**: Amber background with 🔒 emoji overlay at bottom-right corner

- **Polyline**: Purple dashed line connecting all stops, updated via GeoJSON source

#### **`StopCard.tsx`** (Draggable Sortable Stop)

- **File**: `src/components/route/StopCard.tsx` (~180 lines)
- **Purpose**: Individual stop card with all editing actions
- **Drag-and-drop**: Uses `useSortable` from `@dnd-kit/sortable`
  - `disabled: isLocked` — locked stops cannot be picked up
  - Drag handle: SVG grip dots (⠿) with `listeners` spread from `useSortable`
  - Visual feedback: Drag state adds `shadow-2xl` + `scale(1.02)` via Framer Motion

- **Stop info**: Category emoji (gradient bg), name, category label, address, cost, estimated minutes
- **Metadata**: Distance from previous stop, travel time, lock status, tags (first 3)
- **Reason text**: Base reason + italic AI reason (if different from base)
- **Action chips** (horizontally scrollable on mobile):
  1. **Mark done** (✓ or "Mark done") — toggle completed state
  2. **Swap** (🎲) — AI reroll; `disabled` when isEditing
  3. **Alternatives** (✦) — opens bottom sheet to browse same-category options; `disabled` when isEditing
  4. **Directions** (🧭) — link to Google Maps at stop coords
  5. **Delete** (✕) — removes stop, recalculates route; only visible if not locked

- **Lock button**: Top-right corner of card, toggle lock icon (🔒 filled amber / 🔓 muted), prevents drag and AI edits

- **Editing overlay**: When `isEditing === true`, shows semi-transparent blur with spinner + "Updating…" text (prevents interaction during AI call)

#### **`AlternativesSheet.tsx`** (Bottom Sheet Alternative Finder)

- **File**: `src/components/route/AlternativesSheet.tsx` (~160 lines)
- **Purpose**: Slide-up bottom sheet showing 4–5 curated alternative stops
- **Animation**: Framer Motion spring: `initial={{ y: '100%' }}` → `animate={{ y: 0 }}`, exit same
- **Position**: `fixed bottom-0 inset-x-0 z-50 max-h-[65vh]` (above mobile nav, scrollable)
- **Backdrop**: Semi-transparent overlay on tap to close sheet

- **Alternative filtering logic** (`getAlternatives(stopIndex, route)`):

  ```typescript
  // 1. Fetch candidate pool
  const pool = getCandidatePool();
  if (!pool || pool is stale (> 2 hours)) return [];

  // 2. Get target stop category
  const target = route.stops[stopIndex];

  // 3. Filter candidates:
  //    - Not already used in route
  //    - Same category as target
  //    - outingSuitabilityScore > 0
  //    - Sort by vibeFitScore descending
  //    - Take top 5

  // 4. If < 2 results, widen to ANY suitable candidates (by vibeFitScore)
  ```

- **Each alternative card** shows:
  - Category emoji (gradient bg)
  - Name, category label, chain indicator (amber "· chain" if `likelyChain`)
  - Cost estimate in rally-400, cost diff vs current stop (green if cheaper)
  - Vibe fit score (0–10) as colored bar (green ≥7, yellow ≥4, gray <4)
  - Tags (first 3)

#### **`RouteStats.tsx`** (Live Statistics Bar)

- **File**: `src/components/route/RouteStats.tsx` (~60 lines)
- **Purpose**: Horizontally scrolling chip row showing route metrics
- **Chips** (updated reactively on any route change):
  - 💰 Cost estimate (e.g., "~$38")
  - ⏱️ Total time (e.g., "~110 min")
  - 📍 Stop count (e.g., "4 stops")
  - 🏠 Indoor percentage (e.g., "75% indoor")
  - 🧭 Travel mode (Walking / Transit)
  - Category mix (e.g., 🍽️ "2 restaurants", 🎭 "1 museum")

- **Styling**: `no-scrollbar` utility for clean horizontal scroll on mobile

#### **`RouteQualityMeter.tsx`** (Score Visualization)**

- **File**: `src/components/route/RouteQualityMeter.tsx` (~55 lines)
- **Purpose**: Animated score bar + quality label + improvement hint
- **Layout**: `[Quality Label] [Animated Score Bar] [Score Number] [Toggle ▾/▸]`
- **Label color** (dynamic):
  - Gray: Rough Draft
  - Yellow: Getting There
  - Green: Solid Plan / Strong Night
  - Purple: Elite Route

- **Score bar**: Animated fill 0–100% via Framer Motion, gradient `bg-linear-to-r from-rally-500 to-rally-pink`
- **Improve hint** (optional popover):
  - Click toggle to expand/collapse
  - Shows weakest factor from quality breakdown (e.g., "Tip: Add more variety by swapping a chain restaurant for an indie spot")

### Type System Updates

#### **Type Additions** (`src/lib/types.ts`)

```typescript
// ── Route Editor Types ────────────────────────────────────────────────

export type EditIntent =
  | 'wildcard'
  | 'cheaper'
  | 'more-fun'
  | 'shorter'
  | 'more-chill'
  | 'optimize-order'
  | 'swap-stop';

export interface EditRouteRequest {
  route: GeneratedRoute;
  intent: EditIntent;
  targetStopIndex?: number;
  lockedStopIds: string[];
  preferences: UserPreferences;
  candidatePool: ScoredPlace[]; // was Place[]
}

export interface EditRouteResponse {
  route: GeneratedRoute;
  changedStopIds: string[];
  reason: string;
  perStopReasons?: Record<string, string>;
}

export interface RouteQualityResult {
  score: number;
  label: 'Rough Draft' | 'Getting There' | 'Solid Plan' | 'Strong Night' | 'Elite Route';
  breakdown: {
    variety: number;
    coherence: number;
    budgetFit: number;
    closingStrength: number;
    chainPenalty: number;
  };
}
```

#### **Breaking Type Change: `CandidatePool.places`**

- **Before**: `CandidatePool.places: Place[]`
- **After**: `CandidatePool.places: ScoredPlace[]`
- **Why**: Alternatives filtering needs `vibeFitScore` and `outingSuitabilityScore`. Routes from `/api/plan` already include these fields; upgrading the type makes them formally available throughout the editor.
- **Impact**: Any code that constructs `CandidatePool` must now supply scored places. See `src/app/build/page.tsx` fallback for minimal scoring stubs.

### Route Engine Additions

Four new exports in `src/lib/route-engine.ts`:

#### **`recalcDistances(stops: RouteStop[]): RouteStop[]`**
- Pure function: recomputes `distanceFromPrev` and `travelTimeFromPrev` for all stops
- Uses `getDistanceBetween()` + `estimateWalkTime()` from utils
- Called after drag-and-drop reorder and after deleteStop
- Preserves `completed` and `rating` fields

#### **`deleteStop(route: GeneratedRoute, index: number): GeneratedRoute`**
- Filters out stop at index
- Remaps all `.order` fields to maintain sequence
- Calls `recalcDistances` on remaining stops
- Recalculates `totalCost`, `totalTime`
- Returns updated route

#### **`optimizeOrder(route: GeneratedRoute, lockedIds: Set<string>): GeneratedRoute`**
- **Nearest-neighbor TSP algorithm**:
  1. Separates route into locked (pinned) and unlocked stops
  2. Finds nearest-neighbor path for unlocked stops only
  3. Merges back: locked stops stay at original indices, gaps filled with reordered unlocked
  4. Calls `recalcDistances` to update distances
- Respects stop locking — locked stops never move
- Returns optimized route

#### **`makeMoreChill(route: GeneratedRoute, allPlaces: Place[], preferences: UserPreferences, lockedIds: Set<string>): GeneratedRoute`**
- Finds highest-energy unlocked stop (e.g., nightlife, busy attraction)
- Replaces with lower-energy alternative from allPlaces
- Used as fallback for `more-chill` intent if AI unavailable

### Updated `/route` Page

- **File**: `src/app/route/page.tsx` (~440 lines, full rewrite)
- **State management**: Imports `useRouteEditor()` hook for all mutations
- **Drag-and-drop**: Wraps stop list in `DndContext` + `SortableContext`
  - Sensor: `PointerSensor` with 8px activation constraint (touch-friendly)
  - `handleDragEnd`: Validates that locked stops don't get displaced, calls `handleReorder`

- **Quick actions grid** (7 buttons, 2×2 on mobile, 4-col on sm:):
  1. 🎲 **Wildcard** — Add random suitable stop
  2. 💸 **Cheaper** — Swap expensive stop for budget option
  3. 🎉 **More Fun** — Boost vibe with higher-energy stops
  4. 🌿 **More Chill** — Reduce intensity, more relaxing stops
  5. 🗺️ **Optimize Order** — Reorder for shorter travel time
  6. ⏱️ **Shorter** — Delete longest stop
  7. ❤️ **Save** — Persist to localStorage + Convex

- **Loading states**:
  - When `isEditing === true`, all stop cards show overlay with spinner
  - Quick action buttons show spinner on active action
  - EditReason banner appears below header with dismissible `✕`

- **Progress bar**: Animated fill showing completed stops / total stops
- **Undo/Redo bar**: Visible only when `canUndo || canRedo`
- **AlternativesSheet**: Rendered at page level, controlled by `alternativesForIndex` state
- **Sticky bottom CTA**: "Finish Route" + "Build Another"

### Dependency Addition

- **Package**: Added `@dnd-kit/core@latest`, `@dnd-kit/sortable@latest`, `@dnd-kit/utilities@latest`
- **Installation**: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- **Note**: Minor peer dependency warnings expected but functionality unaffected with React 19

## 🧠 AI Planning & Intelligent Routing (Phases 1-11)

### Major Bugs Fixed

1. **Wrong-City Bug**: Removed hardcoded NYC fallback (`{ lat: 40.7484, lng: -73.9857, city: 'New York' }`) from `/build` page. Now shows honest "sparse area" warning when places query returns < 3 results, preventing silent fallback to mock data.

2. **Silent Mock Data Fallback**: Replaced all `getMockPlaces()` fallbacks with explicit candidate pool checks. Reroll/wildcard/modifier actions now fail gracefully with empty pool message instead of silently serving NYC data.

3. **Location Accuracy Reporting**: Full end-to-end tracking of location accuracy and source (precise/cached/manual/demo), visible in DiagnosticsPanel and location cards on `/build` page.

4. **Route Planning Quality**: Introduced multi-factor scoring (outingSuitability + vibeFit) with chain detection and unsuitable keyword filtering, replacing naive random selection.

5. **AI Hallucination Prevention**: `/api/plan` can only select stops from real Overpass candidates—never generates fake places.

### New Features (Phase 1-11 Implementation)

Rally now features **AI-powered route planning** with intelligent location tracking and smart candidate selection:

#### Location Intelligence

- **`LocationSource`** type: `'precise'` | `'cached'` | `'manual'` | `'demo'`
- **Geolocation API** (`src/lib/geolocation.ts`) now uses:
  - `watchPosition` with `enableHighAccuracy: true`
  - 200m accuracy threshold or 8s timeout
  - Auto-stamps location with source type and timestamp
  - Fallback to demo location on denial/error

- **`useGeolocation`** hook exposes:
  - `location` with lat/lng/accuracy/source/timestamp
  - `isStale` flag (detects cached locations)
  - `useManualLocation(lat, lng, city, neighborhood?)` callback for user overrides

#### Candidate Scoring & Filtering

- **`src/lib/candidate-scorer.ts`** (new pure logic file):
  - `CHAIN_KEYWORDS` (~30 major chains: Starbucks, McDonald's, Subway, etc.)
  - `UNSUITABLE_NAME_KEYWORDS` (~35 service/corporate: tailor, dental, bank, pharmacy, etc.)
  - `VIBE_FIT_MAP`: 10 vibes × 13 categories scored 0-10 (e.g., "romantic" gets high scores for restaurants, bars, museums; low for gyms, hardware stores)
  - `prepareCandidates(places, vibe)` pipeline: scores → filters unsuitable → deduplicates chain brands
  - `ScoredPlace` type extends `Place` with outingSuitabilityScore, vibeFitScore, likelyChain, exclusionReason

#### AI Route Planning

- **`/api/plan` POST endpoint** (`src/app/api/plan/route.ts`):
  - Takes: `{ lat, lng, radius, vibe, preferences, city, neighborhood? }`
  - Pipeline: fetch Overpass → score candidates → call OpenRouter (if key set) → validate JSON → deterministic fallback
  - Uses top 40 candidates by vibeFitScore for AI prompt
  - **Key constraint**: AI can only SELECT from real Overpass candidates — never hallucinate
  - Validates: correct stop count, all IDs exist in pool, no duplicates
  - Retries once with failure reason on invalid response
  - Returns `GeneratedRoute` with `aiGenerated: true`, `aiReason` per stop, `aiReasonForOrder`, `aiBudgetSummary`, `aiTimeSummary`

#### Route Reroll System

- **`CandidatePool`** stored in localStorage alongside active route:
  - `{ places: ScoredPlace[], fetchedAt: number, lat: number, lng: number, radius: number }`
  - Key: `'rally-candidate-pool'`
  - Reroll/wildcard actions use pool if < 2 hours old
  - Falls back to getMockPlaces() for demo only
- **Reroll handlers** now call `getAvailablePlaces(route)` to respect pool staleness

#### AI Transparency & Debugging

- **AI Badge**: Routes show `✦ AI Planned` badge when `aiGenerated: true`
- **AI Reason Display**: Each stop shows italic `aiReason` text when different from base `reason`
- **Diagnostics Panel** (`src/components/dev/DiagnosticsPanel.tsx`):
  - Dev-only overlay (hidden in production)
  - Shows location: lat/lng/accuracy/source/timestamp with color coding
  - Shows candidate pool: size/age/staleness/lat/lng/radius
  - Shows route: title/stop count/AI generated flag/stop IDs
  - Amber ⚙ toggle button in bottom-right corner

## 🗺️ Project Architecture

### Core Persistence & Logic (`src/lib/`)

- `types.ts`: Core type definitions including `LocationSource`, `LocationData`, `ScoredPlace`, `CandidatePool`, `GeneratedRoute` with AI fields, `RouteStop` with `aiReason`.
- `geolocation.ts`: Browser Geolocation API wrapper with `watchPosition`, high accuracy, 200m threshold, location source stamping. Returns location with accuracy, timestamp, and source type.
- `storage.ts`: `localStorage` layer for routes, history, profile, badges, and candidate pools. Functions: `getCandidatePool()`, `setCandidatePool()`.
- `candidate-scorer.ts`: **NEW FILE** — Pure logic for candidate evaluation: `CHAIN_KEYWORDS`, `UNSUITABLE_NAME_KEYWORDS`, `VIBE_FIT_MAP` (10 vibes × 13 categories), `prepareCandidates()`, `filterForOuting()`, `scoreCandidates()` functions.
- `overpass.ts`: **NEW FILE** — Extracted Overpass API logic: `fetchOverpassPlaces(lat, lng, radius)`, `OSM_CATEGORY_MAP`, utility functions for price/cost/time estimation.
- `route-engine.ts`: The "brain" — maps vibes to categories and logic for stop selection, rerolls, and modifiers. Updated `pickBestPlace()` to use `vibeFitScore` as primary sort.
- `constants.ts`: Design tokens, vibe definitions, feature packs, and badge criteria. Contains `ALL_BADGES` used to render unearned badge placeholders. Added `CANDIDATE_POOL` storage key.
- `mock-data.ts`: High-quality fallback data for demo mode (NYC focus).

### Hooks (`src/hooks/`)

- `useGeolocation.ts`: Managed location state with `watchPosition`, permission handling, and demo mode toggle. Exposes: `location` (with accuracy/timestamp/source), `loading`, `permissionState`, `requestLocation()`, `useDemo()`, `useManualLocation(lat, lng, city, neighborhood?)`, `isStale` flag. Caches location with source:'cached' stamp on mount.
- `useLocalStorage.ts`: SSR-safe persistence hook.
- `useEnsureUser.ts`: Ensures Convex user doc is created/updated on every Clerk sign-in.
- `useDataMigration.ts`: One-time localStorage → Convex data migration.

### Components (`src/components/`)

- `auth/AuthPrompt.tsx`: Inline animated auth gate for protected pages. Shows `SignUpButton` + `SignInButton` in modal mode. Used on Profile, History, and Saved pages for guests.
- `providers/ConvexClientProvider.tsx`: Wraps app with `ConvexProviderWithClerk`.
- `providers/DataMigrationProvider.tsx`: Mounts `useEnsureUser` and `useDataMigration` hooks globally. Also mounts `DiagnosticsPanel` for dev-only visibility.
- `dev/DiagnosticsPanel.tsx`: **NEW FILE** — Dev-only overlay (hidden in production) with amber ⚙ toggle button. Displays: location (lat/lng/accuracy/source with color coding), candidate pool stats (size/age/staleness/radius), route info (title/stop count/AI generated/stop IDs).
- `layout/Navbar.tsx`: Responsive top/bottom navigation. Shows `UserButton` (signed in) or `SignInButton mode="modal"` (guest) in desktop nav. Bottom nav is **60px + safe-area** on mobile.

### API Routes (`src/app/api/`)

- `/api/places`: Thin wrapper around `fetchOverpassPlaces()` from `src/lib/overpass.ts`. Returns scored `Place[]` based on lat/lng and vibe categories.
- `/api/plan`: **NEW ROUTE** — POST endpoint for AI-powered route planning. Takes `{ lat, lng, radius, vibe, preferences, city, neighborhood? }`. Pipeline: fetch Overpass candidates → score with vibeFitScore → call OpenRouter (if key set) → validate JSON → deterministic fallback. Returns `GeneratedRoute` with `aiGenerated` flag and `aiReason` per stop. Retries once on validation failure.
- `/api/geocode`: Reverse geocoding via OpenStreetMap Nominatim.

### Pages & App Structure

- `/`: Landing page with featured tonight and how-it-works.
- `/build`: 4-step multi-page form builder. **Updated**: Removed hardcoded NYC fallback, added `placesFetchStatus` ('idle'|'fetching'|'success'|'sparse'|'error'), added `generatingStage` UI with checkmarks ('location'→'places'→'scoring'→'building'), stores `CandidatePool` in localStorage, calls `/api/plan` when `NEXT_PUBLIC_USE_AI_PLANNING=true`, otherwise calls `generateRoute()`. Location mode labels: precise (green), cached (orange), demo (amber). Accuracy display: "±Xm accuracy". Sparse area warning. Generate button disabled when `!location`.
- `/route`: Main interactive itinerary view. **Updated**: Uses `getAvailablePlaces(route)` helper to fetch candidates from pool (if < 2hrs old) for reroll/wildcard/modifier actions. Shows `✦ AI Planned` badge when `route.aiGenerated`. Displays `stop.aiReason` as italic secondary text when different from base `reason`. `handleSave` and `handleFinish` write to both localStorage and Convex (when signed in).
- `/map`: Full-screen MapLibre GL JS integration with numbered gradient pins. **Updated**: Added desktop recenter button (⊙) that refits bounds to original viewport. TypeScript refs fixed: `mapInstanceRef` and `boundsRef` typed as `useRef<unknown>(null)` with proper type assertions.
- `/profile`: User stats, adventure streaks, and earned badges. Reads from Convex (`getCurrentUser`, `getBadges`). Shows `AuthPrompt` for guests.
- `/history`: Past completed routes. Reads from Convex (`getHistory`). Shows `AuthPrompt` for guests.
- `/saved`: Saved routes. Reads/writes Convex (`getSavedRoutes`, `unsaveRoute`). Shows `AuthPrompt` for guests.
- `/premium` & `/business`: Monetization flow mockups.
- `/sign-in` & `/sign-up`: Clerk auth pages with Rally dark glassmorphism styling.

## 🎨 Design System

### Styling Rules (`src/app/globals.css`)

- **Theme**: Dark mode by default (`#0a0a0f` background, Inter font).
- **Glassmorphism**: Use `.glass-card` for cards and `.glass-card-hover` for interactive elements.
- **Gradients**: Standard "Rally" gradient is `from-rally-500 to-rally-pink`.
- **Mobile-First Principles**:
  - **Safe-Area**: Use `env(safe-area-inset-*)` and utilities like `.pb-safe` for notched devices.
  - **Viewport**: Use `dvh` (dynamic viewport height) for full-screen and sticky layouts.
  - **Touch Targets**: Minimum `48px` for primary buttons, `44px` for secondary buttons, and `36px` for small actions.
  - **Touch Feedback**: Specialized `:active` scale transforms (`scale(0.97)` for buttons, `scale(0.95)` for chips) for haptic-like feel.
  - **Responsiveness**: `touch-action: manipulation` globally to prevent double-tap zoom; `-webkit-tap-highlight-color: transparent`.
  - **Visuals**: Reduced orb sizes (`bg-orb`) on mobile to prevent overflow and save performance.

### Components & Layout Utilities

- `Navbar.tsx`: Responsive top/bottom navigation. Bottom nav is **60px + safe-area** on mobile with full-width touch areas.
- `.sticky-bottom-cta`: Fixed bottom CTA bar that stays above the mobile navigation with a blurred gradient backdrop.
- `.mobile-nav-spacer`: Automatic padding div (`72px + safe-area` on mobile) to prevent fixed nav from covering content.
- `.no-scrollbar`: Utility to hide native scrollbars on carousels/swipeable areas.

## 🛠️ Tech Stack Notes

- **Next.js**: Use App Router (v15+). All pages are `'use client'`. Root layout (`layout.tsx`) is a Server Component.
- **Clerk v5** (`@clerk/nextjs`): `ClerkProvider` is server-safe and wraps `<html>`. Use `useUser`, `SignInButton`, `SignUpButton`, `UserButton` from `@clerk/nextjs`. Modal mode for auth buttons prevents page navigation.
- **Convex**: Use `useQuery` / `useMutation` from `convex/react`. Import via `@convex/_generated/api` (path alias). The `_generated/` folder is auto-created by `npx convex dev` — TypeScript errors on these imports are expected until that command is run.
- **Tailwind CSS v4**: Uses `bg-linear-to-br` (not `bg-gradient-to-br` from v3).
- **MapLibre GL JS**: Used for performant, dark-themed maps. Pins are enlarged (40px) for touch usability.
- **Framer Motion**: Staggered "fadeUp" variants and `AnimatePresence` for fluid step transitions.
- **Overpass API**: Public endpoint for location discovery. Logic handles failures by falling back to high-quality `mock-data.ts`.

## ⚙️ Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ZnVsbC1rYXR5ZGlkLTg2LmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_sxMGWhofws7qZpzkbEGgGtGPjLLWWPaKavLEMz10Vz

# Clerk routing — must match the pages created in src/app/sign-in and src/app/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL=/

# ── Convex ────────────────────────────────────────────────────────────
# Auto-populated by `npx convex dev` — or get from https://dashboard.convex.dev
NEXT_PUBLIC_CONVEX_URL=https://impartial-zebra-957.convex.cloud

# Clerk JWT Issuer URL — from Clerk Dashboard → JWT Templates → Convex template
# Format: https://your-app-slug.clerk.accounts.dev
CLERK_ISSUER_URL=https://full-katydid-86.clerk.accounts.dev

# Deployment used by `npx convex dev`
CONVEX_DEPLOYMENT=dev:impartial-zebra-957 # team: jimmy-mullen, project: rally

NEXT_PUBLIC_CONVEX_SITE_URL=https://impartial-zebra-957.convex.site

# ── OpenRouter (AI Planning) ─────────────────────────────────────────
# Get from: https://openrouter.ai/keys
# Set OPENROUTER_API_KEY to enable AI-powered route planning
# Model examples: "openrouter/auto", "openai/gpt-4-turbo", "anthropic/claude-3-opus"
OPENROUTER_API_KEY=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
OPENROUTER_MODEL=openai/gpt-oss-120b:free

# Enable AI planning in route generation      
# Set to "true" to use /api/plan for intelligent route suggestions
NEXT_PUBLIC_USE_AI_PLANNING=true
```

### New Environment Variables Explained

- **`OPENROUTER_API_KEY`** (secret): API key from OpenRouter for LLM access. Leave empty to disable AI planning.
- **`OPENROUTER_MODEL`**: Model identifier for AI planning (e.g., `openrouter/auto`, `openai/gpt-4-turbo`, `anthropic/claude-3-opus`). Swappable to experiment with different models.
- **`NEXT_PUBLIC_USE_AI_PLANNING`**: Boolean flag to enable/disable AI planning in `/api/plan`. Set to `"true"` (string) to enable. When disabled, route generation uses deterministic algorithm.

## 🏛️ Architectural Decisions & Patterns

### Type Safety Improvements

- **Extended Core Types**: `LocationData`, `RouteStop`, `GeneratedRoute`, `Place` extended with AI fields while maintaining backward compatibility with Convex storage (`aiGenerated?`, `aiReason?`, etc. all optional).
- **LocationSource Type**: Explicit stamping of location origin ('precise' | 'cached' | 'manual' | 'demo') for transparency and debugging.
- **ScoredPlace Type**: Extends `Place` with quality metrics for sorting and filtering without mutating original place data.

### Storage & State Management

- **CandidatePool Pattern**: Paired storage of candidate set with active route (same localStorage key scope) for deterministic reroll behavior within 2-hour staleness window.
- **Location Caching**: localStorage maintains last-known location stamped with source='cached' on page mount, enabling fast initial load while watchPosition improves accuracy in background.

### API Safety

- **Server-Side Validation**: `/api/plan` validates all AI output (stop count, ID existence, no duplicates) before returning to client, with retry on failure.
- **Candidate-Only Selection**: AI prompt includes strict instruction to select only from provided candidates, with JSON schema validation.
- **Deterministic Fallback**: Route generation always succeeds—AI is optional optimization, not requirement.

### UX Transparency

- **Stage-by-Stage Loading**: Generate button shows progress (location→places→scoring→building) with visual checkmarks.
- **Location Mode Labels**: Color-coded source indicators (green=precise, orange=cached, blue=manual, amber=demo).
- **Sparse Area Detection**: Honest messaging when location returns few candidates, no silent fallback.
- **DiagnosticsPanel**: Dev-only overlay for debugging location, pool staleness, and AI decisions.

## 🏅 Badges & Gamification

Badges are defined in `constants.ts` (`ALL_BADGES`) and triggered by actions like saving routes, completing stops, or building specific vibe types. Earned badges are stored in Convex (`userBadges` table); the full `ALL_BADGES` list is merged at render time so unearned badges display correctly (greyed out).

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
