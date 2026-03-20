// ── Overpass API Utility ──────────────────────────────────────────────
// Server-safe: no browser APIs. Importable from API routes and server actions.

import { Place, PlaceCategory } from './types';

// Map Overpass amenity/shop/leisure/tourism types to Rally categories
export const OSM_CATEGORY_MAP: Record<string, PlaceCategory> = {
  // Food & drink
  restaurant: 'restaurant',
  fast_food: 'restaurant',
  cafe: 'cafe',
  coffee_shop: 'cafe',
  ice_cream: 'dessert',
  confectionery: 'dessert',
  pastry: 'dessert',
  bakery: 'dessert',
  // Outdoor / nature
  park: 'park',
  garden: 'park',
  nature_reserve: 'park',
  // Culture
  museum: 'museum',
  gallery: 'museum',
  art_gallery: 'museum',
  // Shopping
  books: 'bookstore',
  bookshop: 'bookstore',
  mall: 'shopping',
  marketplace: 'shopping',
  clothes: 'shopping',
  gift: 'shopping',
  market: 'shopping',
  // Entertainment
  amusement_arcade: 'arcade',
  // Scenic / viewpoints
  viewpoint: 'scenic',
  // Attractions
  attraction: 'attraction',
  zoo: 'attraction',
  aquarium: 'attraction',
  theme_park: 'attraction',
  monument: 'attraction',
  memorial: 'attraction',
  ruins: 'attraction',
  // Activities
  bowling_alley: 'activity',
  escape_game: 'activity',
  fitness_centre: 'activity',
  sports_centre: 'activity',
  miniature_golf: 'activity',
  climbing: 'activity',
  // Bars / nightlife
  bar: 'bar',
  pub: 'bar',
  biergarten: 'bar',
  nightclub: 'nightlife',
};

export function estimatePriceLevel(tags: Record<string, string>): 1 | 2 | 3 | 4 {
  if (tags.cuisine?.includes('fine_dining')) return 4;
  if (tags.fee === 'yes' || tags.charge) return 2;
  if (tags.fee === 'no' || tags.access === 'yes') return 1;
  return 2;
}

export function estimateCost(category: PlaceCategory, priceLevel: number): number {
  const base: Record<string, number> = {
    cafe: 5, restaurant: 15, dessert: 6, park: 0, museum: 15, bookstore: 10,
    arcade: 12, scenic: 0, attraction: 10, activity: 18, shopping: 15, bar: 12, nightlife: 15,
  };
  return Math.round((base[category] || 10) * (priceLevel * 0.6));
}

export function estimateMinutes(category: PlaceCategory): number {
  const base: Record<string, number> = {
    cafe: 25, restaurant: 45, dessert: 15, park: 30, museum: 60, bookstore: 30,
    arcade: 40, scenic: 20, attraction: 45, activity: 50, shopping: 35, bar: 40, nightlife: 60,
  };
  return base[category] || 30;
}

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

export async function fetchOverpassPlaces(
  lat: number,
  lng: number,
  radius: number,
): Promise<Place[]> {
  const r = radius.toString();
  const overpassQuery = `
    [out:json][timeout:20];
    (
      node["amenity"~"restaurant|cafe|fast_food|ice_cream|bar|pub|biergarten|nightclub"](around:${r},${lat},${lng});
      node["shop"~"bakery|confectionery|pastry|books|bookshop|clothes|gift|mall|marketplace|market"](around:${r},${lat},${lng});
      node["leisure"~"park|garden|amusement_arcade|bowling_alley|escape_game|fitness_centre|sports_centre|miniature_golf|climbing"](around:${r},${lat},${lng});
      node["tourism"~"museum|gallery|viewpoint|attraction|zoo|aquarium|monument|memorial"](around:${r},${lat},${lng});
      way["leisure"="park"](around:${r},${lat},${lng});
      way["tourism"~"museum|attraction"](around:${r},${lat},${lng});
    );
    out body 100;
    >;
    out skel qt;
  `;

  const body = `data=${encodeURIComponent(overpassQuery)}`;
  const fetchOptions: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  };

  let lastError: Error | null = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, fetchOptions);
      if (res.status === 429) {
        // Rate-limited — wait briefly then try next endpoint
        await new Promise(resolve => setTimeout(resolve, 1200));
        lastError = new Error(`Overpass API returned 429 at ${endpoint}`);
        continue;
      }
      if (!res.ok) {
        lastError = new Error(`Overpass API returned ${res.status} at ${endpoint}`);
        continue;
      }

      const data = await res.json();
      const places: Place[] = [];
      const seenIds = new Set<string>();

      for (const element of data.elements || []) {
        const tags = element.tags || {};
        const name = tags.name;
        if (!name) continue;

        const amenityKey = tags.amenity || tags.shop || tags.leisure || tags.tourism || '';
        const category = OSM_CATEGORY_MAP[amenityKey];
        if (!category) continue;

        const elLat = element.lat ?? element.center?.lat;
        const elLng = element.lon ?? element.center?.lon;
        if (!elLat || !elLng) continue;

        const osmId = `osm-${element.id}`;
        if (seenIds.has(osmId)) continue;
        seenIds.add(osmId);

        const priceLevel = estimatePriceLevel(tags);

        places.push({
          id: osmId,
          name,
          category,
          lat: elLat,
          lng: elLng,
          address: [
            tags['addr:housenumber'],
            tags['addr:street'],
            tags['addr:city'],
          ].filter(Boolean).join(' ') || 'Nearby',
          priceLevel: priceLevel as 1 | 2 | 3 | 4,
          estimatedCost: estimateCost(category, priceLevel),
          estimatedMinutes: estimateMinutes(category),
          rating: undefined,
          // Deduplicate tags — amenityKey and tags.cuisine can both be "ice_cream" for the same place
          tags: [...new Set([amenityKey, tags.cuisine, tags.sport].filter(Boolean) as string[])],
          indoor: category !== 'park' && category !== 'scenic',
          source: 'osm',
        });
      }

      return places;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error('All Overpass endpoints failed');
}
