// ── Core Data Types ──────────────────────────────────────────────────

export type PlaceCategory =
  | 'restaurant'
  | 'cafe'
  | 'dessert'
  | 'park'
  | 'museum'
  | 'attraction'
  | 'bookstore'
  | 'arcade'
  | 'shopping'
  | 'scenic'
  | 'activity'
  | 'bar'
  | 'nightlife';

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  lat: number;
  lng: number;
  address: string;
  priceLevel: 1 | 2 | 3 | 4; // $ to $$$$
  estimatedCost: number;
  estimatedMinutes: number;
  rating?: number;
  tags: string[];
  indoor: boolean;
  imageUrl?: string;
  source: 'osm' | 'mock';
}

export interface RouteStop {
  place: Place;
  order: number;
  reason: string;
  distanceFromPrev: string;
  travelTimeFromPrev: string;
  completed: boolean;
  rating?: number;
  aiReason?: string; // AI-specific narrative reason (when aiGenerated route)
}

export interface GeneratedRoute {
  id: string;
  title: string;
  vibeDescription: string;
  stops: RouteStop[];
  totalTime: string;
  totalCost: number;
  travelMode: string;
  vibe: Vibe;
  groupType: GroupType;
  createdAt: string;
  city: string;
  neighborhood?: string;
  isDemo: boolean;
  saved: boolean;
  // AI planning fields — all optional (Convex v.any() accepts transparently)
  aiGenerated?: boolean;
  aiReasonForOrder?: string;
  aiBudgetSummary?: string;
  aiTimeSummary?: string;
}

export interface UserPreferences {
  vibe: Vibe;
  groupType: GroupType;
  budget: Budget;
  timeAvailable: TimeAvailable;
  radius: Radius;
  energy: Energy;
  indoorOutdoor: IndoorOutdoor;
  foodRequired: boolean;
  attractionRequired: boolean;
}

export interface SavedRoute extends GeneratedRoute {
  savedAt: string;
}

export interface RouteHistoryItem {
  route: GeneratedRoute;
  completedStops: number;
  totalStops: number;
  finishedAt?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
}

export interface PremiumPack {
  id: string;
  name: string;
  description: string;
  price: string;
  features: string[];
  gradient: string;
  icon: string;
}

export interface BusinessFeatureCard {
  id: string;
  businessName: string;
  category: PlaceCategory;
  tagline: string;
  ctaText: string;
  promoted: boolean;
}

export interface UserProfile {
  name: string;
  city: string;
  joinedAt: string;
  routesCompleted: number;
  streak: number;
  badges: Badge[];
  isPremium: boolean;
  referralCode: string;
}

// ── Enum-like Union Types ────────────────────────────────────────────

export type Vibe =
  | 'cozy'
  | 'date'
  | 'chaotic'
  | 'foodie'
  | 'artsy'
  | 'outdoorsy'
  | 'cheap'
  | 'main-character'
  | 'tourist'
  | 'rainy-day';

export type GroupType = 'solo' | 'friends' | 'date' | 'family';

export type Budget = 'under-15' | 'under-30' | 'under-60' | 'flexible';

export type TimeAvailable = '30-min' | '1-hour' | '2-hours' | '3-plus';

export type Radius = 'walking' | '10-min-drive' | '20-min-drive' | 'anywhere';

export type Energy = 'chill' | 'balanced' | 'go-all-out';

export type IndoorOutdoor = 'indoor' | 'outdoor' | 'both';

// ── UI Helper Types ──────────────────────────────────────────────────

export interface SelectOption<T> {
  value: T;
  label: string;
  icon: string;
  description?: string;
}

export type LocationSource = 'precise' | 'cached' | 'manual' | 'demo';

export interface LocationData {
  lat: number;
  lng: number;
  city: string;
  neighborhood?: string;
  isDemo: boolean;
  // Source-tracking fields — optional for backward compat with cached values
  accuracy?: number;        // meters from Geolocation API
  timestamp?: number;       // ms epoch from Geolocation API
  source?: LocationSource;  // how this location was obtained
}

// ── Candidate Scoring Types ──────────────────────────────────────────

export interface ScoredPlace extends Place {
  outingSuitabilityScore: number; // 0-10; 0 = excluded
  vibeFitScore: number;           // 0-10, vibe-specific
  likelyChain: boolean;
  exclusionReason?: string;       // why rejected, for diagnostics
}

export interface CandidatePool {
  places: ScoredPlace[];
  fetchedAt: number;  // ms epoch
  lat: number;
  lng: number;
  radius: string;     // meters as string
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

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
  candidatePool: ScoredPlace[];
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

// ── Billing Types ─────────────────────────────────────────────────────

export type SubscriptionTier   = 'scout' | 'main-event' | 'city-unlimited';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
export type AddOnId            = 'date-planner' | 'hidden-gems' | 'group-mode' | 'weekly-drops';

export interface SubscriptionInfo {
  tier:                SubscriptionTier;
  status:              SubscriptionStatus | null;
  currentPeriodEnd:    number | null;  // Unix timestamp (seconds)
  cancelAtPeriodEnd:   boolean;
  activeAddOnPriceIds: string[];
}
