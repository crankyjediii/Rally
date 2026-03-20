// ── Utility Functions ────────────────────────────────────────────────

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function pickRandom<T>(arr: T[], count: number = 1): T[] {
  return shuffleArray(arr).slice(0, count);
}

export function formatCurrency(amount: number): string {
  if (amount === 0) return 'Free';
  return `$${amount.toFixed(0)}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getDistanceBetween(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3959; // miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function formatDistance(miles: number): string {
  if (miles < 0.2) return `${Math.round(miles * 5280)} ft`;
  return `${miles.toFixed(1)} mi`;
}

export function estimateWalkTime(miles: number): string {
  const minutes = Math.round(miles * 20); // ~3 mph walking
  return formatDuration(minutes);
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function categoryEmoji(category: string): string {
  const map: Record<string, string> = {
    restaurant: '🍽️',
    cafe: '☕',
    dessert: '🍰',
    park: '🌳',
    museum: '🏛️',
    attraction: '🎡',
    bookstore: '📚',
    arcade: '🕹️',
    shopping: '🛍️',
    scenic: '🌅',
    activity: '🎯',
    bar: '🍸',
    nightlife: '🌙',
  };
  return map[category] || '📍';
}

export function categoryLabel(category: string): string {
  const map: Record<string, string> = {
    restaurant: 'Restaurant',
    cafe: 'Café',
    dessert: 'Dessert',
    park: 'Park',
    museum: 'Museum',
    attraction: 'Attraction',
    bookstore: 'Bookstore',
    arcade: 'Arcade',
    shopping: 'Shopping',
    scenic: 'Scenic Spot',
    activity: 'Activity',
    bar: 'Bar',
    nightlife: 'Nightlife',
  };
  return map[category] || category;
}
