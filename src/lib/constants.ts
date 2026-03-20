import {
  Vibe, GroupType, Budget, TimeAvailable, Radius, Energy, IndoorOutdoor,
  SelectOption, Badge, PremiumPack
} from './types';

// ── Vibe Options ─────────────────────────────────────────────────────

export const VIBES: SelectOption<Vibe>[] = [
  { value: 'cozy', label: 'Cozy', icon: '🧣', description: 'Warm drinks, soft lighting' },
  { value: 'date', label: 'Date Night', icon: '🌹', description: 'Romantic & memorable' },
  { value: 'chaotic', label: 'Chaotic', icon: '🎲', description: 'Unpredictable fun' },
  { value: 'foodie', label: 'Foodie', icon: '🍜', description: 'Eat everything' },
  { value: 'artsy', label: 'Artsy', icon: '🎨', description: 'Culture & creativity' },
  { value: 'outdoorsy', label: 'Outdoorsy', icon: '🏔️', description: 'Fresh air & nature' },
  { value: 'cheap', label: 'Budget King', icon: '💸', description: 'Max fun, min spend' },
  { value: 'main-character', label: 'Main Character', icon: '✨', description: 'Cinematic energy' },
  { value: 'tourist', label: 'Tourist in My City', icon: '📸', description: 'Explore like a visitor' },
  { value: 'rainy-day', label: 'Rainy Day', icon: '☔', description: 'Indoor vibes' },
];

