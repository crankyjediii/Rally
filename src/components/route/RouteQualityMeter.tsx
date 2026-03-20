'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { RouteQualityResult } from '@/lib/types';
import { getQualityColor, getQualityBarColor, getWeakestFactor } from '@/lib/route-quality';

interface RouteQualityMeterProps {
  quality: RouteQualityResult;
}

export default function RouteQualityMeter({ quality }: RouteQualityMeterProps) {
  const [showTip, setShowTip] = useState(false);
  const color = getQualityColor(quality.label);
  const barGradient = getQualityBarColor(quality.label);
  const tip = getWeakestFactor(quality.breakdown);

  return (
    <div className="flex items-center gap-3 glass-card px-3.5 py-2.5 relative">
      {/* Label */}
      <span className={`text-xs font-semibold shrink-0 ${color}`}>{quality.label}</span>

      {/* Score bar */}
      <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden min-w-0">
        <motion.div
          className={`h-full rounded-full bg-linear-to-r ${barGradient}`}
          initial={{ width: 0 }}
          animate={{ width: `${quality.score}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>

      {/* Score number */}
      <span className="text-xs text-text-muted shrink-0 tabular-nums">{quality.score}</span>

      {/* Improve hint toggle */}
      <button
        onClick={() => setShowTip(v => !v)}
        className="shrink-0 text-[10px] text-text-muted hover:text-text-secondary transition-colors"
        aria-label="Show improvement tip"
        title="How to improve"
      >
        {showTip ? '▾' : '▸'}
      </button>

      {/* Tip popover */}
      {showTip && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-20 glass-card p-3 text-xs text-text-secondary leading-relaxed border-rally-500/10">
          <span className="text-rally-400 font-medium">Tip: </span>{tip}
        </div>
      )}
    </div>
  );
}
