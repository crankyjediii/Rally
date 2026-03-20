'use client';

import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { computeEntitlements } from '@/lib/entitlements';
import type { SubscriptionTier } from '@/lib/types';

// Client-safe add-on price ID map — these are populated from NEXT_PUBLIC_ env vars.
// Stripe price IDs are not secrets and are safe to expose in the browser.
function getAddOnPriceMap(): Record<string, string> {
  return {
    'date-planner': process.env.NEXT_PUBLIC_STRIPE_PRICE_ADDON_DATE_PLANNER ?? '',
    'hidden-gems':  process.env.NEXT_PUBLIC_STRIPE_PRICE_ADDON_HIDDEN_GEMS  ?? '',
    'group-mode':   process.env.NEXT_PUBLIC_STRIPE_PRICE_ADDON_GROUP_VOTING ?? '',
    'weekly-drops': process.env.NEXT_PUBLIC_STRIPE_PRICE_ADDON_WEEKLY_DROPS ?? '',
  };
}

export function useSubscription() {
  const sub = useQuery(api.subscriptions.getMySubscription);

  // sub === undefined means the query is still loading
  const isLoading = sub === undefined;

  // Active if status is active or trialing; everything else is treated as free Scout tier
  const isActive = sub?.status === 'active' || sub?.status === 'trialing';
  const tier: SubscriptionTier = isActive ? (sub!.tier as SubscriptionTier) : 'scout';

  const entitlements = computeEntitlements(
    tier,
    sub?.activeAddOnPriceIds ?? [],
    getAddOnPriceMap()
  );

  return {
    isLoading,
    tier,
    entitlements,
    sub:        sub ?? null,
    isActive,
    isPaidTier: tier !== 'scout',
  };
}
