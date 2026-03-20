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

7 tables:

- **`users`** — Clerk user data + stats (routesCompleted, streak, referralCode, localDataImported, `stripeCustomerId`). Index: `by_clerk_id`.
- **`savedRoutes`** — legacy saved route records. `routeData: v.any()` stores full JSON; denormalized fields (`title`, `vibe`, `city`) enable list queries. Indexes: `by_user`, `by_user_and_route`.
- **`routeHistory`** — completed route records. Same pattern as savedRoutes. Indexes: `by_user`, `by_user_and_route`.
- **`userPreferences`** — all `UserPreferences` fields. Index: `by_user`.
- **`userBadges`** — earned badge records. Indexes: `by_user`, `by_user_and_badge`.
- **`subscriptions`** — Stripe subscription state (tier, status, priceId, period dates, add-on price IDs). Indexes: `by_user`, `by_stripe_subscription`, `by_stripe_customer`.
- **`plannedRoutes`** — canonical route storage for signed-in users (Phase 14). Fields: `userId`, `routeId` (local generated ID), `title`, `vibe`, `city`, `routeData: v.any()`, `isActive: boolean`, `savedForLater: boolean`, `completedAt?: number`, `createdAt`, `updatedAt`. Indexes: `by_user`, `by_user_and_route_id`, `by_user_and_active`, `by_user_and_saved`.

## 🗄️ Convex Functions

- `convex/users.ts` — `getCurrentUser`, `createOrUpdateUser` (upsert on clerkId), `updateUserProfile`, `markLocalDataImported`, `updateStreak`, `getByClerkId` (internal query used by Stripe routes)
- `convex/savedRoutes.ts` — `getSavedRoutes`, `saveRoute` (idempotent by routeId), `unsaveRoute`, `importLocalRoutes`
- `convex/routeHistory.ts` — `getHistory` (max 50), `addHistoryEntry` (idempotent, increments routesCompleted), `importLocalHistory`
- `convex/preferences.ts` — `getPreferences`, `updatePreferences` (upsert)
- `convex/badges.ts` — `getBadges`, `updateBadge` (upsert), `importLocalBadges`
- `convex/subscriptions.ts` — `getMySubscription` (query), `upsertSubscription` (internal mutation, called by webhook), `cancelSubscription` (internal mutation)
- `convex/plannedRoutes.ts` — **Phase 14** primary route storage. Queries: `getActive`, `listSaved`, `listAll`, `getByRouteId`, `getById`. Mutations: `createOrUpdate` (upserts by userId+routeId, deactivates other active routes), `setSavedForLater`, `markCompleted`. All functions auth via `ctx.auth.getUserIdentity()`.
- `convex/routes.ts` — **Phase 14** cross-table `getRouteDetails` query. Accepts a string document ID, uses `ctx.db.get()` and detects table by field presence: `isActive` → plannedRoutes, `savedAt` → savedRoutes, `finishedAt` → routeHistory. Returns `{ routeData, source, savedForLater, completedAt, title, vibe, city }`.

## ✨ Motion System (Phase 13)

Rally has a **centralized motion system** that all animated components import from. Never define animation variants inline in components — use the shared exports from `src/lib/motion.ts`.

### `src/lib/motion.ts` — Central Motion Config

```typescript
// Easing curves
export const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;
export const EASE_IN_OUT   = [0.42, 0, 0.58, 1] as const;

// Spring presets (pass as `transition` prop)
export const EASE_SPRING_SNAPPY = { type: 'spring', stiffness: 320, damping: 28 };
export const EASE_SPRING_SOFT   = { type: 'spring', stiffness: 200, damping: 24 };
export const EASE_SPRING_BOUNCY = { type: 'spring', stiffness: 400, damping: 18 };

// Duration constants
export const DUR = { fast: 0.15, normal: 0.25, slow: 0.4, verySlow: 0.7 };

// Reusable Framer Motion variants
export const fadeUp         // opacity 0→1, y 20→0, supports custom(i) delay stagger
export const cardReveal     // opacity 0→1, y 30→0, scale 0.96→1
export const slideInRight   // x 40→0
export const slideInLeft    // x -40→0
export const popIn          // scale 0→1 spring bounce
export const scaleIn        // scale 0.85→1
export const fadeIn         // opacity only
export const staggerContainer  // staggerChildren: 0.07, delayChildren: 0.05
export const staggerFast       // staggerChildren: 0.04
```

**Usage pattern:**

```tsx
import { staggerContainer, cardReveal, fadeUp, EASE_SPRING_SNAPPY } from '@/lib/motion';

<motion.div variants={staggerContainer} initial="hidden" whileInView="visible">
  {items.map(item => (
    <motion.div key={item.id} variants={cardReveal}>...</motion.div>
  ))}
</motion.div>
```

### CSS Animation Utilities (`src/app/globals.css`)

New keyframes and utility classes added in Phase 13:

