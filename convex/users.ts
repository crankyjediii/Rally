import { mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/** Returns the current authenticated user's Convex document, or null. */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

/**
 * Creates a user document if none exists, or updates name/email/imageUrl.
 * Called on every sign-in via useEnsureUser hook.
 * Returns the Convex document _id.
 */
export const createOrUpdateUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
        imageUrl: args.imageUrl,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    const referralCode =
      "RALLY" + Math.random().toString(36).slice(2, 7).toUpperCase();

    return await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: args.email,
      name: args.name,
      imageUrl: args.imageUrl,
      city: "",
      joinedAt: new Date().toISOString(),
      routesCompleted: 0,
      streak: 0,
      streakLastDate: "",
      isPremium: false,
      referralCode,
      localDataImported: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Internal query — looks up a user by Clerk ID without requiring user auth.
 * Used by server-side API routes (checkout, portal) via the Convex deploy key.
 */
export const getByClerkId = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

/** Updates mutable profile fields. */
export const updateUserProfile = mutation({
  args: {
    name: v.optional(v.string()),
    city: v.optional(v.string()),
    isPremium: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, { ...args, updatedAt: Date.now() });
  },
});

/** Marks local data migration as complete — prevents re-running on future sign-ins. */
export const markLocalDataImported = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, {
      localDataImported: true,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Updates the streak counter.
 * Increments if last streak date was yesterday, resets to 1 if a day was missed.
 * No-ops if already updated today.
 */
export const updateStreak = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const today = new Date().toISOString().split("T")[0];
    if (user.streakLastDate === today) return;

    const yesterday = new Date(Date.now() - 86_400_000)
      .toISOString()
      .split("T")[0];

    const newStreak = user.streakLastDate === yesterday ? user.streak + 1 : 1;
    await ctx.db.patch(user._id, {
      streak: newStreak,
      streakLastDate: today,
      updatedAt: Date.now(),
    });
  },
});
