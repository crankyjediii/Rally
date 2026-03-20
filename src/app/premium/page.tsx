'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { PricingCard } from '@/components/billing/PricingCard';
import { AddOnCard } from '@/components/billing/AddOnCard';
import { ManageBillingCTA } from '@/components/billing/ManageBillingCTA';
import { useSubscription } from '@/hooks/useSubscription';
import { PREMIUM_PACKS, ADDON_PRICE_IDS, SUBSCRIPTION_PRICE_IDS } from '@/lib/constants';
import type { SubscriptionTier } from '@/lib/types';

type BillingPeriod = 'monthly' | 'yearly';

// Feature comparison rows: [feature, scout, main-event, city-unlimited]
const COMPARISON = [
  { icon: '🎲', name: 'AI Rerolls',          scout: '3/day',      main: 'Unlimited',   city: 'Unlimited'   },
  { icon: '🔍', name: 'Advanced Filters',     scout: 'Basic',      main: 'Full access', city: 'Full access' },
  { icon: '🚫', name: 'No-Chains Mode',       scout: '—',          main: '✓',           city: '✓'           },
  { icon: '💎', name: 'Hidden Gems',          scout: '—',          main: 'Add-on',      city: 'Included'    },
  { icon: '💝', name: 'Date Planner Pro',     scout: '—',          main: 'Add-on',      city: 'Included'    },
  { icon: '🗳️', name: 'Group Voting',         scout: '—',          main: 'Add-on',      city: 'Included'    },
  { icon: '📦', name: 'Weekly Route Drops',   scout: '—',          main: 'Add-on',      city: 'Included'    },
  { icon: '🎨', name: 'Route Themes',         scout: '2 themes',   main: 'All themes',  city: 'All themes'  },
  { icon: '🏅', name: 'Exclusive Badges',     scout: '—',          main: '✓',           city: '✓'           },
  { icon: '📊', name: 'Analytics',            scout: '—',          main: '✓',           city: '✓'           },
  { icon: '💾', name: 'Saved Routes',         scout: 'Up to 5',    main: 'Unlimited',   city: 'Unlimited'   },
  { icon: '🚀', name: 'Early Access',         scout: '—',          main: '—',           city: '✓'           },
];

const FAQS = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes — cancel from your billing portal with one click. Your access continues until the end of the billing period.',
  },
  {
    q: 'What happens to my data if I downgrade?',
    a: 'Your routes and history are always yours. Feature access gates, but nothing is deleted.',
  },
  {
    q: 'Are add-ons available on Scout (free)?',
    a: 'Add-ons require at least a Main Event plan. City Unlimited bundles all four add-ons at no extra cost.',
  },
  {
    q: 'Do add-ons work on any plan?',
    a: 'Add-ons can be purchased on top of any paid plan. Each one adds specific features to your account.',
  },
];