| Class | Effect |
| --- | --- |
| `.animate-glow-pulse` | Continuous box-shadow pulsing (for CTAs) |
| `.animate-bounce-in` | Spring overshoot scale entrance |
| `.skeleton` | Shimmer sweep overlay (for loading states) |
| `.gradient-mesh` | Radial gradient depth layer for hero sections |
| `.glow-border` | Purple/pink border glow on `:hover` |

**Accessibility**: All CSS animations are disabled inside `@media (prefers-reduced-motion: reduce)`.

### Motion Patterns by Component

#### Pages

- **`src/app/page.tsx`** — Hero headline staggered word-by-word; all sections use `staggerContainer` + `cardReveal` with `whileInView`; vibe chips use `whileHover/whileTap` spring; CTA buttons have `animate-glow-pulse`.
- **`src/app/build/page.tsx`** — Orbital loader (two counter-rotating arcs) during generation; spring checkmark pops per stage; sonar-ping rings on location step; `AnimatePresence mode="wait"` stage description fade; progress bar uses `motion.div scaleX` fill.
- **`src/app/route/page.tsx`** — Quick action emoji↔spinner `AnimatePresence mode="wait"` swap; undo/redo bar spring height entrance; "all done" sparkle toast on progress complete; finish screen trophy `animate-bounce-in` + glow blob; save button ❤️↔🤍 animated swap.

#### Route Editor Components

- **`StopCard.tsx`** — `layoutId="active-stop-ring"` shared element glide between cards; left accent bar gradient morph; 🔒↔🔓 rotate-scale `AnimatePresence mode="wait"` swap; editing overlay breathing scale animation.
- **`RouteQualityMeter.tsx`** — Score counter animated with `animate()` standalone (not `useMotionValue`); quality label `AnimatePresence mode="wait"` fade-swap; tip popover scale+opacity entrance.
- **`AlternativesSheet.tsx`** — Handle pulse entrance on open; card list `staggerContainer` + `cardReveal`; VibeFit bar width animates 0→value on mount; empty state `popIn` emoji.
- **`RouteStats.tsx`** — Chips stagger in with `staggerContainer` + `fadeUp`; each chip has `whileHover={{ scale: 1.05, y: -1 }}`.
- **`RouteMap.tsx`** — Skeleton grid-line loader with `.skeleton` shimmer sweep during map load; container entrance `opacity 0, scale 0.98 → 1`.

#### Layout & Auth

- **`Navbar.tsx`** — Logo `whileHover={{ scale: 1.12, rotate: 6 }}`; mobile active tab icon `animate={{ y: [-3, 0] }}` bounce-up on activation.
- **`AuthPrompt.tsx`** — Glow blob pulses behind the icon; full content uses `staggerContainer` + `popIn`/`fadeUp` stagger.

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

### Editor UI Components

Five purpose-built components compose the editor UI:

#### **`RouteMap.tsx`** (Reactive MapLibre Integration)

- **File**: `src/components/route/RouteMap.tsx`
- **Purpose**: Always-in-sync map showing current itinerary with live marker updates
- **Loading state**: Skeleton grid lines + `.skeleton` shimmer sweep while MapLibre loads; container entrance uses `motion.div` scale 0.98→1.
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

- **File**: `src/components/route/StopCard.tsx`
- **Purpose**: Individual stop card with all editing actions
- **Drag-and-drop**: Uses `useSortable` from `@dnd-kit/sortable`
  - `disabled: isLocked` — locked stops cannot be picked up
  - Drag handle: SVG grip dots (⠿) with `listeners` spread from `useSortable`
  - Visual feedback: Drag state adds `shadow-2xl` + `scale(1.02)` via Framer Motion
- **Active highlight**: `layoutId="active-stop-ring"` shared element — the highlight ring glides between cards when `activeStopIndex` changes, rather than snapping.
- **Left accent bar**: `motion.div` with `animate={{ background: gradient }}` — morphs between amber (locked) and purple/pink (default).
- **Lock button**: `AnimatePresence mode="wait"` — 🔒↔🔓 icons swap with a rotate + scale animation.
- **Editing overlay**: `AnimatePresence` entrance + breathing `animate={{ scale: [1, 1.06, 1] }}` pulse on the inner spinner container.
- **Stop info**: Category emoji (gradient bg), name, category label, address, cost, estimated minutes
- **Metadata**: Distance from previous stop, travel time, lock status, tags (first 3)
- **Reason text**: Base reason + italic AI reason (if different from base)
- **Action chips** (horizontally scrollable on mobile):
  1. **Mark done** (✓ or "Mark done") — toggle completed state
  2. **Swap** (🎲) — AI reroll; `disabled` when isEditing
  3. **Alternatives** (✦) — opens bottom sheet to browse same-category options; `disabled` when isEditing
  4. **Directions** (🧭) — link to Google Maps at stop coords
  5. **Delete** (✕) — removes stop, recalculates route; only visible if not locked

