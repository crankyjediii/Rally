'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

export default function CheckoutCanceledPage() {
  return (
    <main className="min-h-dvh">
      <Navbar />
      <div className="bg-orb w-[300px] h-[300px] bg-rally-peach top-20 -right-20 fixed" />

      <div className="max-w-md mx-auto px-5 py-12 sm:py-20 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 160, damping: 14 }}
          className="text-5xl sm:text-6xl mb-6"
        >
          👋
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-2xl sm:text-3xl font-black mb-2">No worries</h1>
          <p className="text-sm sm:text-base text-text-secondary mb-1">
            Your plan wasn&apos;t changed. You can upgrade whenever you&apos;re ready.
          </p>
          <p className="text-xs text-text-muted mb-8">
            The free Scout plan is always available, no credit card required.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col sm:flex-row gap-3 w-full"
        >
          <Link href="/premium" className="btn-primary flex-1 text-center py-3">
            Back to Plans
          </Link>
          <Link href="/build" className="btn-secondary flex-1 text-center py-3">
            Keep Exploring
          </Link>
        </motion.div>
      </div>
      <div className="mobile-nav-spacer" />
    </main>
  );
}
