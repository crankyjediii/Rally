import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── Users ──────────────────────────────────────────────────────────
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    city: v.optional(v.string()),
    joinedAt: v.string(),        // ISO string
    routesCompleted: v.number(),
    streak: v.number(),
    streakLastDate: v.string(),  // "YYYY-MM-DD"
    isPremium: v.boolean(),
    stripeCustomerId: v.optional(v.string()),
    referralCode: v.string(),
    localDataImported: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  // ── Saved Routes ───────────────────────────────────────────────────
  savedRoutes: defineTable({
    userId: v.id("users"),
    routeId: v.string(),       // original GeneratedRoute.id — dedup key
    title: v.string(),
    vibe: v.string(),
    city: v.string(),
    totalCost: v.number(),
    totalTime: v.string(),
    stopCount: v.number(),
    savedAt: v.string(),       // ISO string
    routeData: v.any(),        // full SavedRoute JSON blob
  })
    .index("by_user", ["userId"])
    .index("by_user_and_route", ["userId", "routeId"]),

  // ── Route History ──────────────────────────────────────────────────
  routeHistory: defineTable({
    userId: v.id("users"),
    routeId: v.string(),
    title: v.string(),
    vibe: v.string(),
    city: v.string(),
    completedStops: v.number(),
    totalStops: v.number(),
    finishedAt: v.string(),    // ISO string
    routeData: v.any(),        // full GeneratedRoute JSON blob
  })
    .index("by_user", ["userId"])
    .index("by_user_and_route", ["userId", "routeId"]),

  // ── User Preferences ───────────────────────────────────────────────
  userPreferences: defineTable({
    userId: v.id("users"),
    vibe: v.string(),
    groupType: v.string(),
    budget: v.string(),
    timeAvailable: v.string(),
    radius: v.string(),
    energy: v.string(),
    indoorOutdoor: v.string(),
    foodRequired: v.boolean(),
    attractionRequired: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // ── User Badges ────────────────────────────────────────────────────
  userBadges: defineTable({
    userId: v.id("users"),
    badgeId: v.string(),
    earned: v.boolean(),
    earnedAt: v.optional(v.string()),  // ISO string
  })
    .index("by_user", ["userId"])
    .index("by_user_and_badge", ["userId", "badgeId"]),

  // ── Planned Routes (canonical route storage) ───────────────────────
  plannedRoutes: defineTable({
    userId:          v.id("users"),
    routeId:         v.string(),            // GeneratedRoute.id — dedup key
    title:           v.string(),
    vibe:            v.string(),
    city:            v.string(),
    routeData:       v.any(),               // full GeneratedRoute JSON blob
    isActive:        v.boolean(),           // currently loaded in editor
    savedForLater:   v.boolean(),           // user explicitly saved
    completedAt:     v.optional(v.number()), // timestamp if finished
    createdAt:       v.number(),
    updatedAt:       v.number(),
  })
    .index("by_user",            ["userId"])
    .index("by_user_and_route_id", ["userId", "routeId"])
    .index("by_user_and_active", ["userId", "isActive"])
    .index("by_user_and_saved",  ["userId", "savedForLater"]),

  // ── Subscriptions ──────────────────────────────────────────────────
  subscriptions: defineTable({
    userId:               v.id("users"),
    stripeCustomerId:     v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId:        v.string(),   // base tier price ID
    tier:                 v.union(v.literal("main-event"), v.literal("city-unlimited")),
    status:               v.union(
                            v.literal("active"),
                            v.literal("trialing"),
                            v.literal("past_due"),
                            v.literal("canceled"),
                            v.literal("incomplete")
                          ),
    currentPeriodStart:   v.number(),   // Unix timestamp (seconds)
    currentPeriodEnd:     v.number(),   // Unix timestamp (seconds)
    cancelAtPeriodEnd:    v.boolean(),
    activeAddOnPriceIds:  v.array(v.string()),  // active add-on Stripe price IDs
    createdAt:            v.number(),
    updatedAt:            v.number(),
  })
    .index("by_user",                ["userId"])
    .index("by_stripe_subscription", ["stripeSubscriptionId"])
    .index("by_stripe_customer",     ["stripeCustomerId"]),
});
