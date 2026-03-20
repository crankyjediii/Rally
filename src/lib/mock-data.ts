import { Place, PlaceCategory } from './types';

// ── Demo Location ────────────────────────────────────────────────────

export const DEMO_LOCATION = {
  lat: 40.7484,
  lng: -73.9857,
  city: 'New York',
  neighborhood: 'Midtown Manhattan',
  isDemo: true,
};

// ── Mock Places ──────────────────────────────────────────────────────

const NYC_PLACES: Place[] = [
  // Cafes
  { id: 'mock-1', name: 'The Laughing Goat', category: 'cafe', lat: 40.7505, lng: -73.9934, address: '123 W 34th St', priceLevel: 1, estimatedCost: 6, estimatedMinutes: 25, rating: 4.6, tags: ['latte art', 'cozy', 'wifi'], indoor: true, source: 'mock' },
  { id: 'mock-2', name: 'Blank Slate Coffee', category: 'cafe', lat: 40.7452, lng: -73.9880, address: '88 Park Ave S', priceLevel: 2, estimatedCost: 8, estimatedMinutes: 30, rating: 4.7, tags: ['minimalist', 'pour over', 'aesthetic'], indoor: true, source: 'mock' },
  { id: 'mock-3', name: 'Grounds & Hounds', category: 'cafe', lat: 40.7380, lng: -73.9901, address: '42 Irving Pl', priceLevel: 1, estimatedCost: 5, estimatedMinutes: 20, rating: 4.5, tags: ['dog friendly', 'pastries'], indoor: true, source: 'mock' },
  { id: 'mock-4', name: 'Ember Roasters', category: 'cafe', lat: 40.7530, lng: -73.9810, address: '210 E 43rd St', priceLevel: 2, estimatedCost: 7, estimatedMinutes: 25, rating: 4.4, tags: ['single origin', 'modern'], indoor: true, source: 'mock' },

  // Restaurants
  { id: 'mock-5', name: 'Golden Bowl Pho', category: 'restaurant', lat: 40.7465, lng: -73.9960, address: '67 W 32nd St', priceLevel: 1, estimatedCost: 12, estimatedMinutes: 40, rating: 4.3, tags: ['vietnamese', 'soup', 'quick'], indoor: true, source: 'mock' },
  { id: 'mock-6', name: 'Midnight Slice', category: 'restaurant', lat: 40.7410, lng: -73.9890, address: '201 E 28th St', priceLevel: 1, estimatedCost: 8, estimatedMinutes: 20, rating: 4.1, tags: ['pizza', 'late night', 'casual'], indoor: true, source: 'mock' },
  { id: 'mock-7', name: 'The Velvet Fork', category: 'restaurant', lat: 40.7520, lng: -73.9780, address: '145 E 44th St', priceLevel: 3, estimatedCost: 35, estimatedMinutes: 60, rating: 4.7, tags: ['upscale', 'italian', 'date night'], indoor: true, source: 'mock' },
  { id: 'mock-8', name: 'Spice Route Kitchen', category: 'restaurant', lat: 40.7440, lng: -73.9850, address: '78 Lexington Ave', priceLevel: 2, estimatedCost: 18, estimatedMinutes: 45, rating: 4.5, tags: ['indian fusion', 'colorful', 'flavorful'], indoor: true, source: 'mock' },
  { id: 'mock-9', name: 'Taco Orbit', category: 'restaurant', lat: 40.7490, lng: -73.9920, address: '56 W 36th St', priceLevel: 1, estimatedCost: 10, estimatedMinutes: 25, rating: 4.2, tags: ['tacos', 'quick', 'fun'], indoor: true, source: 'mock' },

  // Dessert
  { id: 'mock-10', name: 'Cloud Nine Creamery', category: 'dessert', lat: 40.7430, lng: -73.9870, address: '99 E 30th St', priceLevel: 1, estimatedCost: 7, estimatedMinutes: 20, rating: 4.8, tags: ['ice cream', 'instagram', 'unique flavors'], indoor: true, source: 'mock' },
  { id: 'mock-11', name: 'Sugar Rush Bakeshop', category: 'dessert', lat: 40.7510, lng: -73.9840, address: '332 Madison Ave', priceLevel: 2, estimatedCost: 10, estimatedMinutes: 20, rating: 4.6, tags: ['cupcakes', 'macarons', 'pretty'], indoor: true, source: 'mock' },
  { id: 'mock-12', name: 'Boba Galaxy', category: 'dessert', lat: 40.7470, lng: -73.9950, address: '18 W 33rd St', priceLevel: 1, estimatedCost: 6, estimatedMinutes: 15, rating: 4.4, tags: ['boba', 'matcha', 'trendy'], indoor: true, source: 'mock' },

  // Parks
  { id: 'mock-13', name: 'Bryant Park', category: 'park', lat: 40.7536, lng: -73.9832, address: 'Bryant Park, Manhattan', priceLevel: 1, estimatedCost: 0, estimatedMinutes: 30, rating: 4.7, tags: ['iconic', 'green', 'events'], indoor: false, source: 'mock' },
  { id: 'mock-14', name: 'Madison Square Park', category: 'park', lat: 40.7418, lng: -73.9879, address: 'Madison Square Park', priceLevel: 1, estimatedCost: 0, estimatedMinutes: 25, rating: 4.6, tags: ['dog park', 'art installations', 'shake shack'], indoor: false, source: 'mock' },
  { id: 'mock-15', name: 'High Line', category: 'park', lat: 40.7480, lng: -74.0048, address: 'The High Line', priceLevel: 1, estimatedCost: 0, estimatedMinutes: 45, rating: 4.9, tags: ['elevated', 'scenic', 'art'], indoor: false, source: 'mock' },

  // Museums
  { id: 'mock-16', name: 'MoMA', category: 'museum', lat: 40.7614, lng: -73.9776, address: '11 W 53rd St', priceLevel: 2, estimatedCost: 25, estimatedMinutes: 90, rating: 4.8, tags: ['modern art', 'iconic', 'world class'], indoor: true, source: 'mock' },
  { id: 'mock-17', name: 'The Morgan Library', category: 'museum', lat: 40.7492, lng: -73.9813, address: '225 Madison Ave', priceLevel: 2, estimatedCost: 22, estimatedMinutes: 60, rating: 4.7, tags: ['books', 'manuscripts', 'quiet'], indoor: true, source: 'mock' },

  // Bookstores
  { id: 'mock-18', name: 'Rizzoli Bookstore', category: 'bookstore', lat: 40.7537, lng: -73.9802, address: '1133 Broadway', priceLevel: 2, estimatedCost: 15, estimatedMinutes: 30, rating: 4.8, tags: ['art books', 'beautiful', 'classic'], indoor: true, source: 'mock' },
  { id: 'mock-19', name: 'The Strand (annex)', category: 'bookstore', lat: 40.7417, lng: -73.9910, address: '828 Broadway', priceLevel: 1, estimatedCost: 10, estimatedMinutes: 40, rating: 4.6, tags: ['used books', 'iconic', 'massive'], indoor: true, source: 'mock' },

  // Arcades
  { id: 'mock-20', name: 'Level Up Arcade', category: 'arcade', lat: 40.7455, lng: -73.9940, address: '150 W 30th St', priceLevel: 2, estimatedCost: 15, estimatedMinutes: 45, rating: 4.3, tags: ['retro games', 'pinball', 'fun'], indoor: true, source: 'mock' },

  // Scenic
  { id: 'mock-21', name: 'Top of the Rock', category: 'scenic', lat: 40.7593, lng: -73.9794, address: '30 Rockefeller Plaza', priceLevel: 3, estimatedCost: 40, estimatedMinutes: 45, rating: 4.8, tags: ['skyline', 'sunset', 'views'], indoor: false, source: 'mock' },
  { id: 'mock-22', name: 'East River Esplanade', category: 'scenic', lat: 40.7460, lng: -73.9720, address: 'FDR Drive Esplanade', priceLevel: 1, estimatedCost: 0, estimatedMinutes: 30, rating: 4.4, tags: ['waterfront', 'walk', 'sunset'], indoor: false, source: 'mock' },

  // Shopping
  { id: 'mock-23', name: 'Artists & Fleas', category: 'shopping', lat: 40.7445, lng: -73.9885, address: '568 Broadway', priceLevel: 2, estimatedCost: 20, estimatedMinutes: 40, rating: 4.3, tags: ['vintage', 'handmade', 'unique'], indoor: true, source: 'mock' },

  // Attractions
  { id: 'mock-24', name: 'Grand Central Terminal', category: 'attraction', lat: 40.7527, lng: -73.9772, address: '89 E 42nd St', priceLevel: 1, estimatedCost: 0, estimatedMinutes: 20, rating: 4.7, tags: ['architecture', 'historic', 'whispering gallery'], indoor: true, source: 'mock' },
  { id: 'mock-25', name: 'SUMMIT One Vanderbilt', category: 'attraction', lat: 40.7531, lng: -73.9786, address: '1 Vanderbilt Ave', priceLevel: 3, estimatedCost: 42, estimatedMinutes: 60, rating: 4.7, tags: ['immersive', 'sky high', 'photo op'], indoor: true, source: 'mock' },

  // Activities
  { id: 'mock-26', name: 'Spin Ping Pong', category: 'activity', lat: 40.7415, lng: -73.9905, address: '48 E 23rd St', priceLevel: 2, estimatedCost: 18, estimatedMinutes: 45, rating: 4.2, tags: ['games', 'social', 'drinks'], indoor: true, source: 'mock' },
  { id: 'mock-27', name: 'Escape Room NYC', category: 'activity', lat: 40.7480, lng: -73.9930, address: '107 W 35th St', priceLevel: 2, estimatedCost: 30, estimatedMinutes: 60, rating: 4.4, tags: ['puzzle', 'team', 'thrilling'], indoor: true, source: 'mock' },
  { id: 'mock-28', name: 'Bowlero Times Square', category: 'activity', lat: 40.7580, lng: -73.9855, address: '222 W 44th St', priceLevel: 2, estimatedCost: 20, estimatedMinutes: 50, rating: 4.0, tags: ['bowling', 'neon', 'group fun'], indoor: true, source: 'mock' },
];

