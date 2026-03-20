import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Look up the user's stripeCustomerId from Convex
  let stripeCustomerId: string | null = null;
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
      stripeCustomerId = data?.value?.stripeCustomerId ?? null;
    }
  } catch (err) {
    console.error('Failed to fetch stripeCustomerId from Convex:', err);
  }

  if (!stripeCustomerId) {
    return Response.json(
      { error: 'No billing account found. Please subscribe first.' },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer:   stripeCustomerId,
      return_url: `${appUrl}/profile`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error('Stripe portal session creation failed:', err);
    return Response.json({ error: 'Failed to create billing portal session' }, { status: 500 });
  }
}