#### **`AlternativesSheet.tsx`** (Bottom Sheet Alternative Finder)

- **File**: `src/components/route/AlternativesSheet.tsx`
- **Purpose**: Slide-up bottom sheet showing 4–5 curated alternative stops
- **Animation**: Sheet uses `EASE_SPRING_SOFT` transition; handle bar has pulse-entrance (`scaleX 0.4→1`); alternative cards stagger in with `staggerContainer` + `cardReveal`; VibeFit bar width animates 0→value on mount.
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

- **File**: `src/components/route/RouteStats.tsx`
- **Purpose**: Horizontally scrolling chip row showing route metrics
- **Animation**: Chips stagger in on mount using `staggerContainer` + `fadeUp`; each chip has `whileHover={{ scale: 1.05, y: -1 }}` spring lift.
- **Chips** (updated reactively on any route change):
  - 💰 Cost estimate (e.g., "~$38")
  - ⏱️ Total time (e.g., "~110 min")
  - 📍 Stop count (e.g., "4 stops")
  - 🏠 Indoor percentage (e.g., "75% indoor")
  - 🧭 Travel mode (Walking / Transit)
  - Category mix (e.g., 🍽️ "2 restaurants", 🎭 "1 museum")

- **Styling**: `no-scrollbar` utility for clean horizontal scroll on mobile

#### **`RouteQualityMeter.tsx`** (Score Visualization)

- **File**: `src/components/route/RouteQualityMeter.tsx`
- **Purpose**: Animated score bar + quality label + improvement hint
- **Score counter**: Uses `animate()` standalone from framer-motion (not `useMotionValue`) to interpolate the displayed number when the score changes. Tracks previous score via `useRef` to avoid dependency array issues.
- **Label**: `AnimatePresence mode="wait"` fade-swap when quality tier changes.
- **Tip popover**: `AnimatePresence` with `scale+opacity` entrance.
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
  - Quick action buttons show emoji↔spinner `AnimatePresence mode="wait"` swap
  - EditReason banner: spring height `0→auto` entrance, dismissible `✕`

- **Progress bar**: Animated fill showing completed stops / total stops. `onAnimationComplete` triggers "✨ All stops complete!" sparkle toast when all done.
- **Undo/Redo bar**: `AnimatePresence` with `height: 0→auto` — visible only when `canUndo || canRedo`
- **AlternativesSheet**: Rendered at page level, controlled by `alternativesForIndex` state
- **Sticky bottom CTA**: "Finish Route" + "Build Another"

### Dependency Addition

- **Package**: Added `@dnd-kit/core@latest`, `@dnd-kit/sortable@latest`, `@dnd-kit/utilities@latest`
- **Installation**: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- **Note**: Minor peer dependency warnings expected but functionality unaffected with React 19

## 🔄 Route Persistence, Quality & Architecture (Phase 14)

This phase fixed several root-cause bugs (restaurant-heavy routes, broken map, funky preview lines) and added canonical Convex-backed route persistence, a route details page, and a proper save-for-later flow.

### Bug Fix 1 — Restaurant-Heavy Route Generation

**Root cause (four layers):**

1. `VIBE_FIT_MAP` in `candidate-scorer.ts` scored restaurants 7-10 for nearly every vibe
2. Top-40 candidate selection sorted purely by `vibeFitScore`, producing food-heavy pools
3. AI prompt had only soft "vary categories" suggestion — no hard constraint
4. No post-generation variety validation

**Fixes applied across three files:**

#### `src/lib/candidate-scorer.ts`

- Reduced restaurant scores for non-foodie vibes: date 10→7, chaotic 7→5, artsy 5→4, tourist 7→5, main-character 6→5, rainy-day 7→5
- Added `isFoodCategory(cat)` export (restaurant/cafe/dessert/bar/ice_cream)
- Added `diversifyCandidates(candidates, maxCount, vibe)` export: caps food bucket at 40% of pool (70% for foodie vibe), fills remaining slots with best experience candidates

#### `src/lib/route-engine.ts`

- Updated `VIBE_CATEGORIES` to lead with experiential stops instead of food for: date (scenic/cafe first), chaotic (activity/arcade first), outdoorsy (park/scenic first), cheap (park/scenic first), rainy-day (cafe/bookstore first), tourist (attraction first), main-character (scenic/cafe first)

#### `src/app/api/plan/route.ts`

- Replaced raw top-40 sort with `diversifyCandidates(scored, 40, vibe)`
- Added `getVibeCompositionHint(vibe)` — per-vibe instruction in AI prompt (e.g., for date: "Include at least one scenic/museum/activity stop, and at most 1 food stop unless explicitly food-focused")
- Added `validateVariety(stopIds, candidateMap, vibe)` — rejects non-foodie routes with >50% food stops
- Added retry with explicit food-heavy warning on validation failure
- Added `repairFoodHeavyRoute(stopIds, candidateMap, vibe)` — deterministic fallback: swaps excess food stops for best-scoring experience candidates

