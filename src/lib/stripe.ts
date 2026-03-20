import Stripe from 'stripe';

// Server-only — never import this in client components.
// The Stripe secret key is never exposed to the browser.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
  typescript: true,
});

// Config-driven price ID map — single source of truth for all Stripe price IDs.
// Populated from environment variables so they are never scattered through the codebase.
export const STRIPE_PRICE_IDS = {
  mainEvent: {
    monthly: process.env.STRIPE_PRICE_MAIN_EVENT_MONTHLY!,
    yearly:  process.env.STRIPE_PRICE_MAIN_EVENT_YEARLY!,
  },
  cityUnlimited: {
    monthly: process.env.STRIPE_PRICE_CITY_UNLIMITED_MONTHLY!,
    yearly:  process.env.STRIPE_PRICE_CITY_UNLIMITED_YEARLY!,
  },
  addOns: {
    'date-planner': process.env.STRIPE_PRICE_ADDON_DATE_PLANNER!,
    'hidden-gems':  process.env.STRIPE_PRICE_ADDON_HIDDEN_GEMS!,
    'group-mode':   process.env.STRIPE_PRICE_ADDON_GROUP_VOTING!,
    'weekly-drops': process.env.STRIPE_PRICE_ADDON_WEEKLY_DROPS!,
  },
} as const;

/**
 * Returns the tier name for a given Stripe price ID.
 * Returns null if the price ID belongs to an add-on or is unrecognized.
 */
export function getTierForPriceId(priceId: string): 'main-event' | 'city-unlimited' | null {
  const { mainEvent, cityUnlimited } = STRIPE_PRICE_IDS;
  if ((Object.values(mainEvent) as string[]).includes(priceId))    return 'main-event';
  if ((Object.values(cityUnlimited) as string[]).includes(priceId)) return 'city-unlimited';
  return null;
}

/**
 * Calls a Convex internal mutation from a server-side context (e.g. webhook handler).
 * Uses the CONVEX_DEPLOY_KEY to authorize the call — this key must never be sent
 * to the browser.
 */
export async function callConvexInternal(
  functionPath: string,
  args: Record<string, unknown>
): Promise<void> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const deployKey = process.env.CONVEX_DEPLOY_KEY;
  if (!convexUrl || !deployKey) {
    throw new Error('Missing NEXT_PUBLIC_CONVEX_URL or CONVEX_DEPLOY_KEY');
  }

  const res = await fetch(`${convexUrl}/api/mutation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Convex ${deployKey}`,
    },
    body: JSON.stringify({ path: functionPath, args, format: 'json' }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Convex internal mutation failed [${res.status}]: ${text}`);
  }
}
