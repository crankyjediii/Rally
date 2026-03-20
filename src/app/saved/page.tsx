'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import Navbar from '@/components/layout/Navbar';
import { AuthPrompt } from '@/components/auth/AuthPrompt';
import { SavedRoute } from '@/lib/types';
import { setCurrentRoute } from '@/lib/storage';
import { categoryEmoji, formatCurrency } from '@/lib/utils';

export default function SavedPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const savedRaw = useQuery(api.savedRoutes.getSavedRoutes);
  const unsaveRouteMutation = useMutation(api.savedRoutes.unsaveRoute);

  // Map Convex docs back to SavedRoute shape for the render JSX
  const routes = useMemo<SavedRoute[]>(() => {
    if (!savedRaw) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return savedRaw.map((doc: any) => doc.routeData as SavedRoute);
  }, [savedRaw]);

  const handleUnsave = async (id: string) => {
    await unsaveRouteMutation({ routeId: id });
  };

  const handleOpen = (route: SavedRoute) => {
    // setCurrentRoute uses localStorage for ephemeral session state — correct here
    setCurrentRoute(route);
    router.push('/route');
  };

  if (!isLoaded) return null;

  // Guest state: show auth prompt
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

  // Loading Convex data
  if (savedRaw === undefined) {
    return (
      <main className="min-h-dvh">
        <Navbar />
        <div className="max-w-2xl mx-auto px-5 py-4 sm:py-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1.5">Saved Routes</h1>
          <p className="text-sm sm:text-base text-text-secondary mb-6 sm:mb-8">Routes you loved, ready for a rematch.</p>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-card p-4 sm:p-5 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
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
      <div className="max-w-2xl mx-auto px-5 py-4 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1.5">Saved Routes</h1>
        <p className="text-sm sm:text-base text-text-secondary mb-6 sm:mb-8">Routes you loved, ready for a rematch.</p>

        {routes.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 sm:p-12 text-center"
          >
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">❤️</div>
            <h2 className="text-lg sm:text-xl font-bold mb-2">No saved routes</h2>
            <p className="text-sm text-text-secondary mb-5 sm:mb-6">Save routes you love and they&apos;ll appear here.</p>
            <button onClick={() => router.push('/build')} className="btn-primary w-full sm:w-auto">
              Build a Route
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {routes.map((route, i) => (
              <motion.div key={route.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card-hover p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-2 sm:mb-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-base sm:text-lg leading-tight">{route.title}</h3>
                    <p className="text-[10px] sm:text-xs text-text-muted mt-0.5">{route.city} · Saved {new Date(route.savedAt).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => handleUnsave(route.id)}
                    className="text-red-400 active:scale-90 text-xl transition-transform shrink-0 p-1 min-w-[36px] min-h-[36px] flex items-center justify-center"
                  >
                    ❤️
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary mb-2.5 sm:mb-3 line-clamp-2">{route.vibeDescription}</p>
                <div className="flex items-center gap-2 mb-2.5 sm:mb-3 overflow-x-auto no-scrollbar">
                  {route.stops.map((stop, j) => (
                    <div key={j} className="flex items-center gap-1 shrink-0 text-sm">
                      <span>{categoryEmoji(stop.place.category)}</span>
                      <span className="text-text-secondary text-xs hidden sm:inline">{stop.place.name}</span>
                      {j < route.stops.length - 1 && <span className="text-text-muted ml-1">→</span>}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-text-muted flex-wrap">
                    <span className="chip text-xs">{route.vibe}</span>
                    <span>{formatCurrency(route.totalCost)}</span>
                    <span>{route.totalTime}</span>
                  </div>
                  <button onClick={() => handleOpen(route)} className="btn-secondary text-xs shrink-0 py-2 px-3">
                    Open Route
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