export default function PremiumPage() {
  const [period, setPeriod]       = useState<BillingPeriod>('monthly');
  const [cart, setCart]           = useState<Set<string>>(new Set());
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [openFaq, setOpenFaq]     = useState<number | null>(null);

  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const { tier: currentTier, isLoading: subLoading } = useSubscription();

  function toggleAddOn(packId: string) {
    setCart((prev) => {
      const next = new Set(prev);
      if (next.has(packId)) {
        next.delete(packId);
      } else {
        next.add(packId);
      }
      return next;
    });
  }

  async function handleCheckout(basePriceId: string) {
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    setLoadingPriceId(basePriceId);
    try {
      const addOnPriceIds = [...cart]
        .map((id) => ADDON_PRICE_IDS[id])
        .filter(Boolean);

      const res = await fetch('/api/stripe/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ priceId: basePriceId, addOnPriceIds }),
      });

      if (!res.ok) {
        console.error('Checkout failed:', await res.text());
        return;
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setLoadingPriceId(null);
    }
  }

  function handleManageBilling() {
    // ManageBillingCTA component handles this internally
  }

  // Cart total for display
  const ADDON_PRICES: Record<string, number> = {
    'date-planner': 4.99,
    'hidden-gems':  3.99,
    'group-mode':   5.99,
    'weekly-drops': 2.99,
  };

  const tierPrices: Record<Exclude<SubscriptionTier, 'scout'>, { monthly: number; yearly: number }> = {
    'main-event':    { monthly: 7.99,  yearly: 59.99  },
    'city-unlimited':{ monthly: 14.99, yearly: 119.99 },
  };

  return (
    <main className="min-h-dvh">
      <Navbar />
      <div className="bg-orb w-[500px] h-[500px] bg-rally-lavender -top-40 right-10 fixed" />
      <div className="bg-orb w-[300px] h-[300px] bg-rally-blush bottom-20 -left-20 fixed" />

      <div className="max-w-5xl mx-auto px-5 py-4 sm:py-8">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="text-4xl sm:text-5xl mb-3">✨</div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 sm:mb-4">
            <span className="gradient-text">Level Up Your Rally</span>
          </h1>
          <p className="text-sm sm:text-lg text-text-secondary max-w-xl mx-auto mb-6 sm:mb-8">
            Smarter routes. Better nights. Zero guesswork.
          </p>

          {/* Monthly / Yearly toggle */}
          <div className="inline-flex glass-card p-1 gap-1 mb-1">
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all
                ${period === 'monthly'
                  ? 'bg-linear-to-r from-rally-500 to-rally-pink text-white'
                  : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setPeriod('yearly')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2
                ${period === 'yearly'
                  ? 'bg-linear-to-r from-rally-500 to-rally-pink text-white'
                  : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              Yearly
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold
                ${period === 'yearly' ? 'bg-white/20' : 'bg-rally-sage/30 text-status-success'}`}>
                Save 37%
              </span>
            </button>
          </div>
        </motion.div>

        {/* ── Tier Cards ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-10 sm:mb-14">
          {(['scout', 'main-event', 'city-unlimited'] as SubscriptionTier[]).map((t, i) => {
            const priceIds = t === 'scout' ? { monthly: '', yearly: '' } : SUBSCRIPTION_PRICE_IDS[t as Exclude<SubscriptionTier,'scout'>];
            const priceId = priceIds[period];
            return (
              <PricingCard
                key={t}
                tier={t}
                period={period}
                currentTier={subLoading ? 'scout' : currentTier}
                priceId={priceId}
                isLoading={loadingPriceId === priceId}
                onCheckout={handleCheckout}
                onManageBilling={handleManageBilling}
                index={i}
              />
            );
          })}
        </div>

        {/* ── Add-on Packs ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 sm:mb-14"
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-1.5 text-center">🎒 Add-On Packs</h2>
          <p className="text-sm text-text-secondary text-center mb-6">
            {currentTier === 'city-unlimited'
              ? 'All add-ons are included in your City Unlimited plan.'
              : 'Enhance any paid plan with focused feature packs.'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {PREMIUM_PACKS.map((pack, i) => (
              <AddOnCard
                key={pack.id}
                pack={pack}
                currentTier={currentTier}
                isSelected={cart.has(pack.id)}
                onToggle={toggleAddOn}
                index={i}
              />
            ))}
          </div>
        </motion.div>

        {/* ── Cart Summary ─────────────────────────────────────────── */}
        <AnimatePresence>
          {cart.size > 0 && currentTier === 'scout' && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              className="glass-card p-4 sm:p-5 mb-8 sm:mb-10
                bg-linear-to-br from-rally-500/10 to-rally-pink/10
                ring-1 ring-rally-500/30"
            >
              <h3 className="font-bold text-sm sm:text-base mb-3">🛒 Your Selection</h3>

              {/* Base plan line */}
              <div className="flex items-center justify-between text-sm mb-1.5 text-text-secondary">
                <span>Main Event (with add-ons)</span>
                <span>${period === 'monthly' ? '7.99' : '59.99'}/{period === 'monthly' ? 'mo' : 'yr'}</span>
              </div>

              {/* Add-on lines */}
              {[...cart].map((packId) => {
                const pack = PREMIUM_PACKS.find((p) => p.id === packId);
                if (!pack) return null;
                return (
                  <div key={packId} className="flex items-center justify-between text-xs text-text-secondary mb-1">
                    <span>+ {pack.name}</span>
                    <span>${ADDON_PRICES[packId]?.toFixed(2)}/mo</span>
                  </div>
                );
              })}

              <div className="border-t border-border-default mt-3 pt-3 flex items-center justify-between">
                <span className="text-sm font-bold">Total</span>
                <span className="text-sm font-bold text-rally-adaptive">
                  ${(
                    (period === 'monthly' ? tierPrices['main-event'].monthly : tierPrices['main-event'].yearly) +
                    [...cart].reduce((sum, id) => sum + (ADDON_PRICES[id] ?? 0), 0)
                  ).toFixed(2)}/{period === 'monthly' ? 'mo' : 'yr'}
                </span>
              </div>

              <button
                onClick={() => handleCheckout(SUBSCRIPTION_PRICE_IDS['main-event'][period])}
                disabled={loadingPriceId !== null}
                className="btn-primary w-full mt-4 py-3 text-sm"
              >
                {loadingPriceId ? 'Redirecting…' : 'Continue to checkout →'}
              </button>
              <p className="text-center text-[10px] text-text-muted mt-2">
                7-day free trial · Cancel anytime
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Comparison Table ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 sm:mb-14"
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-center">Compare Plans</h2>
          <div className="glass-card overflow-hidden -mx-5 sm:mx-0 rounded-none sm:rounded-2xl">
            <div className="overflow-x-auto">
              <div className="min-w-[460px] text-xs sm:text-sm">
                {/* Header row */}
                <div className="grid grid-cols-4 gap-0 border-b border-border-default">
                  <div className="p-3 sm:p-4 font-semibold sticky left-0 bg-surface-card/90 backdrop-blur-sm z-10">
                    Feature
                  </div>
                  <div className="p-3 sm:p-4 font-semibold text-center text-text-secondary">Scout</div>
                  <div className="p-3 sm:p-4 font-semibold text-center text-rally-adaptive">Main Event</div>
                  <div className="p-3 sm:p-4 font-semibold text-center text-rally-pink">City Unlimited</div>
                </div>

                {/* Feature rows */}
                {COMPARISON.map((row) => (
                  <div key={row.name} className="grid grid-cols-4 gap-0 border-b border-border-default last:border-0">
                    <div className="p-3 sm:p-4 flex items-center gap-1.5 sticky left-0 bg-surface-card/90 backdrop-blur-sm z-10">
                      <span className="hidden sm:inline">{row.icon}</span>
                      <span className="truncate">{row.name}</span>
                    </div>
                    <div className="p-3 sm:p-4 text-center text-text-muted">{row.scout}</div>
                    <div className={`p-3 sm:p-4 text-center font-medium
                      ${row.main === '✓' || row.main === 'Unlimited' || row.main === 'Full access'
                        ? 'text-rally-adaptive' : 'text-text-secondary'}`}>
                      {row.main}
                    </div>
                    <div className={`p-3 sm:p-4 text-center font-medium
                      ${row.city === '✓' || row.city === 'Unlimited' || row.city === 'Full access' || row.city === 'Included'
                        ? 'text-rally-pink' : 'text-text-secondary'}`}>
                      {row.city}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── FAQ ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 sm:mb-14"
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-5 text-center">Questions</h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="glass-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left"
                >
                  <span className="font-semibold text-sm sm:text-base">{faq.q}</span>
                  <span className={`text-text-muted transition-transform duration-200 shrink-0 ml-4
                    ${openFaq === i ? 'rotate-180' : ''}`}>▾</span>
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="px-4 sm:px-5 pb-4 text-sm text-text-secondary">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Bottom CTA ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center px-4 sm:px-0 pb-4"
        >
          {currentTier !== 'scout' ? (
            <>
              <h2 className="text-xl sm:text-2xl font-bold mb-3">You&apos;re on {currentTier === 'main-event' ? 'Main Event' : 'City Unlimited'} ✨</h2>
              <p className="text-sm text-text-secondary mb-5">Manage your plan, add-ons, or billing info anytime.</p>
              <ManageBillingCTA label="Manage billing →" className="text-base py-3 px-8" />
            </>
          ) : (
            <>
              <h2 className="text-xl sm:text-2xl font-bold mb-3">Ready to go all in?</h2>
              <p className="text-sm text-text-secondary mb-5">7-day free trial · Cancel anytime · No hidden fees</p>
              <button
                onClick={() => handleCheckout(SUBSCRIPTION_PRICE_IDS['main-event'][period])}
                disabled={loadingPriceId !== null}
                className="btn-primary text-base sm:text-lg px-10 py-4 w-full sm:w-auto"
              >
                <span>{loadingPriceId ? 'Redirecting…' : 'Start free trial'}</span>
                <span>→</span>
              </button>
              <div className="mt-3">
                <Link href="/build" className="text-xs text-text-muted hover:text-text-secondary transition-colors">
                  or keep exploring for free
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
      <div className="mobile-nav-spacer" />
    </main>
  );
}
