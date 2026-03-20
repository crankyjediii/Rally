import { stripe, getTierForPriceId, callConvexInternal } from '@/lib/stripe';
import type Stripe from 'stripe';
import type { SubscriptionStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

// App Router: read raw body with req.text() — do NOT use req.json().
// Stripe needs the raw bytes to verify the webhook signature.
export async function POST(req: Request) {
  const body = await req.text();
  const sig  = req.headers.get('stripe-signature');

  if (!sig) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    return new Response(`Webhook signature verification failed: ${err}`, { status: 400 });
  }

  try {
    await handleStripeEvent(event);
  } catch (err) {
    console.error(`Failed to handle Stripe event ${event.type}:`, err);
    // Return 200 to prevent Stripe from retrying — log the failure instead
    return new Response('Webhook handler error — logged', { status: 200 });
  }

  return new Response('ok', { status: 200 });
}

async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      await syncSubscription(sub);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await callConvexInternal('subscriptions:cancelSubscription', {
        stripeSubscriptionId: sub.id,
      });
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = invoice.parent?.type === 'subscription_details'
        ? invoice.parent.subscription_details?.subscription
        : null;
      if (subId) {
        const subIdStr = typeof subId === 'string' ? subId : subId.id;
        const sub = await stripe.subscriptions.retrieve(subIdStr);
        await syncSubscription(sub, 'past_due');
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = invoice.parent?.type === 'subscription_details'
        ? invoice.parent.subscription_details?.subscription
        : null;
      if (subId) {
        const subIdStr = typeof subId === 'string' ? subId : subId.id;
        const sub = await stripe.subscriptions.retrieve(subIdStr);
        await syncSubscription(sub);
      }
      break;
    }

    case 'checkout.session.completed':
      // The subscription.created event fires alongside this and carries
      // the full subscription state, so no extra action needed here.
      break;

    default:
      // Unhandled event type — safe to ignore
      break;
  }
}

/**
 * Syncs a Stripe subscription object to Convex.
 * Separates base tier price from add-on prices and calls upsertSubscription.
 */
async function syncSubscription(
  sub: Stripe.Subscription,
  overrideStatus?: SubscriptionStatus
) {
  const clerkId = sub.metadata?.clerkId;
  if (!clerkId) {
    console.warn(`syncSubscription: no clerkId in metadata for subscription ${sub.id}`);
    return;
  }

  // Walk all line items to separate the base tier price from add-ons
  const allPriceIds = sub.items.data.map((item) => item.price.id);
  let basePriceId: string | null = null;
  const addOnPriceIds: string[] = [];

  for (const priceId of allPriceIds) {
    const tier = getTierForPriceId(priceId);
    if (tier && !basePriceId) {
      basePriceId = priceId;
    } else {
      addOnPriceIds.push(priceId);
    }
  }

  if (!basePriceId) {
    console.warn(`syncSubscription: no recognized tier price in subscription ${sub.id}`, allPriceIds);
    return;
  }

  const tier = getTierForPriceId(basePriceId)!;

  // Map Stripe status string to our union type, falling back to 'incomplete'
  const validStatuses: SubscriptionStatus[] = ['active', 'trialing', 'past_due', 'canceled', 'incomplete'];
  const rawStatus = overrideStatus ?? (sub.status as SubscriptionStatus);
  const status: SubscriptionStatus = validStatuses.includes(rawStatus) ? rawStatus : 'incomplete';

  // In Stripe API 2026+, current_period_start/end live on each SubscriptionItem,
  // not on the Subscription itself. Use the base tier item's billing period.
  const baseItem = sub.items.data.find((item) => item.price.id === basePriceId);
  const periodStart = baseItem?.current_period_start ?? sub.billing_cycle_anchor;
  const periodEnd   = baseItem?.current_period_end   ?? sub.billing_cycle_anchor;

  await callConvexInternal('subscriptions:upsertSubscription', {
    clerkId,
    stripeCustomerId:     typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
    stripeSubscriptionId: sub.id,
    stripePriceId:        basePriceId,
    tier,
    status,
    currentPeriodStart:   periodStart,
    currentPeriodEnd:     periodEnd,
    cancelAtPeriodEnd:    sub.cancel_at_period_end,
    activeAddOnPriceIds:  addOnPriceIds,
  });
}
