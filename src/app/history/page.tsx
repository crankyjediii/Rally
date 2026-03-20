'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import Navbar from '@/components/layout/Navbar';
import { AuthPrompt } from '@/components/auth/AuthPrompt';
import { RouteHistoryItem } from '@/lib/types';
import { categoryEmoji, formatCurrency } from '@/lib/utils';

export default function HistoryPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const historyRaw = useQuery(api.routeHistory.getHistory);

  // Map Convex docs to RouteHistoryItem shape used by the render JSX
  const history = useMemo<RouteHistoryItem[]>(() => {
    if (!historyRaw) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return historyRaw.map((doc: any) => ({
      route: doc.routeData,
      completedStops: doc.completedStops,
      totalStops: doc.totalStops,
      finishedAt: doc.finishedAt,
    }));
  }, [historyRaw]);

  if (!isLoaded) return null;

  // Guest state: show auth prompt
  if (!isSignedIn) {
    return (
      <main className="min-h-dvh">
        <Navbar />
        <div className="max-w-2xl mx-auto px-5 py-4 sm:py-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1.5">Route History</h1>
          <p className="text-sm sm:text-base text-text-secondary mb-6 sm:mb-8">Your past adventures.</p>
          <AuthPrompt
            icon="📋"
            title="Your Route History"
            description="Sign in to see all your past adventures and relive your best outings."
          />
        </div>
        <div className="mobile-nav-spacer" />
      </main>
    );
  }

  // Loading Convex data
  if (historyRaw === undefined) {
    return (
      <main className="min-h-dvh">
        <Navbar />
        <div className="max-w-2xl mx-auto px-5 py-4 sm:py-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1.5">Route History</h1>
          <p className="text-sm sm:text-base text-text-secondary mb-6 sm:mb-8">Your past adventures.</p>
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
        <h1 className="text-2xl sm:text-3xl font-bold mb-1.5">Route History</h1>
        <p className="text-sm sm:text-base text-text-secondary mb-6 sm:mb-8">Your past adventures.</p>

        {history.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 sm:p-12 text-center"
          >
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🕐</div>
            <h2 className="text-lg sm:text-xl font-bold mb-2">No routes yet</h2>
            <p className="text-sm text-text-secondary mb-5 sm:mb-6">Your completed routes will show up here.</p>
            <button onClick={() => router.push('/build')} className="btn-primary w-full sm:w-auto">
              Build Your First Route
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {history.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card-hover p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-2.5 sm:mb-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-base sm:text-lg leading-tight">{item.route.title}</h3>
                    <p className="text-[10px] sm:text-xs text-text-muted mt-0.5">{item.route.city} · {new Date(item.finishedAt || item.route.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="chip text-xs shrink-0">{item.route.vibe}</span>
                </div>
                <div className="flex items-center gap-2 mb-2.5 sm:mb-3 flex-wrap">
                  {item.route.stops.map((stop, j) => (
                    <span key={j} className="text-base sm:text-lg">{categoryEmoji(stop.place.category)}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 sm:gap-3 text-[10px] sm:text-xs text-text-muted">
                    <span>{item.completedStops}/{item.totalStops} completed</span>
                    <span>{formatCurrency(item.route.totalCost)}</span>
                    <span>{item.route.totalTime}</span>
                  </div>
                  <div className="h-1.5 w-16 sm:w-20 bg-white/5 rounded-full overflow-hidden shrink-0">
                    <div className="h-full bg-gradient-to-r from-rally-500 to-rally-pink rounded-full"
                      style={{ width: `${(item.completedStops / item.totalStops) * 100}%` }}
                    />
                  </div>
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
