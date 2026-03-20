import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Returns up to 50 history entries for the current user, newest first. */
export const getHistory = query({
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
      .query("routeHistory")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
  },
});

/**
 * Adds a completed route to history.
 * Idempotent by routeId. Also increments user.routesCompleted.
 */
export const addHistoryEntry = mutation({
  args: {
    routeId: v.string(),
    title: v.string(),
    vibe: v.string(),
    city: v.string(),
    completedStops: v.number(),
    totalStops: v.number(),
    finishedAt: v.string(),
    routeData: v.any(),
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
      .query("routeHistory")
      .withIndex("by_user_and_route", (q) =>
        q.eq("userId", user._id).eq("routeId", args.routeId)
      )
      .unique();
    if (existing) return existing._id;

    await ctx.db.patch(user._id, {
      routesCompleted: user.routesCompleted + 1,
      updatedAt: Date.now(),
    });

    return await ctx.db.insert("routeHistory", {
      userId: user._id,
      ...args,
    });
  },
});

/**
 * Bulk imports route history from localStorage on first sign-in.
 * Skips any entry whose routeId already exists for this user.
 */
export const importLocalHistory = mutation({
  args: {
    items: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    for (const item of args.items) {
      const routeId = item?.route?.id as string | undefined;
      if (!routeId) continue;

      const existing = await ctx.db
        .query("routeHistory")
        .withIndex("by_user_and_route", (q) =>
          q.eq("userId", user._id).eq("routeId", routeId)
        )
        .unique();
      if (existing) continue;

      await ctx.db.insert("routeHistory", {
        userId: user._id,
        routeId,
        title: (item?.route?.title as string) ?? "Untitled Route",
        vibe: (item?.route?.vibe as string) ?? "cozy",
        city: (item?.route?.city as string) ?? "",
        completedStops: (item?.completedStops as number) ?? 0,
        totalStops: (item?.totalStops as number) ?? 0,
        finishedAt: (item?.finishedAt as string) ?? new Date().toISOString(),
        routeData: item?.route,
      });
    }
  },
});