---

### Bug Fix 2 — Full Map Page (`src/app/map/page.tsx`)

**Root cause:** Single combined effect re-created a new MapLibre map instance on every route change. No polyline — only point markers. Recenter button typed incorrectly.

**Fix:** Full rewrite using the same two-effect pattern as `RouteMap.tsx`:

- **Effect 1** (empty deps): init map once, `mapLoaded` state
- **Effect 2** (`[route, mapLoaded]`): clear markers, update GeoJSON polyline, redraw numbered markers
- Added `window.addEventListener('storage', ...)` listener keyed to `'rally-current-route'` for cross-tab route updates
- Added `mapLoaded` loading spinner overlay while tiles load
- Added route metadata overlay (vibe chip, stop count, cost, time)
- Proper `handleRecenter` callback using `useCallback`

---

### Bug Fix 3 — Preview Map Polyline Race Condition (`src/components/route/RouteMap.tsx`)

**Root cause:** Source/layer creation could silently fail if Effect 2 fired before the map fully loaded. Dasharray made lines look broken at low zoom.

**Fix:**

- Wrapped source/layer creation in `try/catch` to handle add-between-check-and-add race
- Polyline styling: removed dasharray → solid line, `line-width: 3`, `line-opacity: 0.8`

---

### New: `plannedRoutes` Convex Table

The canonical storage for all routes generated by signed-in users. Replaces the fragile localStorage-only model.

**State management source of truth:**

| Scenario | Source |
| --- | --- |
| Guest, active editing | localStorage only |
| Signed-in, active editing | localStorage (immediate) + Convex (debounced 2s) |
| Signed-in, page refresh | Load from `plannedRoutes.getActive` if localStorage empty |
| Viewing history | `routeHistory` table |
| Viewing saved | `plannedRoutes.listSaved` (primary) + `savedRoutes` (legacy, deduped) |
| Route detail page | `routes.getRouteDetails` cross-table lookup |

**Auto-save flow:**

1. User generates a route in `/build` → `createOrUpdate` called immediately (fire-and-forget)
2. User edits in `/route` → debounced `createOrUpdate` called after 2s idle (via `syncToConvex`)
3. User clicks ❤️ Save → `setSavedForLater(routeId, true)` + legacy `saveRoute` (backward compat)
4. User finishes route → `markCompleted(routeId)` sets `completedAt`

**Route recovery:**

- On mount in `useRouteEditor`: if `getCurrentRoute()` returns null AND user is signed in → loads `plannedRoutes.getActive` from Convex
- Shows "Route recovered ✓" emerald banner in `/route` when this triggers
- Uses `useQuery(api.plannedRoutes.getActive, isSignedIn ? {} : 'skip')` pattern

---

### New: Route Details Page (`src/app/routes/[id]/page.tsx`)

URL: `/routes/[convex_document_id]`

- Loads via `useQuery(api.routes.getRouteDetails, { id })` — works for plannedRoutes, savedRoutes, and routeHistory documents
- **Loading state**: skeleton grid (title, 3 stop cards, map placeholder)
- **Not-found state**: 🔍 with "Route not found" + link to /build
- **Invalid data state**: ⚠️ with "Invalid route data" + back button
- **Content**: title, vibe chip, city, neighborhood, stop count, cost, time, completion progress bar
- **Map**: inline `RouteMap` at 200px/280px height
- **Stop list**: each stop shows number, emoji, name, address, reason, aiReason (italic), cost, time, distance from prev, completed badge
- **AI info block**: shows when `route.aiGenerated`, displays `aiReasonForOrder`
- **Metadata**: createdAt, completedAt (from details), travelMode
- **Sticky bottom bar**: "Open in Editor" (sets localStorage + navigates to /route), heart save toggle (calls `setSavedForLater`), 🗺️ map button (sets localStorage + navigates to /map)

---

### Updated: `src/hooks/useRouteEditor.ts`

Full rewrite. New state and behavior:

```typescript
// New Convex mutations
const createOrUpdatePlanned = useMutation(api.plannedRoutes.createOrUpdate);
const setSavedForLaterMutation = useMutation(api.plannedRoutes.setSavedForLater);
const markPlannedCompleted = useMutation(api.plannedRoutes.markCompleted);

// Route recovery from Convex
const activeConvexRoute = useQuery(api.plannedRoutes.getActive, isSignedIn ? {} : 'skip');

// Debounced Convex sync (2s)
function syncToConvex(newRoute: GeneratedRoute) { ... }

// applyMutation now also calls syncToConvex
// handleSave calls setSavedForLaterMutation + legacy saveRouteMutation
// handleFinish calls markPlannedCompleted
```

**New return values:**

- `recoveredFromCloud: boolean` — true when route was loaded from Convex (triggers recovery banner)
- `saveConfirmation: string` — set to "Route saved! Find it in Saved." for 3s after successful save

