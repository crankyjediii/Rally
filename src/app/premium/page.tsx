'use client';

import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import { PREMIUM_PACKS } from '@/lib/constants';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const FEATURES = [
  { icon: '🎲', name: 'Unlimited Rerolls', free: '3/day', premium: 'Unlimited', },
  { icon: '🔍', name: 'Advanced Filters', free: 'Basic', premium: 'Full Access', },
  { icon: '💎', name: 'Hidden Gems Mode', free: '—', premium: '✓', },
  { icon: '🚫', name: 'No Chains Mode', free: '—', premium: '✓', },
  { icon: '🗳️', name: 'Group Voting', free: '—', premium: '✓', },
  { icon: '💝', name: 'Date Planner', free: 'Basic', premium: 'AI-Enhanced', },
  { icon: '📦', name: 'Weekly Route Drops', free: '—', premium: '✓', },
  { icon: '🎨', name: 'Route Themes', free: '2 themes', premium: 'All themes', },
  { icon: '🏅', name: 'Exclusive Badges', free: '—', premium: '✓', },
  { icon: '📊', name: 'Analytics', free: '—', premium: '✓', },
];

export default function PremiumPage() {
  return (
    <main className="min-h-dvh">
      <Navbar />
      <div className="bg-orb w-[500px] h-[500px] bg-rally-600 -top-40 right-10 fixed" />
      <div className="bg-orb w-[300px] h-[300px] bg-rally-pink bottom-20 -left-20 fixed" />

      <div className="max-w-4xl mx-auto px-5 py-4 sm:py-8">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 sm:mb-16"
        >
          <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">👑</div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 sm:mb-4">
            <span className="gradient-text">Rally Premium</span>
          </h1>
          <p className="text-sm sm:text-lg text-text-secondary max-w-xl mx-auto mb-6 sm:mb-8">
            Unlock the full Rally experience. Better routes, exclusive features, and hidden gems you won&apos;t find anywhere else.
          </p>

          {/* Pricing toggle — stacked on mobile */}
          <div className="inline-flex flex-col sm:flex-row glass-card p-1.5 mb-6 sm:mb-8 w-full sm:w-auto">
            <div className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-gradient-to-r from-rally-500 to-rally-pink text-white font-semibold text-sm sm:text-base text-center">
              $6.99/month
            </div>
            <div className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg text-text-secondary text-sm sm:text-base text-center">
              $49.99/year (save 40%)
            </div>
          </div>

          <div className="px-4 sm:px-0">
            <button className="btn-primary text-base sm:text-lg px-10 py-4 w-full sm:w-auto">
              <span>Start Free Trial</span>
              <span>→</span>
            </button>
            <p className="text-xs text-text-muted mt-3">7-day free trial · Cancel anytime</p>
          </div>
        </motion.div>

        {/* Feature Packs */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.h2 variants={fadeUp} custom={0} className="text-xl sm:text-2xl font-bold mb-1.5 text-center">
            Premium Packs
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-sm sm:text-base text-text-secondary text-center mb-6 sm:mb-8">
            Pick what fits your lifestyle, or get them all.
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-10 sm:mb-16">
            {PREMIUM_PACKS.map((pack, i) => (
              <motion.div key={pack.id} variants={fadeUp} custom={i + 2}
                className={`glass-card-hover p-5 sm:p-6 bg-gradient-to-br ${pack.gradient.replace('from-', 'from-').replace('to-', 'to-')}/10`}
              >
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">{pack.icon}</div>
                <h3 className="text-base sm:text-lg font-bold mb-1">{pack.name}</h3>
                <p className="text-xs sm:text-sm text-text-secondary mb-3 sm:mb-4">{pack.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-3 sm:mb-4">
                  {pack.features.map(f => (
                    <span key={f} className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-white/5 text-text-muted">{f}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-rally-400">{pack.price}</span>
                  <button className="btn-secondary text-xs py-2 px-3">Add to plan</button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Comparison Table — horizontally scrollable on mobile */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.h2 variants={fadeUp} custom={0} className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-center">
            Free vs Premium
          </motion.h2>
          <motion.div variants={fadeUp} custom={1} className="glass-card overflow-hidden -mx-5 sm:mx-0 rounded-none sm:rounded-2xl">
            <div className="overflow-x-auto">
              <div className="min-w-[400px] grid grid-cols-3 gap-0 text-xs sm:text-sm">
                <div className="p-3 sm:p-4 font-semibold border-b border-border-default sticky left-0 bg-surface-card/80 backdrop-blur-sm z-10">Feature</div>
                <div className="p-3 sm:p-4 font-semibold text-center border-b border-border-default">Free</div>
                <div className="p-3 sm:p-4 font-semibold text-center border-b border-border-default text-rally-400">Premium</div>
                {FEATURES.map((f) => (
                  <div key={f.name} className="contents">
                    <div className="p-3 sm:p-4 flex items-center gap-1.5 sm:gap-2 border-b border-border-default sticky left-0 bg-surface-card/80 backdrop-blur-sm z-10">
                      <span className="hidden sm:inline">{f.icon}</span> <span className="truncate">{f.name}</span>
                    </div>
                    <div className="p-3 sm:p-4 text-center text-text-muted border-b border-border-default">{f.free}</div>
                    <div className="p-3 sm:p-4 text-center text-rally-400 border-b border-border-default font-medium">{f.premium}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mt-10 sm:mt-16 px-4 sm:px-0"
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Start your free trial today</h2>
          <button className="btn-primary text-base sm:text-lg px-10 py-4 w-full sm:w-auto">
            <span>Get Premium</span>
            <span>👑</span>
          </button>
          <p className="text-xs text-text-muted mt-3">
            7-day free trial · Cancel anytime · All packs included
          </p>
        </motion.div>
      </div>
      <div className="mobile-nav-spacer" />
    </main>
  );
}
