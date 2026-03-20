'use client';

import { motion } from 'framer-motion';
import type { PremiumPack } from '@/lib/types';
import type { SubscriptionTier } from '@/lib/types';

interface AddOnCardProps {
  pack:        PremiumPack;
  currentTier: SubscriptionTier;
  isSelected:  boolean;
  onToggle:    (packId: string) => void;
  index:       number;
}

export function AddOnCard({ pack, currentTier, isSelected, onToggle, index }: AddOnCardProps) {
  const isBundled = currentTier === 'city-unlimited';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`glass-card p-4 sm:p-5 relative transition-all
        bg-linear-to-br ${pack.gradient}/10
        ${isSelected && !isBundled ? 'ring-1 ring-rally-500/50' : ''}
        ${isBundled ? 'opacity-75' : ''}
      `}
    >
      {/* Bundled badge */}
      {isBundled && (
        <div className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full
          bg-rally-500/20 text-rally-adaptive font-semibold border border-rally-500/20">
          Included ✓
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-xl
          bg-linear-to-br ${pack.gradient} flex items-center justify-center text-lg sm:text-xl`}>
          {pack.icon}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm sm:text-base mb-0.5">{pack.name}</h4>
          <p className="text-xs text-text-secondary mb-2 leading-relaxed">{pack.description}</p>

          {/* Feature chips */}
          <div className="flex flex-wrap gap-1 mb-3">
            {pack.features.slice(0, 3).map((f) => (
              <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-elevated text-text-muted">
                {f}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-rally-adaptive">{pack.price}</span>

            {isBundled ? (
              <span className="text-xs text-rally-adaptive font-medium">✓ In your plan</span>
            ) : (
              <button
                onClick={() => onToggle(pack.id)}
                className={`text-xs py-1.5 px-3 rounded-lg font-semibold transition-all
                  ${isSelected
                    ? 'bg-rally-500/20 text-rally-adaptive border border-rally-500/30'
                    : 'btn-secondary'
                  }`}
              >
                {isSelected ? '✓ Added' : 'Add to plan'}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