---

### Updated Pages

#### `src/app/build/page.tsx`

After `setCurrentRoute(route)`, auto-saves to Convex for signed-in users:

```typescript
if (userId) {
  createOrUpdatePlannedRoute({ routeId: route.id, title: route.title,
    vibe: route.vibe, city: ..., routeData: route, isActive: true });
}
```

#### `src/app/route/page.tsx`

Added two new `AnimatePresence` banners above the existing `editReason` banner:

- **Recovery banner** (emerald): shows when `recoveredFromCloud === true`
- **Save confirmation banner** (rally purple): shows `saveConfirmation` message for 3s

#### `src/app/history/page.tsx`

- Cards are now `glass-card-hover` with `cursor-pointer active:scale-[0.98] transition-transform`
- `onClick={() => router.push('/routes/' + item._id)}` — navigates to route details page
- Key changed from index `i` to `item._id`
- Added `→` arrow indicator on right side of each card
- Fixed gradient class: `bg-linear-to-r` (Tailwind v4)

#### `src/app/saved/page.tsx`

- Added `useQuery(api.plannedRoutes.listSaved)` alongside legacy `savedRoutes` query
- Merges and deduplicates by `routeId` in `useMemo` — planned routes take priority
- `SavedEntry` interface has `source: 'legacy' | 'planned'` to dispatch unsave to correct mutation
- "View Details" button and title area navigate to `/routes/${entry._id}`
- Unsave: planned → `unsetSavedForLater`, legacy → `unsaveRouteMutation`

---

## 💳 Stripe Billing Integration (Phase 13)

Rally features production-grade SaaS subscription billing with Stripe Checkout, Customer Portal integration, webhook sync to Convex, and app-wide entitlements gating.

### Subscription Tiers

| Tier | Price | Key Features |
| --- | --- | --- |
| **Scout** | Free | Base route building (limited rerolls, no advanced filters) |
| **Main Event** | $7.99/mo or $59.99/yr | Unlimited rerolls, advanced filters, no-chains mode, all themes, exclusive badges |
| **City Unlimited** | $14.99/mo or $119.99/yr | Everything + all 4 add-ons bundled |

**Add-ons** (purchasable with Main Event; bundled into City Unlimited): Date Planner Pro ($4.99/mo), Hidden Gems ($3.99/mo), Group Voting ($5.99/mo), Weekly Route Drops ($2.99/mo).

### Key Architecture

- **Stripe SDK version**: `2026-02-25.clover` — has breaking changes vs older versions
  - `current_period_start/end` is on `SubscriptionItem`, NOT on `Subscription` — access via `sub.items.data[0].current_period_start`
  - `Invoice.subscription` is gone — use `invoice.parent?.subscription_details?.subscription`
- **Webhook flow**: Stripe → `POST /api/stripe/webhook` → verify sig → `callConvexInternal()` with `CONVEX_DEPLOY_KEY` → upsert `subscriptions` table
- **Server-only Stripe client**: `src/lib/stripe.ts` (never imported by client components)
- **Entitlements**: `src/lib/entitlements.ts` — `computeEntitlements(tier, addOnPriceIds, addOnPriceMap)`
- **Client hook**: `src/hooks/useSubscription.ts` — reads `subscriptions.getMySubscription`, returns `{ isLoading, tier, entitlements, sub, isActive, isPaidTier }`

### New Files (Phase 13 Billing)

- `src/lib/stripe.ts` — Stripe singleton, `STRIPE_PRICE_IDS`, `getTierForPriceId()`, `callConvexInternal()`
- `src/lib/entitlements.ts` — `Entitlements` interface + `computeEntitlements()`
- `src/hooks/useSubscription.ts` — client subscription state hook
- `src/app/api/stripe/checkout/route.ts` — POST, creates Checkout Session with 7-day trial
- `src/app/api/stripe/portal/route.ts` — POST, creates Customer Portal session
- `src/app/api/stripe/webhook/route.ts` — handles subscription lifecycle events; uses `req.text()` for raw body sig verification
- `src/app/checkout/success/page.tsx` — post-checkout landing with countdown redirect
- `src/app/checkout/canceled/page.tsx` — cancellation page
- `src/components/billing/PricingCard.tsx` — tier card with checkout CTA
- `src/components/billing/AddOnCard.tsx` — add-on toggle card
- `src/components/billing/ManageBillingCTA.tsx` — portal redirect button
- `convex/subscriptions.ts` — `getMySubscription`, `upsertSubscription` (internal), `cancelSubscription` (internal)

### Environment Variables (Stripe)