// ── Get Mock Places (optionally filtered) ────────────────────────────

export function getMockPlaces(category?: PlaceCategory): Place[] {
  if (category) return NYC_PLACES.filter(p => p.category === category);
  return NYC_PLACES;
}

export function getMockPlacesByCategories(categories: PlaceCategory[]): Place[] {
  return NYC_PLACES.filter(p => categories.includes(p.category));
}

// ── Featured Tonight (mock) ──────────────────────────────────────────

export const FEATURED_TONIGHT = [
  {
    id: 'ft-1',
    title: 'Golden Hour at the High Line',
    subtitle: 'Walk above the city as the sun dips — then hit a rooftop dessert spot.',
    vibe: 'main-character' as const,
    gradient: 'from-orange-400 to-rose-500',
  },
  {
    id: 'ft-2',
    title: 'Midnight Noodle Crawl',
    subtitle: 'Three ramen spots. One night. Your stomach will thank you (eventually).',
    vibe: 'foodie' as const,
    gradient: 'from-red-500 to-purple-600',
  },
  {
    id: 'ft-3',
    title: 'Bookstore Bingo',
    subtitle: 'Hit 3 bookstores, find a book at each. Bonus: read the first chapter at a café.',
    vibe: 'artsy' as const,
    gradient: 'from-emerald-400 to-cyan-500',
  },
];

