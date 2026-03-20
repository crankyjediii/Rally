import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Returns the current user's saved preferences, or null. */
export const getPreferences = query({
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
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
  },
});

/**
 * Creates or replaces preferences for the current user.
 * Safe to call on every route generation — always overwrites with latest.
 */
export const updatePreferences = mutation({
  args: {
    vibe: v.string(),
    groupType: v.string(),
    budget: v.string(),
    timeAvailable: v.string(),
    radius: v.string(),
    energy: v.string(),
    indoorOutdoor: v.string(),
    foodRequired: v.boolean(),
    attractionRequired: v.boolean(),
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
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("userPreferences", {
        userId: user._id,
        ...args,
        updatedAt: Date.now(),
      });
    }
  },
});