```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MAIN_EVENT_MONTHLY=price_...
STRIPE_PRICE_MAIN_EVENT_YEARLY=price_...
STRIPE_PRICE_CITY_UNLIMITED_MONTHLY=price_...
STRIPE_PRICE_CITY_UNLIMITED_YEARLY=price_...
STRIPE_PRICE_ADDON_DATE_PLANNER=price_...
STRIPE_PRICE_ADDON_HIDDEN_GEMS=price_...
STRIPE_PRICE_ADDON_GROUP_VOTING=price_...
STRIPE_PRICE_ADDON_WEEKLY_DROPS=price_...
NEXT_PUBLIC_STRIPE_PRICE_ADDON_DATE_PLANNER=price_...
NEXT_PUBLIC_STRIPE_PRICE_ADDON_HIDDEN_GEMS=price_...
NEXT_PUBLIC_STRIPE_PRICE_ADDON_GROUP_VOTING=price_...
NEXT_PUBLIC_STRIPE_PRICE_ADDON_WEEKLY_DROPS=price_...
CONVEX_DEPLOY_KEY=prod:...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🧠 AI Planning & Intelligent Routing (Phases 1-11)

### Major Bugs Fixed

1. **Wrong-City Bug**: Removed hardcoded NYC fallback (`{ lat: 40.7484, lng: -73.9857, city: 'New York' }`) from `/build` page. Now shows honest "sparse area" warning when places query returns < 3 results, preventing silent fallback to mock data.

2. **Silent Mock Data Fallback**: Replaced all `getMockPlaces()` fallbacks with explicit candidate pool checks. Reroll/wildcard/modifier actions now fail gracefully with empty pool message instead of silently serving NYC data.

3. **Location Accuracy Reporting**: Full end-to-end tracking of location accuracy and source (precise/cached/manual/demo), visible in DiagnosticsPanel and location cards on `/build` page.

4. **Route Planning Quality**: Introduced multi-factor scoring (outingSuitability + vibeFit) with chain detection and unsuitable keyword filtering, replacing naive random selection.

5. **AI Hallucination Prevention**: `/api/plan` can only select stops from real Overpass candidates—never generates fake places.

6. **Duplicate React Key (`ice_cream`)**: The `tags` array in `overpass.ts` was built as `[amenityKey, tags.cuisine, tags.sport]`. An ice cream shop can have both `amenity=ice_cream` and `cuisine=ice_cream` in OSM, producing two identical strings. StopCard rendered these with `key={tag}`, causing React duplicate key warnings. Fixed by wrapping with `new Set(...)`: `[...new Set([amenityKey, tags.cuisine, tags.sport].filter(Boolean))]`.

7. **Overpass API 429 Rate Limiting**: Added retry loop with fallback endpoint in `fetchOverpassPlaces`. On 429, waits 1.2s then tries `overpass.kumi.systems` as backup. On any non-OK status, moves to next endpoint. Throws last error only if all endpoints fail.

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

- `motion.ts`: **NEW FILE** — Centralized Framer Motion config. Exports easing constants (`EASE_OUT_EXPO`, `EASE_IN_OUT`), spring presets (`EASE_SPRING_SNAPPY`, `EASE_SPRING_SOFT`, `EASE_SPRING_BOUNCY`), duration constants (`DUR`), and reusable variants (`fadeUp`, `cardReveal`, `popIn`, `staggerContainer`, etc.). Import from here instead of defining animations inline.
- `types.ts`: Core type definitions including `LocationSource`, `LocationData`, `ScoredPlace`, `CandidatePool`, `GeneratedRoute` with AI fields, `RouteStop` with `aiReason`.
- `geolocation.ts`: Browser Geolocation API wrapper with `watchPosition`, high accuracy, 200m threshold, location source stamping. Returns location with accuracy, timestamp, and source type.
- `storage.ts`: `localStorage` layer for routes, history, profile, badges, and candidate pools. Functions: `getCandidatePool()`, `setCandidatePool()`.
- `candidate-scorer.ts`: Pure logic for candidate evaluation: `CHAIN_KEYWORDS`, `UNSUITABLE_NAME_KEYWORDS`, `VIBE_FIT_MAP` (10 vibes × 13 categories), `prepareCandidates()`, `filterForOuting()`, `scoreCandidates()` functions.
- `overpass.ts`: Extracted Overpass API logic: `fetchOverpassPlaces(lat, lng, radius)`, `OSM_CATEGORY_MAP`, utility functions for price/cost/time estimation. **Updated**: Retry loop with `OVERPASS_ENDPOINTS` array (`overpass-api.de` primary, `overpass.kumi.systems` fallback) — on 429 waits 1.2s then tries next endpoint. Tags array is deduplicated with `new Set()` to prevent duplicate React keys.
- `route-engine.ts`: The "brain" — maps vibes to categories and logic for stop selection, rerolls, and modifiers. Updated `pickBestPlace()` to use `vibeFitScore` as primary sort.
- `constants.ts`: Design tokens, vibe definitions, feature packs, and badge criteria. Contains `ALL_BADGES` used to render unearned badge placeholders. Added `CANDIDATE_POOL` storage key.
- `mock-data.ts`: High-quality fallback data for demo mode (NYC focus).

### Hooks (`src/hooks/`)

- `useGeolocation.ts`: Managed location state with `watchPosition`, permission handling, and demo mode toggle. Exposes: `location` (with accuracy/timestamp/source), `loading`, `permissionState`, `requestLocation()`, `useDemo()`, `useManualLocation(lat, lng, city, neighborhood?)`, `isStale` flag. Caches location with source:'cached' stamp on mount.
- `useLocalStorage.ts`: SSR-safe persistence hook.
- `useEnsureUser.ts`: Ensures Convex user doc is created/updated on every Clerk sign-in.
- `useDataMigration.ts`: One-time localStorage → Convex data migration.

### Components (`src/components/`)

- `auth/AuthPrompt.tsx`: Inline animated auth gate for protected pages. Shows `SignUpButton` + `SignInButton` in modal mode. **Updated**: Pulsing glow blob behind icon; `staggerContainer` + `popIn`/`fadeUp` stagger entrance for all content elements.
- `providers/ConvexClientProvider.tsx`: Wraps app with `ConvexProviderWithClerk`.
- `providers/DataMigrationProvider.tsx`: Mounts `useEnsureUser` and `useDataMigration` hooks globally. Also mounts `DiagnosticsPanel` for dev-only visibility.
- `dev/DiagnosticsPanel.tsx`: Dev-only overlay (hidden in production) with amber ⚙ toggle button. Displays: location (lat/lng/accuracy/source with color coding), candidate pool stats (size/age/staleness/radius), route info (title/stop count/AI generated/stop IDs).
- `layout/Navbar.tsx`: Responsive top/bottom navigation. Shows `UserButton` (signed in) or `SignInButton mode="modal"` (guest) in desktop nav. Bottom nav is **60px + safe-area** on mobile. **Updated**: Logo has `whileHover={{ scale: 1.12, rotate: 6 }}`; mobile active tab icon bounces up `animate={{ y: [-3, 0] }}`.

### API Routes (`src/app/api/`)

- `/api/places`: Thin wrapper around `fetchOverpassPlaces()` from `src/lib/overpass.ts`. Returns scored `Place[]` based on lat/lng and vibe categories.
- `/api/plan`: POST endpoint for AI-powered route planning. Takes `{ lat, lng, radius, vibe, preferences, city, neighborhood? }`. Pipeline: fetch Overpass candidates → score with vibeFitScore → call OpenRouter (if key set) → validate JSON → deterministic fallback. Returns `GeneratedRoute` with `aiGenerated` flag and `aiReason` per stop. Retries once on validation failure.
- `/api/edit-route`: POST endpoint for AI-powered route edits. Takes `EditRouteRequest`, returns `EditRouteResponse`. Uses OpenRouter; falls back to deterministic functions on AI failure. The fallback always succeeds.
- `/api/geocode`: Reverse geocoding via OpenStreetMap Nominatim.

### Pages & App Structure

- `/`: Landing page with featured tonight and how-it-works. **Updated**: Hero word stagger, `gradient-mesh` depth layer, section-by-section `staggerContainer`/`cardReveal` with `whileInView`, vibe chip spring hovers, CTA `animate-glow-pulse`.
- `/build`: 4-step multi-page form builder. **Updated**: Orbital loader during generation; spring checkmark pops per stage; sonar-ping rings on location step; `AnimatePresence mode="wait"` stage description fade; progress bar `scaleX` fill. Also: removed hardcoded NYC fallback, added `placesFetchStatus` ('idle'|'fetching'|'success'|'sparse'|'error'), stores `CandidatePool` in localStorage, calls `/api/plan` when `NEXT_PUBLIC_USE_AI_PLANNING=true`.
- `/route`: Main interactive itinerary studio. Uses `useRouteEditor()` for all state. Quick action emoji↔spinner swaps; spring undo/redo bar; sparkle toast on completion; finish screen trophy bounce + glow. AI planned badge, aiReason display, handleSave/handleFinish write to localStorage + Convex.
- `/map`: Full-screen MapLibre GL JS integration with numbered gradient pins. Added desktop recenter button (⊙) that refits bounds to original viewport.
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
- **Reduced Motion**: `@media (prefers-reduced-motion: reduce)` block disables all CSS `animation` and `transition` for accessibility.

### Components & Layout Utilities

- `Navbar.tsx`: Responsive top/bottom navigation. Bottom nav is **60px + safe-area** on mobile with full-width touch areas.
- `.sticky-bottom-cta`: Fixed bottom CTA bar that stays above the mobile navigation with a blurred gradient backdrop.
- `.mobile-nav-spacer`: Automatic padding div (`72px + safe-area` on mobile) to prevent fixed nav from covering content.
- `.no-scrollbar`: Utility to hide native scrollbars on carousels/swipeable areas.
- `.skeleton`: Shimmer sweep overlay for loading states (uses `::after` with `@keyframes shimmer`).
- `.gradient-mesh`: Radial gradient depth layer, used in hero sections.
- `.glow-border`: Purple/pink border glow on `:hover` for interactive cards.
- `.animate-glow-pulse`: Continuous box-shadow pulse, used on primary CTAs.
- `.animate-bounce-in`: Spring overshoot scale entrance for trophy/success states.

## 🛠️ Tech Stack Notes

- **Next.js**: Use App Router (v15+). All pages are `'use client'`. Root layout (`layout.tsx`) is a Server Component.
- **Clerk v5** (`@clerk/nextjs`): `ClerkProvider` is server-safe and wraps `<html>`. Use `useUser`, `SignInButton`, `SignUpButton`, `UserButton` from `@clerk/nextjs`. Modal mode for auth buttons prevents page navigation.
- **Convex**: Use `useQuery` / `useMutation` from `convex/react`. Import via `@convex/_generated/api` (path alias). The `_generated/` folder is auto-created by `npx convex dev` — TypeScript errors on these imports are expected until that command is run.
- **Tailwind CSS v4**: Uses `bg-linear-to-br` (not `bg-gradient-to-br` from v3). This applies everywhere — components, pages, and utilities.
- **Framer Motion**: All variants live in `src/lib/motion.ts`. Never define `variants` inline. Use `layoutId` for shared element transitions. Use `animate()` standalone (not `useMotionValue`) for imperative number animation.
- **MapLibre GL JS**: Used for performant, dark-themed maps. Pins are enlarged (40px) for touch usability.
- **Overpass API**: Public endpoint for location discovery. `fetchOverpassPlaces` now has retry logic with a fallback endpoint (`overpass.kumi.systems`) on 429 rate limiting.

## ⚙️ Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Clerk routing — must match the pages created in src/app/sign-in and src/app/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL=/

# ── Convex ────────────────────────────────────────────────────────────
NEXT_PUBLIC_CONVEX_URL=https://impartial-zebra-957.convex.cloud
CLERK_ISSUER_URL=https://full-katydid-86.clerk.accounts.dev
CONVEX_DEPLOYMENT=dev:impartial-zebra-957
NEXT_PUBLIC_CONVEX_SITE_URL=https://impartial-zebra-957.convex.site

# ── OpenRouter (AI Planning) ─────────────────────────────────────────
# Get from: https://openrouter.ai/keys
# A 401 "User not found" error means this key has been revoked — generate a new one.
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openai/gpt-4o-mini

# Enable AI planning in route generation
NEXT_PUBLIC_USE_AI_PLANNING=true
```

