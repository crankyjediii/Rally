import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ── Public Queries ────────────────────────────────────────────────────

/**
 * Returns the current authenticated user's active subscription, or null.
 * Used by useSubscription() hook on the client.
 */
export const getMySubscription = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    return await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();
  },
});

// ── Internal Mutations (called from webhook handler via deploy key) ────

/**
 * Creates or updates a subscription record from a Stripe webhook event.
 * Also keeps users.isPremium and users.stripeCustomerId in sync.
 *
 * Called by: Next.js /api/stripe/webhook route using CONVEX_DEPLOY_KEY.
 */
export const upsertSubscription = internalMutation({
  args: {
    clerkId:              v.string(),
    stripeCustomerId:     v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId:        v.string(),
    tier:                 v.union(v.literal("main-event"), v.literal("city-unlimited")),
    status:               v.union(
                            v.literal("active"),
                            v.literal("trialing"),
                            v.literal("past_due"),
                            v.literal("canceled"),
                            v.literal("incomplete")
                          ),
    currentPeriodStart:   v.number(),
    currentPeriodEnd:     v.number(),
    cancelAtPeriodEnd:    v.boolean(),
    activeAddOnPriceIds:  v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Look up user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!user) {
      console.error(`upsertSubscription: user not found for clerkId=${args.clerkId}`);
      return;
    }

    // 2. Keep isPremium + stripeCustomerId in sync on the user doc
    const isActiveOrTrialing = args.status === "active" || args.status === "trialing";
    await ctx.db.patch(user._id, {
      stripeCustomerId: args.stripeCustomerId,
      isPremium: isActiveOrTrialing,
      updatedAt: Date.now(),
    });

    // 3. Upsert the subscription row (match on stripeSubscriptionId)
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        stripePriceId:       args.stripePriceId,
        tier:                args.tier,
        status:              args.status,
        currentPeriodStart:  args.currentPeriodStart,
        currentPeriodEnd:    args.currentPeriodEnd,
        cancelAtPeriodEnd:   args.cancelAtPeriodEnd,
        activeAddOnPriceIds: args.activeAddOnPriceIds,
        updatedAt:           now,
      });
    } else {
      await ctx.db.insert("subscriptions", {
        userId:               user._id,
        stripeCustomerId:     args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        stripePriceId:        args.stripePriceId,
        tier:                 args.tier,
        status:               args.status,
        currentPeriodStart:   args.currentPeriodStart,
        currentPeriodEnd:     args.currentPeriodEnd,
        cancelAtPeriodEnd:    args.cancelAtPeriodEnd,
        activeAddOnPriceIds:  args.activeAddOnPriceIds,
        createdAt:            now,
        updatedAt:            now,
      });
    }
  },
});

/**
 * Marks a subscription as canceled when customer.subscription.deleted fires.
 * Also flips isPremium back to false on the user doc.
 */
export const cancelSubscription = internalMutation({
  args: {
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .unique();

    if (!sub) return; // Already gone or never recorded

    await ctx.db.patch(sub._id, {
      status:    "canceled",
      updatedAt: Date.now(),
    });

    // Flip isPremium off on the linked user doc
    await ctx.db.patch(sub.userId, {
      isPremium: false,
      updatedAt: Date.now(),
    });
  },
});
