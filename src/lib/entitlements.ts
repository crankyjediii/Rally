import type { SubscriptionTier } from './types';

export interface Entitlements {
  // Core tier features
  unlimitedRerolls: boolean;
  advancedFilters:  boolean;
  noChains:         boolean;
  allThemes:        boolean;
  exclusiveBadges:  boolean;
  analytics:        boolean;
  // Add-on features (unlocked by add-on purchase OR bundled in City Unlimited)
  datePlannerPro:   boolean;
  hiddenGems:       boolean;
  groupVoting:      boolean;
  weeklyDrops:      boolean;
}

// Base entitlements per tier — add-ons computed separately
const BASE_ENTITLEMENTS: Record<
  SubscriptionTier,
  Omit<Entitlements, 'datePlannerPro' | 'hiddenGems' | 'groupVoting' | 'weeklyDrops'>
> = {
  scout: {
    unlimitedRerolls: false,
    advancedFilters:  false,
    noChains:         false,
    allThemes:        false,
    exclusiveBadges:  false,
    analytics:        false,
  },
  'main-event': {
    unlimitedRerolls: true,
    advancedFilters:  true,
    noChains:         true,
    allThemes:        true,
    exclusiveBadges:  true,
    analytics:        true,
  },
  'city-unlimited': {
    unlimitedRerolls: true,
    advancedFilters:  true,
    noChains:         true,
    allThemes:        true,
    exclusiveBadges:  true,
    analytics:        true,
  },
};

// City Unlimited bundles all add-ons at no extra cost
const CITY_UNLIMITED_BUNDLES_ALL_ADDONS = true;

/**
 * Compute the full entitlements for a user given their subscription tier
 * and the Stripe price IDs of their active add-on subscriptions.
 */
export function computeEntitlements(
  tier: SubscriptionTier,
  activeAddOnPriceIds: string[],
  addOnPriceMap: Record<string, string>,
): Entitlements {
  const base = BASE_ENTITLEMENTS[tier];
  const bundled = tier === 'city-unlimited' && CITY_UNLIMITED_BUNDLES_ALL_ADDONS;

  const hasAddOn = (addOnId: string): boolean =>
    bundled || activeAddOnPriceIds.includes(addOnPriceMap[addOnId] ?? '__none__');

  return {
    ...base,
    datePlannerPro: hasAddOn('date-planner'),
    hiddenGems:     hasAddOn('hidden-gems'),
    groupVoting:    hasAddOn('group-mode'),
    weeklyDrops:    hasAddOn('weekly-drops'),
  };
}

// Display metadata for each tier — used in pricing cards
export const TIER_DISPLAY = {
  scout: {
    name:       'Starter',
    emoji:      '🗺️',
    price:      { monthly: 'Free', yearly: 'Free' },
    priceNum:   { monthly: 0, yearly: 0 },
    description: 'The essentials. Start exploring.',
    color:      'text-text-secondary',
    ring:       'ring-border-default',
  },
  'main-event': {
    name:       'Golden Hour',
    emoji:      '☀️',
    price:      { monthly: '$7.99', yearly: '$59.99' },
    priceNum:   { monthly: 7.99, yearly: 59.99 },
    description: 'For the regulars. Unlock the full experience.',
    color:      'tier-golden-hour',
    ring:       'ring-rally-500/40',
  },
  'city-unlimited': {
    name:       'Afterglow',
    emoji:      '✨',
    price:      { monthly: '$14.99', yearly: '$119.99' },
    priceNum:   { monthly: 14.99, yearly: 119.99 },
    description: 'All packs included. No limits.',
    color:      'tier-afterglow',
    ring:       'ring-rally-pink/40',
  },
} as const;

// Feature list shown on each pricing card
export const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  scout: [
    '3 AI route rerolls/day',
    'Basic filters',
    '2 route themes',
    'Guest-friendly',
    'Save up to 5 routes',
  ],
  'main-event': [
    'Unlimited AI rerolls',
    'Full advanced filters',
    'No-chains mode',
    'All route themes',
    'Exclusive badges',
    'Analytics dashboard',
    'Save unlimited routes',
  ],
  'city-unlimited': [
    'Everything in Golden Hour',
    'Date Planner Pro — included',
    'Hidden Gems — included',
    'Group Voting — included',
    'Weekly Route Drops — included',
    'Early access to new features',
    'Priority support',
  ],
};
