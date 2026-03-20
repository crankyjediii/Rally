import { auth, currentUser } from '@clerk/nextjs/server';
import { stripe, callConvexInternal } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

interface CheckoutRequest {
  priceId:        string;
  addOnPriceIds?: string[];
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: CheckoutRequest;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { priceId, addOnPriceIds = [] } = body;
  if (!priceId) {
    return Response.json({ error: 'priceId is required' }, { status: 400 });
  }

  // Get the user's email and existing stripeCustomerId from Convex
  const clerkUser = await currentUser();
  const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;

  let existingStripeCustomerId: string | null = null;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Convex ${process.env.CONVEX_DEPLOY_KEY}`,
      },
      body: JSON.stringify({
        path: 'users:getByClerkId',
        args: { clerkId: userId },
        format: 'json',
      }),
    });
    if (res.ok) {
      const data = await res.json();
      existingStripeCustomerId = data?.value?.stripeCustomerId ?? null;
    }
  } catch {
    // Non-fatal — proceed without customer ID
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  // Build line items: base subscription price + any selected add-ons
  const lineItems = [
    { price: priceId, quantity: 1 },
    ...addOnPriceIds.map((pid) => ({ price: pid, quantity: 1 })),
  ];

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: lineItems,
      // Store clerkId in metadata so the webhook can match the user
      subscription_data: {
        metadata: { clerkId: userId },
        trial_period_days: 7,
      },
      metadata: { clerkId: userId },
      // Use existing Stripe customer if available, otherwise pre-fill email
      ...(existingStripeCustomerId
        ? { customer: existingStripeCustomerId }
        : { customer_email: userEmail }),
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${appUrl}/premium`,
      allow_promotion_codes: true,
    });

    // If this is a new customer, store the customer ID now (before webhook fires)
    if (!existingStripeCustomerId && session.customer) {
      try {
        await callConvexInternal('subscriptions:upsertSubscription', {
          clerkId: userId,
          stripeCustomerId: session.customer as string,
          // We don't have full subscription data yet — the webhook will complete this.
          // Just store the customer ID by calling setStripeCustomerId approach via users.
        });
      } catch {
        // Non-fatal — webhook will sync the customer ID
      }
    }

    return Response.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout session creation failed:', err);
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
