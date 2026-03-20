'use client';

import { motion } from 'framer-motion';
import type { SubscriptionTier } from '@/lib/types';
import { TIER_DISPLAY, TIER_FEATURES } from '@/lib/entitlements';

interface PricingCardProps {
  tier:          SubscriptionTier;
  period:        'monthly' | 'yearly';
  currentTier:   SubscriptionTier;
  priceId:       string;
  isLoading:     boolean;
  onCheckout:    (priceId: string) => void;
  onManageBilling: () => void;
  index:         number;
}

export function PricingCard({
  tier, period, currentTier, priceId, isLoading, onCheckout, onManageBilling, index
}: PricingCardProps) {
  const display  = TIER_DISPLAY[tier];
  const features = TIER_FEATURES[tier];
  const isCurrent   = tier === currentTier;
  const isFreeTier  = tier === 'scout';
  const isDowngrade = !isFreeTier && currentTier === 'city-unlimited' && tier === 'main-event';
  const isHighlighted = tier === 'main-event';
  const price = display.price[period];

  function handleCTA() {
    if (isCurrent || isFreeTier) return;
    if (isDowngrade || currentTier !== 'scout') {
      onManageBilling();
    } else {
      onCheckout(priceId);
    }
  }

  const ctaLabel = (() => {
    if (isFreeTier)    return 'Your current plan';
    if (isCurrent)     return 'Current plan ✓';
    if (isDowngrade)   return 'Manage billing';
    if (currentTier !== 'scout') return 'Manage billing';
    return 'Start free trial →';
  })();

  const ctaDisabled = isFreeTier || isCurrent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`glass-card flex flex-col p-5 sm:p-6 relative
        ${isHighlighted ? `ring-1 ${display.ring}` : ''}
        ${isCurrent && !isFreeTier ? 'ring-1 ring-rally-500/50' : ''}
      `}
    >
      {/* Popular badge */}
      {isHighlighted && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full
          bg-linear-to-r from-rally-500 to-rally-pink text-white text-[10px] font-bold tracking-wide uppercase">
          Most Popular
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{display.emoji}</span>
          <h3 className={`text-base sm:text-lg font-bold ${display.color}`}>{display.name}</h3>
          {isCurrent && !isFreeTier && (
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full
              bg-rally-500/20 text-rally-adaptive font-semibold border border-rally-500/30">
              Active
            </span>
          )}
        </div>
        <p className="text-xs text-text-secondary">{display.description}</p>
      </div>

      {/* Price */}
      <div className="mb-5">
        {isFreeTier ? (
          <div className="text-2xl sm:text-3xl font-black">Free</div>
        ) : (
          <>
            <div className="flex items-end gap-1">
              <span className={`text-2xl sm:text-3xl font-black ${display.color}`}>{price}</span>
              {period === 'monthly' ? (
                <span className="text-xs text-text-muted mb-1">/month</span>
              ) : (
                <span className="text-xs text-text-muted mb-1">/year</span>
              )}
            </div>
            {period === 'yearly' && (
              <div className="text-[10px] text-status-success font-semibold mt-0.5">
                ≈ {tier === 'main-event' ? '$5.00' : '$10.00'}/mo · Save up to 37%
              </div>
            )}
          </>
        )}
      </div>

      {/* Feature list */}
      <ul className="flex-1 space-y-2 mb-6">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs sm:text-sm">
            <span className={`mt-0.5 shrink-0 ${isFreeTier ? 'text-text-muted' : 'text-rally-adaptive'}`}>
              {isFreeTier ? '·' : '✓'}
            </span>
            <span className={isFreeTier ? 'text-text-muted' : 'text-text-primary'}>{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={handleCTA}
        disabled={ctaDisabled || isLoading}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition-all
          ${ctaDisabled
            ? 'bg-surface-elevated text-text-muted cursor-default'
            : isHighlighted
              ? 'btn-primary'
              : 'btn-secondary'
          }
          disabled:opacity-60`}
      >
        {isLoading && !ctaDisabled ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Redirecting…
          </span>
        ) : ctaLabel}
      </button>

      {!isFreeTier && !isCurrent && (
        <p className="text-center text-[10px] text-text-muted mt-2">
          7-day free trial · Cancel anytime
        </p>
      )}
    </motion.div>
  );
}
