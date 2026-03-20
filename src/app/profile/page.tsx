'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { AuthPrompt } from '@/components/auth/AuthPrompt';
import { ManageBillingCTA } from '@/components/billing/ManageBillingCTA';
import { useSubscription } from '@/hooks/useSubscription';
import { ALL_BADGES } from '@/lib/constants';
import type { SubscriptionTier } from '@/lib/types';

const TIER_LABELS: Record<SubscriptionTier, string> = {
  'scout':          'Scout · Free',
  'main-event':     'Main Event ⭐',
  'city-unlimited': 'City Unlimited 🏙️',
};

const TIER_COLORS: Record<SubscriptionTier, string> = {
  'scout':          'bg-surface-elevated text-text-secondary border-border-default',
  'main-event':     'bg-rally-500/15 text-rally-adaptive border-rally-500/30',
  'city-unlimited': 'bg-rally-pink/15 text-rally-pink border-rally-pink/30',
};

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <main className="min-h-dvh bg-surface-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rally-500/40 border-t-rally-500 rounded-full animate-spin" />
      </main>
    }>
      <ProfilePageInner />
    </Suspense>
  );
}

function ProfilePageInner() {
  const searchParams = useSearchParams();
  const checkoutSuccess = searchParams.get('checkout') === 'success';

  const { isSignedIn, isLoaded } = useUser();
  const convexUser = useQuery(api.users.getCurrentUser);
  const convexBadges = useQuery(api.badges.getBadges);
  const { tier, sub, isLoading: subLoading } = useSubscription();

  // Merge Convex earned badges with the full ALL_BADGES template so unearned
  // badges still render correctly (greyed out).
  const badges = useMemo(() => {
    if (!isSignedIn) return [];
    const earnedMap = new Map(
      (convexBadges ?? []).map((b) => [b.badgeId, b])
    );
    return ALL_BADGES.map((b) => {
      const record = earnedMap.get(b.id);
      return { ...b, earned: record?.earned ?? false, earnedAt: record?.earnedAt };
    });
  }, [convexBadges, isSignedIn]);

  const earned = badges.filter((b) => b.earned);
  const streakCount = convexUser?.streak ?? 0;

  // Show loading skeleton while Clerk initializes
  if (!isLoaded) return null;

  // Guest state: show auth prompt
  if (!isSignedIn) {
    return (
      <main className="min-h-dvh">
        <Navbar />
        <div className="max-w-2xl mx-auto px-5 py-4 sm:py-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1.5">Profile</h1>
          <p className="text-sm sm:text-base text-text-secondary mb-6 sm:mb-8">Your stats, streaks, and badges.</p>
          <AuthPrompt
            icon="👤"
            title="Your Rally Profile"
            description="Sign in to track your routes, streaks, and badges across all your devices."
          />
        </div>
        <div className="mobile-nav-spacer" />
      </main>
    );
  }

  // Wait for Convex user doc to load
  if (convexUser === undefined) return null;

  return (
    <main className="min-h-dvh">
      <Navbar />
      <div className="bg-orb w-[300px] h-[300px] bg-rally-peach top-20 -left-20 fixed" />

      <div className="max-w-2xl mx-auto px-5 py-4 sm:py-8">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 sm:p-6 mb-4 sm:mb-6 text-center bg-gradient-to-br from-rally-600/10 to-rally-pink/10"
        >
          {convexUser?.imageUrl ? (
            <img
              src={convexUser.imageUrl}
              alt={convexUser.name}
              className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-2xl object-cover shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-2xl bg-gradient-to-br from-rally-500 to-rally-pink flex items-center justify-center text-2xl sm:text-3xl shadow-lg">
              👤
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-bold mb-1">{convexUser?.name ?? 'Rally Explorer'}</h1>
          <p className="text-text-secondary text-xs sm:text-sm mb-4">
            {convexUser?.city || ('Explorer since ' + new Date(convexUser?.joinedAt ?? Date.now()).getFullYear())}
          </p>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
            <div className="glass-card p-2.5 sm:p-3">
              <div className="text-xl sm:text-2xl font-bold gradient-text">{convexUser?.routesCompleted ?? 0}</div>
              <div className="text-[10px] sm:text-xs text-text-muted">Routes</div>
            </div>
            <div className="glass-card p-2.5 sm:p-3">
              <div className="text-xl sm:text-2xl font-bold gradient-text">{streakCount}</div>
              <div className="text-[10px] sm:text-xs text-text-muted">Day Streak</div>
            </div>
            <div className="glass-card p-2.5 sm:p-3">
              <div className="text-xl sm:text-2xl font-bold gradient-text">{earned.length}</div>
              <div className="text-[10px] sm:text-xs text-text-muted">Badges</div>
            </div>
          </div>
        </motion.div>

        {/* Checkout success banner */}
        {checkoutSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 mb-4 sm:mb-5
              bg-linear-to-br from-rally-500/15 to-rally-pink/15
              ring-1 ring-rally-500/30 text-center"
          >
            <div className="text-2xl mb-1">🎉</div>
            <p className="font-bold text-sm">Welcome to {TIER_LABELS[tier]}!</p>
            <p className="text-xs text-text-secondary mt-0.5">Your 7-day free trial has started.</p>
          </motion.div>
        )}

        {/* Subscription status card */}
        {!subLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="glass-card p-4 sm:p-5 mb-4 sm:mb-6"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm sm:text-base">✨ Your Plan</h3>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${TIER_COLORS[tier]}`}>
                {TIER_LABELS[tier]}
              </span>
            </div>

            {sub && sub.status !== 'canceled' && (
              <p className="text-xs text-text-secondary mb-3">
                {sub.cancelAtPeriodEnd
                  ? `Cancels ${new Date(sub.currentPeriodEnd * 1000).toLocaleDateString()}`
                  : `Renews ${new Date(sub.currentPeriodEnd * 1000).toLocaleDateString()}`}
              </p>
            )}

            <div className="flex gap-2 flex-wrap">
              {tier !== 'scout' ? (
                <ManageBillingCTA />
              ) : (
                <Link href="/premium" className="btn-primary text-xs py-2 px-4">
                  Upgrade ✨
                </Link>
              )}
            </div>
          </motion.div>
        )}

        {/* Streak */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card p-4 sm:p-5 mb-4 sm:mb-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl sm:text-2xl">🔥</span>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Adventure Streak</h3>
              <p className="text-xs sm:text-sm text-text-secondary">
                {streakCount > 0
                  ? `${streakCount} day${streakCount > 1 ? 's' : ''} strong! Keep it going.`
                  : 'Complete a route today to start your streak!'}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            {[...Array(7)].map((_, i) => (
              <div key={i} className={`flex-1 h-2 rounded-full ${i < streakCount ? 'bg-gradient-to-r from-rally-500 to-rally-pink' : 'bg-surface-elevated'}`} />
            ))}
          </div>
        </motion.div>

        {/* Badges */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">🏅 Badges</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-6 sm:mb-8">
            {badges.map(badge => (
              <div key={badge.id}
                className={`glass-card p-3 sm:p-4 text-center transition-all ${badge.earned ? 'animate-pulse-glow' : 'opacity-40 grayscale'}`}
              >
                <div className="text-xl sm:text-2xl mb-1">{badge.icon}</div>
                <p className="text-[10px] sm:text-xs font-medium truncate">{badge.name}</p>
                {badge.earned && <p className="text-[10px] text-rally-adaptive mt-0.5">Earned!</p>}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Referral */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card p-5 sm:p-6 bg-gradient-to-br from-rally-orange/10 to-yellow-500/10 border-rally-orange/10"
        >
          <h3 className="text-base sm:text-lg font-bold mb-2">📣 Invite Friends</h3>
          <p className="text-xs sm:text-sm text-text-secondary mb-3 sm:mb-4">
            Share your referral code and both get premium features for a week.
          </p>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex-1 glass-card px-3 sm:px-4 py-2.5 font-mono text-xs sm:text-sm text-rally-adaptive truncate">
              {convexUser?.referralCode ?? '—'}
            </div>
            <button
              onClick={() => navigator.clipboard?.writeText(convexUser?.referralCode ?? '')}
              className="btn-secondary text-xs sm:text-sm shrink-0 py-2.5 px-4"
            >
              Copy
            </button>
          </div>
        </motion.div>

        {/* Neighborhoods Mock */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="mt-4 sm:mt-6 glass-card p-4 sm:p-5"
        >
          <h3 className="font-bold text-sm sm:text-base mb-3">🗺️ Neighborhoods Explored</h3>
          <div className="flex flex-wrap gap-2">
            {(convexUser?.routesCompleted ?? 0) > 0 ? (
              <>
                <span className="chip active text-xs">Midtown</span>
                <span className="chip text-xs">East Village</span>
                <span className="chip text-xs">Chelsea</span>
                <span className="chip opacity-40 text-xs">+3 locked</span>
              </>
            ) : (
              <p className="text-xs sm:text-sm text-text-muted">Complete routes to unlock neighborhoods!</p>
            )}
          </div>
        </motion.div>
      </div>
      <div className="mobile-nav-spacer" />
    </main>
  );
}
