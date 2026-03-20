import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ── Queries ─────────────────────────────────────────────────────────

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return null;

    return await ctx.db
      .query("plannedRoutes")
      .withIndex("by_user_and_active", (q) =>
        q.eq("userId", user._id).eq("isActive", true)
      )
      .order("desc")
      .first();
  },
});

export const listSaved = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    return await ctx.db
      .query("plannedRoutes")
      .withIndex("by_user_and_saved", (q) =>
        q.eq("userId", user._id).eq("savedForLater", true)
      )
      .order("desc")
      .take(50);
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    return await ctx.db
      .query("plannedRoutes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
  },
});

export const getByRouteId = query({
  args: { routeId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return null;

    return await ctx.db
      .query("plannedRoutes")
      .withIndex("by_user_and_route_id", (q) =>
        q.eq("userId", user._id).eq("routeId", args.routeId)
      )
      .first();
  },
});

export const getById = query({
  args: { id: v.id("plannedRoutes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ── Mutations ───────────────────────────────────────────────────────

export const createOrUpdate = mutation({
  args: {
    routeId:       v.string(),
    title:         v.string(),
    vibe:          v.string(),
    city:          v.string(),
    routeData:     v.any(),
    isActive:      v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return null;

    const now = Date.now();
    const isActive = args.isActive ?? false;

    // If setting this route as active, deactivate other active routes
    if (isActive) {
      const activeRoutes = await ctx.db
        .query("plannedRoutes")
        .withIndex("by_user_and_active", (q) =>
          q.eq("userId", user._id).eq("isActive", true)
        )
        .take(10);

      for (const r of activeRoutes) {
        if (r.routeId !== args.routeId) {
          await ctx.db.patch(r._id, { isActive: false, updatedAt: now });
        }
      }
    }

    // Check if this route already exists
    const existing = await ctx.db
      .query("plannedRoutes")
      .withIndex("by_user_and_route_id", (q) =>
        q.eq("userId", user._id).eq("routeId", args.routeId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        title:     args.title,
        vibe:      args.vibe,
        city:      args.city,
        routeData: args.routeData,
        isActive,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("plannedRoutes", {
      userId:        user._id,
      routeId:       args.routeId,
      title:         args.title,
      vibe:          args.vibe,
      city:          args.city,
      routeData:     args.routeData,
      isActive,
      savedForLater: false,
      createdAt:     now,
      updatedAt:     now,
    });
  },
});

export const setSavedForLater = mutation({
  args: {
    routeId: v.string(),
    saved:   v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return;

    const route = await ctx.db
      .query("plannedRoutes")
      .withIndex("by_user_and_route_id", (q) =>
        q.eq("userId", user._id).eq("routeId", args.routeId)
      )
      .first();

    if (route) {
      await ctx.db.patch(route._id, {
        savedForLater: args.saved,
        updatedAt:     Date.now(),
      });
    }
  },
});

export const markCompleted = mutation({
  args: { routeId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return;

    const route = await ctx.db
      .query("plannedRoutes")
      .withIndex("by_user_and_route_id", (q) =>
        q.eq("userId", user._id).eq("routeId", args.routeId)
      )
      .first();

    if (route) {
      await ctx.db.patch(route._id, {
        completedAt: Date.now(),
        isActive:    false,
        updatedAt:   Date.now(),
      });
    }
  },
});