// ── Local Gems (mock) ────────────────────────────────────────────────

export const LOCAL_GEMS = [
  {
    id: 'lg-1',
    name: 'Hidden Jazz Café',
    neighborhood: 'East Village',
    category: 'cafe' as PlaceCategory,
    tagline: 'Live jazz, no cover, great cortados.',
    image: '🎷',
  },
  {
    id: 'lg-2',
    name: 'Rooftop Garden Bar',
    neighborhood: 'Chelsea',
    category: 'bar' as PlaceCategory,
    tagline: 'Sunset cocktails 17 floors up.',
    image: '🌇',
  },
  {
    id: 'lg-3',
    name: 'Vintage Vinyl',
    neighborhood: 'Williamsburg',
    category: 'shopping' as PlaceCategory,
    tagline: 'Dig through crates. Find your sound.',
    image: '📀',
  },
  {
    id: 'lg-4',
    name: 'Secret Dumpling Window',
    neighborhood: 'Chinatown',
    category: 'restaurant' as PlaceCategory,
    tagline: '6 dumplings for $2.50. No questions.',
    image: '🥟',
  },
  {
    id: 'lg-5',
    name: 'The Whispering Gallery',
    neighborhood: 'Midtown',
    category: 'attraction' as PlaceCategory,
    tagline: 'Architectural wonder hidden in Grand Central.',
    image: '🏛️',
  },
];
