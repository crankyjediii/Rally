'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { useSubscription } from '@/hooks/useSubscription';
import { TIER_DISPLAY } from '@/lib/entitlements';

const TIER_NAMES = {
  scout:           'Scout',
  'main-event':    'Main Event',
  'city-unlimited':'City Unlimited',
};

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const { tier, isLoading } = useSubscription();
  const [countdown, setCountdown] = useState(8);

  // Auto-redirect to profile after countdown
  useEffect(() => {
    if (countdown <= 0) {
      router.push('/profile?checkout=success');
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, router]);

  const tierDisplay = TIER_DISPLAY[tier];
  const tierName    = isLoading ? '…' : TIER_NAMES[tier];

  return (
    <main className="min-h-dvh">
      <Navbar />
      <div className="bg-orb w-[400px] h-[400px] bg-rally-lavender top-0 left-1/2 -translate-x-1/2 fixed" />

      <div className="max-w-md mx-auto px-5 py-12 sm:py-20 flex flex-col items-center text-center">
        {/* Animated check */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full
            bg-linear-to-br from-rally-500 to-rally-pink
            flex items-center justify-center text-4xl sm:text-5xl mb-6 shadow-lg"
        >
          ✓
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h1 className="text-2xl sm:text-3xl font-black mb-2">
            Welcome to{' '}
            <span className={`${tierDisplay.color}`}>{tierName}</span>!
          </h1>
          <p className="text-sm sm:text-base text-text-secondary mb-2">
            Your 7-day free trial has started. No charge until the trial ends.
          </p>
          <p className="text-xs text-text-muted mb-8">
            Redirecting to your profile in {countdown}s…
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 w-full"
        >
          <Link href="/build" className="btn-primary flex-1 text-center py-3">
            Start Building →
          </Link>
          <Link
            href="/profile?checkout=success"
            className="btn-secondary flex-1 text-center py-3"
          >
            View Your Plan
          </Link>
        </motion.div>
      </div>
      <div className="mobile-nav-spacer" />
    </main>
  );
}
