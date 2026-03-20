import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Returns all badge records for the current user (only earned ones are stored). */
export const getBadges = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return [];
    return await ctx.db
      .query("userBadges")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

/** Creates or updates a badge record for the current user. */
export const updateBadge = mutation({
  args: {
    badgeId: v.string(),
    earned: v.boolean(),
    earnedAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const existing = await ctx.db
      .query("userBadges")
      .withIndex("by_user_and_badge", (q) =>
        q.eq("userId", user._id).eq("badgeId", args.badgeId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        earned: args.earned,
        earnedAt: args.earnedAt,
      });
    } else {
      await ctx.db.insert("userBadges", {
        userId: user._id,
        badgeId: args.badgeId,
        earned: args.earned,
        earnedAt: args.earnedAt,
      });
    }
  },
});

/**
 * Bulk imports earned badges from localStorage on first sign-in.
 * Only processes badges where earned === true.
 * Skips if the badge is already recorded as earned.
 */
export const importLocalBadges = mutation({
  args: {
    badges: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    for (const badge of args.badges) {
      if (!badge?.earned) continue;

      const badgeId = badge?.id as string | undefined;
      if (!badgeId) continue;

      const existing = await ctx.db
        .query("userBadges")
        .withIndex("by_user_and_badge", (q) =>
          q.eq("userId", user._id).eq("badgeId", badgeId)
        )
        .unique();

      if (existing) {
        if (existing.earned) continue;
        await ctx.db.patch(existing._id, {
          earned: true,
          earnedAt: (badge?.earnedAt as string) ?? new Date().toISOString(),
        });
      } else {
        await ctx.db.insert("userBadges", {
          userId: user._id,
          badgeId,
          earned: true,
          earnedAt: (badge?.earnedAt as string) ?? new Date().toISOString(),
        });
      }
    }
  },
});
