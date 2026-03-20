import { STORAGE_KEYS } from './constants';
import {
  UserPreferences, SavedRoute, RouteHistoryItem, Badge, UserProfile,
  GeneratedRoute, LocationData, CandidatePool
} from './types';
import { DEFAULT_PREFERENCES, ALL_BADGES } from './constants';

// ── Generic Storage Helpers ──────────────────────────────────────────

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable
  }
}

// ── Preferences ──────────────────────────────────────────────────────

export function getPreferences(): UserPreferences {
  return getItem(STORAGE_KEYS.PREFERENCES, DEFAULT_PREFERENCES);
}

export function savePreferences(prefs: UserPreferences): void {
  setItem(STORAGE_KEYS.PREFERENCES, prefs);
}

// ── Saved Routes ─────────────────────────────────────────────────────

export function getSavedRoutes(): SavedRoute[] {
  return getItem(STORAGE_KEYS.SAVED_ROUTES, []);
}

export function saveRoute(route: GeneratedRoute): void {
  const saved = getSavedRoutes();
  const exists = saved.find(r => r.id === route.id);
  if (!exists) {
    saved.unshift({ ...route, saved: true, savedAt: new Date().toISOString() });
    setItem(STORAGE_KEYS.SAVED_ROUTES, saved);
  }
}

export function unsaveRoute(routeId: string): void {
  const saved = getSavedRoutes().filter(r => r.id !== routeId);
  setItem(STORAGE_KEYS.SAVED_ROUTES, saved);
}

// ── Route History ────────────────────────────────────────────────────

export function getRouteHistory(): RouteHistoryItem[] {
  return getItem(STORAGE_KEYS.ROUTE_HISTORY, []);
}

export function addToHistory(route: GeneratedRoute, completedStops: number): void {
  const history = getRouteHistory();
  history.unshift({
    route,
    completedStops,
    totalStops: route.stops.length,
    finishedAt: new Date().toISOString(),
  });
  // Keep only 50 most recent
  setItem(STORAGE_KEYS.ROUTE_HISTORY, history.slice(0, 50));
}

// ── Badges ───────────────────────────────────────────────────────────

export function getBadges(): Badge[] {
  return getItem(STORAGE_KEYS.BADGES, ALL_BADGES);
}

export function earnBadge(badgeId: string): Badge[] {
  const badges = getBadges().map(b =>
    b.id === badgeId ? { ...b, earned: true, earnedAt: new Date().toISOString() } : b
  );
  setItem(STORAGE_KEYS.BADGES, badges);
  return badges;
}

// ── Profile ──────────────────────────────────────────────────────────

const DEFAULT_PROFILE: UserProfile = {
  name: 'Rally Explorer',
  city: '',
  joinedAt: new Date().toISOString(),
  routesCompleted: 0,
  streak: 0,
  badges: ALL_BADGES,
  isPremium: false,
  referralCode: 'RALLY' + Math.random().toString(36).slice(2, 7).toUpperCase(),
};

export function getProfile(): UserProfile {
  return getItem(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
}

export function updateProfile(updates: Partial<UserProfile>): void {
  const profile = getProfile();
  setItem(STORAGE_KEYS.PROFILE, { ...profile, ...updates });
}

// ── Streak ───────────────────────────────────────────────────────────

interface StreakData {
  count: number;
  lastDate: string;
}

export function getStreak(): StreakData {
  return getItem(STORAGE_KEYS.STREAK, { count: 0, lastDate: '' });
}

export function updateStreak(): void {
  const streak = getStreak();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (streak.lastDate === today) return;
  if (streak.lastDate === yesterday) {
    setItem(STORAGE_KEYS.STREAK, { count: streak.count + 1, lastDate: today });
  } else {
    setItem(STORAGE_KEYS.STREAK, { count: 1, lastDate: today });
  }
}

// ── Premium ──────────────────────────────────────────────────────────

export function isPremium(): boolean {
  return getItem(STORAGE_KEYS.PREMIUM, false);
}

export function setPremium(value: boolean): void {
  setItem(STORAGE_KEYS.PREMIUM, value);
}

// ── Location ─────────────────────────────────────────────────────────

export function getLastLocation(): LocationData | null {
  return getItem(STORAGE_KEYS.LAST_LOCATION, null);
}

export function saveLastLocation(loc: LocationData): void {
  setItem(STORAGE_KEYS.LAST_LOCATION, loc);
}

// ── Current Route ────────────────────────────────────────────────────

export function getCurrentRoute(): GeneratedRoute | null {
  return getItem(STORAGE_KEYS.CURRENT_ROUTE, null);
}

export function setCurrentRoute(route: GeneratedRoute | null): void {
  setItem(STORAGE_KEYS.CURRENT_ROUTE, route);
}

// ── Candidate Pool ────────────────────────────────────────────────────
// Stored alongside the current route so reroll/swap/wildcard use real nearby data

export function getCandidatePool(): CandidatePool | null {
  return getItem(STORAGE_KEYS.CANDIDATE_POOL, null);
}

export function setCandidatePool(pool: CandidatePool | null): void {
  setItem(STORAGE_KEYS.CANDIDATE_POOL, pool);
}