export const GROUP_TYPES: SelectOption<GroupType>[] = [
  { value: 'solo', label: 'Solo', icon: '🎧' },
  { value: 'friends', label: 'Friends', icon: '👯' },
  { value: 'date', label: 'Date', icon: '💕' },
  { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
];

export const BUDGETS: SelectOption<Budget>[] = [
  { value: 'under-15', label: 'Under $15', icon: '🪙' },
  { value: 'under-30', label: 'Under $30', icon: '💵' },
  { value: 'under-60', label: 'Under $60', icon: '💰' },
  { value: 'flexible', label: 'Flexible', icon: '💎' },
];

export const TIME_OPTIONS: SelectOption<TimeAvailable>[] = [
  { value: '30-min', label: '30 min', icon: '⚡' },
  { value: '1-hour', label: '1 hour', icon: '⏰' },
  { value: '2-hours', label: '2 hours', icon: '🕐' },
  { value: '3-plus', label: '3+ hours', icon: '🌙' },
];

export const RADIUS_OPTIONS: SelectOption<Radius>[] = [
  { value: 'walking', label: 'Walking', icon: '🚶' },
  { value: '10-min-drive', label: '10 min drive', icon: '🚗' },
  { value: '20-min-drive', label: '20 min drive', icon: '🚙' },
  { value: 'anywhere', label: 'Anywhere nearby', icon: '🌍' },
];

export const ENERGY_OPTIONS: SelectOption<Energy>[] = [
  { value: 'chill', label: 'Chill', icon: '😌' },
  { value: 'balanced', label: 'Balanced', icon: '⚖️' },
  { value: 'go-all-out', label: 'Go All Out', icon: '🔥' },
];

export const INDOOR_OUTDOOR_OPTIONS: SelectOption<IndoorOutdoor>[] = [
  { value: 'indoor', label: 'Indoor', icon: '🏠' },
  { value: 'outdoor', label: 'Outdoor', icon: '☀️' },
  { value: 'both', label: 'Mix', icon: '🔄' },
];

// ── Default Preferences ──────────────────────────────────────────────

export const DEFAULT_PREFERENCES = {
  vibe: 'cozy' as Vibe,
  groupType: 'friends' as GroupType,
  budget: 'under-30' as Budget,
  timeAvailable: '2-hours' as TimeAvailable,
  radius: '10-min-drive' as Radius,
  energy: 'balanced' as Energy,
  indoorOutdoor: 'both' as IndoorOutdoor,
  foodRequired: true,
  attractionRequired: false,
};

// ── Badges ───────────────────────────────────────────────────────────

export const ALL_BADGES: Badge[] = [
  { id: 'cozy-merchant', name: 'Cozy Merchant', description: 'Complete 3 cozy routes', icon: '🧶', earned: false },
  { id: 'dessert-demon', name: 'Dessert Demon', description: 'Visit 10 dessert spots', icon: '🍰', earned: false },
  { id: 'budget-genius', name: 'Budget Genius', description: 'Complete 5 routes under $15', icon: '🧠', earned: false },
  { id: 'park-goblin', name: 'Park Goblin', description: 'Visit 8 parks', icon: '🌿', earned: false },
  { id: 'main-character', name: 'Main Character', description: 'Complete a main character route', icon: '👑', earned: false },
  { id: 'night-owl', name: 'Night Owl', description: 'Generate a route after 9 PM', icon: '🦉', earned: false },
  { id: 'explorer', name: 'Explorer', description: 'Visit 3 different neighborhoods', icon: '🗺️', earned: false },
  { id: 'streak-starter', name: 'Streak Starter', description: 'Complete routes 3 days in a row', icon: '🔥', earned: false },
  { id: 'social-butterfly', name: 'Social Butterfly', description: 'Share 3 routes', icon: '🦋', earned: false },
  { id: 'foodie-legend', name: 'Foodie Legend', description: 'Complete 5 foodie routes', icon: '🍽️', earned: false },
  { id: 'art-collector', name: 'Art Collector', description: 'Visit 5 museums or galleries', icon: '🖼️', earned: false },
  { id: 'first-rally', name: 'First Rally', description: 'Complete your first route', icon: '🎉', earned: false },
];

// ── Premium Packs ────────────────────────────────────────────────────

export const PREMIUM_PACKS: PremiumPack[] = [
  {
    id: 'date-planner',
    name: 'Date Planner Pro',
    description: 'AI-optimized date routes with reservation links and mood-matched stops.',
    price: '$4.99/mo',
    features: ['Smart reservation timing', 'Ambiance matching', 'Budget optimizer', 'Surprise stop mode'],
    gradient: 'from-rose-500 to-pink-600',
    icon: '💝',
  },
  {
    id: 'hidden-gems',
    name: 'Hidden Gems',
    description: 'Unlock hyper-local spots that never show up on mainstream apps.',
    price: '$3.99/mo',
    features: ['Local-only stops', 'Hole-in-the-wall filter', 'No chains allowed', 'Insider tips'],
    gradient: 'from-amber-500 to-orange-600',
    icon: '💎',
  },
  {
    id: 'group-mode',
    name: 'Group Voting',
    description: 'Let your crew vote on stops in real-time. Democracy meets spontaneity.',
    price: '$5.99/mo',
    features: ['Live voting', 'Veto power', 'Group budget split', 'Shared progress'],
    gradient: 'from-violet-500 to-purple-600',
    icon: '🗳️',
  },
  {
    id: 'weekly-drops',
    name: 'Weekly Route Drops',
    description: 'Curated themed routes delivered every week by local insiders.',
    price: '$2.99/mo',
    features: ['Weekly curated routes', 'Seasonal specials', 'Early access', 'Exclusive badges'],
    gradient: 'from-cyan-500 to-blue-600',
    icon: '📦',
  },
];

// ── Route Titles by Vibe ─────────────────────────────────────────────

export const ROUTE_TITLES: Record<string, string[]> = {
  cozy: ['Soft Launch Saturday', 'Warm Glow Wander', 'Sweater Weather Route', 'Hygge Hour'],
  date: ['Cheap Date, High Aura', 'Sunset & Sweets', 'Night to Remember', 'Romance Reboot'],
  chaotic: ['Friend Chaos Route', 'Unhinged Evening', 'Random Access Mode', 'Plot Twist Walk'],
  foodie: ['Eat the Block', 'Fork in the Road', 'Flavor Crawl', 'Taste Trail'],
  artsy: ['Gallery Drift', 'Culture Circuit', 'Creative Detour', 'Canvas & Coffee'],
  outdoorsy: ['Trail & Tale', 'Green Line Walk', 'Peak Wanderer', 'Nature Reset'],
  cheap: ['Zero Dollar Drip', 'Broke & Beautiful', 'Free Range Walk', 'Penny Pinch Paradise'],
  'main-character': ['Main Character Mode', 'Protagonist Walk', 'Golden Hour Route', 'Plot Armor Activated'],
  tourist: ['Tourist Trap Remix', 'See Your City', 'Postcard Route', 'Local Landmark Loop'],
  'rainy-day': ['Rainy Day Rescue', 'Shelter Hopping', 'Indoor Explorer', 'Cozy Indoors Only'],
};

// ── Route Vibe Descriptions ──────────────────────────────────────────

export const VIBE_DESCRIPTIONS: Record<string, string[]> = {
  cozy: [
    'A slow, warm route through the coziest corners of your neighborhood.',
    'Think candles, books, and something warm in your hands the whole time.',
  ],
  date: [
    'Smooth, curated, and designed to impress without trying too hard.',
    'The kind of evening that ends with "we should do this more often."',
  ],
  chaotic: [
    'No plan survives first contact. This route embraces beautiful chaos.',
    'Buckle up — this one zigzags through the unexpected.',
  ],
  foodie: [
    'A guided crawl through the best flavors within reach.',
    'Your taste buds are the navigator tonight.',
  ],
  artsy: [
    'A route that feeds your creative soul and caffeine addiction equally.',
    'Culture, color, and a probably unnecessary amount of aesthetic photos.',
  ],
  outdoorsy: [
    'Fresh air, open skies, and the kind of walk that clears your head.',
    'Nature called. You answered. This is the route.',
  ],
  cheap: [
    'Big vibes on a micro budget. Proof that free can be fire.',
    'Your wallet stays full. Your evening does too.',
  ],
  'main-character': [
    'Walk like everyone\'s watching. Because in your mind, they are.',
    'Cinematic energy. Dramatic lighting. Main character soundtrack required.',
  ],
  tourist: [
    'Rediscover your city like you just landed with a fresh pair of eyes.',
    'Play tourist. Hit the spots you always walk past. Actually go inside this time.',
  ],
  'rainy-day': [
    'Rain outside, warmth inside. The perfect excuse to hide in good places.',
    'Puddle-dodging optional. Everything on this route has a roof.',
  ],
};

// ── Map Config ───────────────────────────────────────────────────────

export const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

export const DEFAULT_CENTER: [number, number] = [-73.9857, 40.7484]; // NYC

// ── Stripe Add-on Price IDs (client-safe) ────────────────────────────
// Stripe price IDs are not secrets — safe to expose in the browser via NEXT_PUBLIC_ vars.
// Populated at build time from environment variables.

export const ADDON_PRICE_IDS: Record<string, string> = {
  'date-planner': process.env.NEXT_PUBLIC_STRIPE_PRICE_ADDON_DATE_PLANNER ?? '',
  'hidden-gems':  process.env.NEXT_PUBLIC_STRIPE_PRICE_ADDON_HIDDEN_GEMS  ?? '',
  'group-mode':   process.env.NEXT_PUBLIC_STRIPE_PRICE_ADDON_GROUP_VOTING ?? '',
  'weekly-drops': process.env.NEXT_PUBLIC_STRIPE_PRICE_ADDON_WEEKLY_DROPS ?? '',
};

// Subscription price IDs by tier and period.
// These use NEXT_PUBLIC_ so the premium page can build checkout requests without
// an extra API round-trip. Price IDs are not secrets.
export const SUBSCRIPTION_PRICE_IDS = {
  'main-event': {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MAIN_EVENT_MONTHLY ?? '',
    yearly:  process.env.NEXT_PUBLIC_STRIPE_PRICE_MAIN_EVENT_YEARLY  ?? '',
  },
  'city-unlimited': {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_CITY_UNLIMITED_MONTHLY ?? '',
    yearly:  process.env.NEXT_PUBLIC_STRIPE_PRICE_CITY_UNLIMITED_YEARLY  ?? '',
  },
} as const;

// ── localStorage Keys ────────────────────────────────────────────────

export const STORAGE_KEYS = {
  PREFERENCES: 'rally-preferences',
  SAVED_ROUTES: 'rally-saved-routes',
  ROUTE_HISTORY: 'rally-route-history',
  BADGES: 'rally-badges',
  PROFILE: 'rally-profile',
  STREAK: 'rally-streak',
  PREMIUM: 'rally-premium',
  LAST_LOCATION: 'rally-last-location',
  CURRENT_ROUTE: 'rally-current-route',
  CANDIDATE_POOL: 'rally-candidate-pool',  // nearby place candidates stored alongside route
};
