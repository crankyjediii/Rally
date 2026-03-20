'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import Navbar from '@/components/layout/Navbar';
import { AuthPrompt } from '@/components/auth/AuthPrompt';
import { categoryEmoji, formatCurrency } from '@/lib/utils';

interface SavedEntry {
  _id: string;
  routeId: string;
  source: 'legacy' | 'planned';
  route: {
    id: string;
    title: string;
    city: string;
    vibe: string;
    vibeDescription?: string;
    totalCost: number;
    totalTime: string;
    savedAt?: string;
    createdAt?: string;
    stops: Array<{ place: { category: string; name: string } }>;
  };
}

export default function SavedPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const savedRaw = useQuery(api.savedRoutes.getSavedRoutes);
  const plannedSaved = useQuery(api.plannedRoutes.listSaved);
  const unsaveRouteMutation = useMutation(api.savedRoutes.unsaveRoute);
  const unsetSavedForLater = useMutation(api.plannedRoutes.setSavedForLater);

  // Merge legacy saved routes and planned routes, dedup by routeId
  const routes = useMemo<SavedEntry[]>(() => {
    const merged: SavedEntry[] = [];
    const seenRouteIds = new Set<string>();

    // Planned routes (newer system) take priority
    if (plannedSaved) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const doc of plannedSaved as any[]) {
        const route = doc.routeData;
        if (!route) continue;
        seenRouteIds.add(doc.routeId);
        merged.push({
          _id: doc._id,
          routeId: doc.routeId,
          source: 'planned',
          route: {
            ...route,
            id: doc.routeId,
          },
        });
      }
    }

    // Legacy saved routes
    if (savedRaw) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const doc of savedRaw as any[]) {
        const route = doc.routeData;
        if (!route || seenRouteIds.has(doc.routeId)) continue;
        seenRouteIds.add(doc.routeId);
        merged.push({
          _id: doc._id,
          routeId: doc.routeId,
          source: 'legacy',
          route,
        });
      }
    }

    return merged;
  }, [savedRaw, plannedSaved]);

  const handleUnsave = async (entry: SavedEntry) => {
    if (entry.source === 'planned') {
      await unsetSavedForLater({ routeId: entry.routeId, saved: false });
    } else {
      await unsaveRouteMutation({ routeId: entry.routeId });
    }
  };

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <main className="min-h-dvh">
        <Navbar />
        <div className="max-w-2xl mx-auto px-5 py-4 sm:py-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1.5">Saved Routes</h1>
          <p className="text-sm sm:text-base text-text-secondary mb-6 sm:mb-8">Routes you loved, ready for a rematch.</p>
          <AuthPrompt
            icon="❤️"
            title="Your Saved Routes"
            description="Sign in to save your favorite routes and access them anywhere, anytime."
          />
        </div>
        <div className="mobile-nav-spacer" />
      </main>
    );
  }

  if (savedRaw === undefined && plannedSaved === undefined) {
    return (
      <main className="min-h-dvh">
        <Navbar />
        <div className="max-w-2xl mx-auto px-5 py-4 sm:py-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1.5">Saved Routes</h1>
          <p className="text-sm sm:text-base text-text-secondary mb-6 sm:mb-8">Routes you loved, ready for a rematch.</p>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-card p-4 sm:p-5 animate-pulse">
                <div className="h-4 bg-surface-elevated rounded w-3/4 mb-2" />
                <div className="h-3 bg-surface-elevated rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
        <div className="mobile-nav-spacer" />
      </main>
    );
  }

  return (
    <main className="min-h-dvh">
      <Navbar />
      <div className="bg-orb w-[300px] h-[300px] bg-rally-blush top-20 -right-20 fixed" />
      <div className="max-w-2xl mx-auto px-5 py-4 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1.5">Saved Routes</h1>
        <p className="text-sm sm:text-base text-text-secondary mb-6 sm:mb-8">Routes you loved, ready for a rematch.</p>

        {routes.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 sm:p-12 text-center"
          >
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">❤️</div>
            <h2 className="text-lg sm:text-xl font-bold mb-2">No saved routes yet</h2>
            <p className="text-sm text-text-secondary mb-5 sm:mb-6">When you find a route you love, tap the heart to save it here for later.</p>
            <button onClick={() => router.push('/build')} className="btn-primary w-full sm:w-auto">
              Build a Route
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {routes.map((entry, i) => (
              <motion.div key={entry._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card-hover p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-2 sm:mb-3">
                  <div className="min-w-0 cursor-pointer flex-1" onClick={() => router.push(`/routes/${entry._id}`)}>
                    <h3 className="font-bold text-base sm:text-lg leading-tight">{entry.route.title}</h3>
                    <p className="text-[10px] sm:text-xs text-text-muted mt-0.5">
                      {entry.route.city}
                      {entry.route.savedAt ? ` · Saved ${new Date(entry.route.savedAt).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <button onClick={() => handleUnsave(entry)}
                    className="text-status-error active:scale-90 text-xl transition-transform shrink-0 p-1 min-w-[36px] min-h-[36px] flex items-center justify-center"
                  >
                    ❤️
                  </button>
                </div>
                {entry.route.vibeDescription && (
                  <p className="text-xs sm:text-sm text-text-secondary mb-2.5 sm:mb-3 line-clamp-2">{entry.route.vibeDescription}</p>
                )}
                <div className="flex items-center gap-2 mb-2.5 sm:mb-3 overflow-x-auto no-scrollbar">
                  {entry.route.stops.map((stop, j) => (
                    <div key={j} className="flex items-center gap-1 shrink-0 text-sm">
                      <span>{categoryEmoji(stop.place.category)}</span>
                      <span className="text-text-secondary text-xs hidden sm:inline">{stop.place.name}</span>
                      {j < entry.route.stops.length - 1 && <span className="text-text-muted ml-1">→</span>}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-text-muted flex-wrap">
                    <span className="chip text-xs">{entry.route.vibe}</span>
                    <span>{formatCurrency(entry.route.totalCost)}</span>
                    <span>{entry.route.totalTime}</span>
                  </div>
                  <button onClick={() => router.push(`/routes/${entry._id}`)} className="btn-secondary text-xs shrink-0 py-2 px-3">
                    View Details
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <div className="mobile-nav-spacer" />
    </main>
  );
}