### Environment Variables Explained

- **`OPENROUTER_API_KEY`** (secret): API key from OpenRouter for LLM access. Leave empty to disable AI planning. A `401 "User not found"` error means the key is revoked — generate a new one at openrouter.ai/keys. The app falls back to deterministic route generation automatically.
- **`OPENROUTER_MODEL`**: Model identifier (e.g., `openai/gpt-4o-mini`, `anthropic/claude-3.5-sonnet`). Swappable to experiment with different models.
- **`NEXT_PUBLIC_USE_AI_PLANNING`**: Set to `"true"` to enable `/api/plan`. When `"false"`, route generation uses deterministic algorithm only.

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
- **Overpass Resilience**: `fetchOverpassPlaces` retries with a fallback public endpoint on 429 rate limiting, ensuring places can still load under high traffic.

### UX Transparency

- **Stage-by-Stage Loading**: Generate button shows progress (location→places→scoring→building) with visual checkmarks.
- **Location Mode Labels**: Color-coded source indicators (green=precise, orange=cached, blue=manual, amber=demo).
- **Sparse Area Detection**: Honest messaging when location returns few candidates, no silent fallback.
- **DiagnosticsPanel**: Dev-only overlay for debugging location, pool staleness, and AI decisions.

### Motion & Animation

- **Centralized config**: All Framer Motion variants in `src/lib/motion.ts` — never define inline.
- **Spring-first**: Prefer spring transitions over duration-based for interactive elements (buttons, cards, toggles).
- **`layoutId` for shared elements**: Use `layoutId` when an element moves between positions (active stop ring, nav indicator) to get automatic FLIP animation.
- **`AnimatePresence mode="wait"`**: Use for icon swaps (🔒↔🔓, ❤️↔🤍, emoji↔spinner) to prevent overlap during transition.
- **`animate()` standalone**: Use for imperative number animation (score counter) instead of `useMotionValue` to avoid TypeScript issues with motion values as JSX children.
- **Accessibility**: All CSS animations disabled via `@media (prefers-reduced-motion: reduce)`.

## 🏅 Badges & Gamification

Badges are defined in `constants.ts` (`ALL_BADGES`) and triggered by actions like saving routes, completing stops, or building specific vibe types. Earned badges are stored in Convex (`userBadges` table); the full `ALL_BADGES` list is merged at render time so unearned badges display correctly (greyed out).

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
