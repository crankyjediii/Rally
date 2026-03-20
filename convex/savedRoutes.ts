import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Returns all saved routes for the current user, newest first. */
export const getSavedRoutes = query({
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
      .query("savedRoutes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

/**
 * Saves a route for the current user.
 * Idempotent — will not create duplicates for the same routeId.
 */
export const saveRoute = mutation({
  args: {
    routeId: v.string(),
    title: v.string(),
    vibe: v.string(),
    city: v.string(),
    totalCost: v.number(),
    totalTime: v.string(),
    stopCount: v.number(),
    savedAt: v.string(),
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
      .query("savedRoutes")
      .withIndex("by_user_and_route", (q) =>
        q.eq("userId", user._id).eq("routeId", args.routeId)
      )
      .unique();
    if (existing) return existing._id;

    return await ctx.db.insert("savedRoutes", {
      userId: user._id,
      ...args,
    });
  },
});

/** Removes a saved route by its original routeId string. */
export const unsaveRoute = mutation({
  args: { routeId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const existing = await ctx.db
      .query("savedRoutes")
      .withIndex("by_user_and_route", (q) =>
        q.eq("userId", user._id).eq("routeId", args.routeId)
      )
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});

/**
 * Bulk imports saved routes from localStorage on first sign-in.
 * Skips any route whose routeId already exists for this user.
 */
export const importLocalRoutes = mutation({
  args: {
    routes: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    for (const route of args.routes) {
      const routeId = route?.id as string | undefined;
      if (!routeId) continue;

      const existing = await ctx.db
        .query("savedRoutes")
        .withIndex("by_user_and_route", (q) =>
          q.eq("userId", user._id).eq("routeId", routeId)
        )
        .unique();
      if (existing) continue;

      await ctx.db.insert("savedRoutes", {
        userId: user._id,
        routeId,
        title: (route?.title as string) ?? "Untitled Route",
        vibe: (route?.vibe as string) ?? "cozy",
        city: (route?.city as string) ?? "",
        totalCost: (route?.totalCost as number) ?? 0,
        totalTime: (route?.totalTime as string) ?? "",
        stopCount: Array.isArray(route?.stops) ? route.stops.length : 0,
        savedAt: (route?.savedAt as string) ?? new Date().toISOString(),
        routeData: route,
      });
    }
  },
});
