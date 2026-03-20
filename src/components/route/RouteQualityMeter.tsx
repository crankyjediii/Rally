'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { RouteQualityResult } from '@/lib/types';
import { getQualityColor, getQualityBarColor, getWeakestFactor } from '@/lib/route-quality';
import { EASE_SPRING_SNAPPY } from '@/lib/motion';

interface RouteQualityMeterProps {
  quality: RouteQualityResult;
}

export default function RouteQualityMeter({ quality }: RouteQualityMeterProps) {
  const [showTip, setShowTip] = useState(false);
  const [displayScore, setDisplayScore] = useState(quality.score);
  const prevScoreRef = useRef(quality.score);

  const color = getQualityColor(quality.label);
  const barGradient = getQualityBarColor(quality.label);
  const tip = getWeakestFactor(quality.breakdown);

  // Animated score counter
  useEffect(() => {
    const from = prevScoreRef.current;
    prevScoreRef.current = quality.score;
    const controls = animate(from, quality.score, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: v => setDisplayScore(Math.round(v)),
    });
    return controls.stop;
  }, [quality.score]);

  return (
    <div className="flex items-center gap-3 glass-card px-3.5 py-2.5 relative">
      {/* Label — animated swap on change */}
      <AnimatePresence mode="wait">
        <motion.span
          key={quality.label}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.22 }}
          className={`text-xs font-semibold shrink-0 ${color}`}
        >
          {quality.label}
        </motion.span>
      </AnimatePresence>

      {/* Score bar */}
      <div className="flex-1 h-1.5 rounded-full bg-surface-elevated overflow-hidden min-w-0">
        <motion.div
          className={`h-full rounded-full bg-linear-to-r ${barGradient}`}
          initial={{ width: 0 }}
          animate={{ width: `${quality.score}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>

      {/* Score number — counting animation */}
      <span className="text-xs text-text-muted shrink-0 tabular-nums w-5 text-right">
        {displayScore}
      </span>

      {/* Improve hint toggle */}
      <motion.button
        onClick={() => setShowTip(v => !v)}
        whileTap={{ scale: 0.85 }}
        transition={EASE_SPRING_SNAPPY}
        className="shrink-0 text-[10px] text-text-muted hover:text-text-secondary transition-colors"
        aria-label="Show improvement tip"
        title="How to improve"
      >
        {showTip ? '▾' : '▸'}
      </motion.button>

      {/* Tip popover — animated */}
      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-1.5 z-20 glass-card p-3 text-xs text-text-secondary leading-relaxed border-rally-500/10"
          >
            <span className="text-rally-adaptive font-medium">Tip: </span>{tip}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
