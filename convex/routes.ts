import { v } from "convex/values";
import { query } from "./_generated/server";

// Cross-table route detail lookup — tries plannedRoutes, savedRoutes, routeHistory
// Returns the route data + metadata regardless of which table it's in.

export const getRouteDetails = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    // Try plannedRoutes first (most likely for new routes)
    try {
      const planned = await ctx.db.get(args.id as never);
      if (planned && 'routeData' in (planned as Record<string, unknown>)) {
        const doc = planned as Record<string, unknown>;
        // Determine source based on which fields exist
        if ('isActive' in doc) {
          return {
            _id: args.id,
            routeData: doc.routeData,
            source: 'planned' as const,
            title: doc.title as string,
            vibe: doc.vibe as string,
            city: doc.city as string,
            savedForLater: (doc.savedForLater as boolean) ?? false,
            completedAt: doc.completedAt as number | undefined,
            createdAt: doc.createdAt as number | undefined,
          };
        }
        if ('savedAt' in doc) {
          return {
            _id: args.id,
            routeData: doc.routeData,
            source: 'saved' as const,
            title: doc.title as string,
            vibe: doc.vibe as string,
            city: doc.city as string,
            savedForLater: true,
            completedAt: undefined,
            createdAt: undefined,
          };
        }
        if ('finishedAt' in doc) {
          return {
            _id: args.id,
            routeData: doc.routeData,
            source: 'history' as const,
            title: doc.title as string,
            vibe: doc.vibe as string,
            city: doc.city as string,
            savedForLater: false,
            completedAt: undefined,
            createdAt: undefined,
          };
        }
      }
    } catch {
      // ID doesn't match any table — fall through
    }

    return null;
  },
});
