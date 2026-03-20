'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GeneratedRoute, Place, ScoredPlace } from '@/lib/types';
import { getCandidatePool } from '@/lib/storage';
import { categoryEmoji, categoryLabel, formatCurrency } from '@/lib/utils';
import { cardReveal, staggerContainer, popIn, EASE_SPRING_SOFT } from '@/lib/motion';

interface AlternativesSheetProps {
  stopIndex: number | null;
  route: GeneratedRoute;
  onSelect: (stopIndex: number, place: Place) => void;
  onClose: () => void;
}

function getAlternatives(stopIndex: number, route: GeneratedRoute): ScoredPlace[] {
  const pool = getCandidatePool();
  if (!pool || Date.now() - pool.fetchedAt > 2 * 3600 * 1000) return [];

  const target = route.stops[stopIndex];
  if (!target) return [];

  const usedIds = new Set(route.stops.map(s => s.place.id));

  const sameCategory = pool.places
    .filter(p => !usedIds.has(p.id))
    .filter(p => p.category === target.place.category)
    .filter(p => (p as ScoredPlace).outingSuitabilityScore > 0)
    .sort((a, b) => ((b as ScoredPlace).vibeFitScore ?? 0) - ((a as ScoredPlace).vibeFitScore ?? 0))
    .slice(0, 5);

  if (sameCategory.length >= 2) return sameCategory;

  // Widen to any suitable candidates if same-category is sparse
  return pool.places
    .filter(p => !usedIds.has(p.id))
    .filter(p => (p as ScoredPlace).outingSuitabilityScore > 0)
    .sort((a, b) => ((b as ScoredPlace).vibeFitScore ?? 0) - ((a as ScoredPlace).vibeFitScore ?? 0))
    .slice(0, 5);
}

function VibeFitBar({ score }: { score: number }) {
  const pct = Math.round((score / 10) * 100);
  const color = score >= 7 ? 'bg-emerald-400' : score >= 4 ? 'bg-yellow-400' : 'bg-white/20';
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        />
      </div>
      <span className="text-[10px] text-text-muted w-5 text-right">{score.toFixed(0)}</span>
    </div>
  );
}

export default function AlternativesSheet({
  stopIndex,
  route,
  onSelect,
  onClose,
}: AlternativesSheetProps) {
  const alternatives = useMemo(
    () => (stopIndex !== null ? getAlternatives(stopIndex, route) : []),
    [stopIndex, route],
  );

  const targetStop = stopIndex !== null ? route.stops[stopIndex] : null;

  return (
    <AnimatePresence>
      {stopIndex !== null && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={EASE_SPRING_SOFT}
            className="fixed bottom-0 inset-x-0 z-50 max-h-[65vh] flex flex-col rounded-t-2xl bg-surface-primary border-t border-border-default"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            {/* Handle — pulse entrance */}
            <div className="flex justify-center pt-3 pb-2 shrink-0">
              <motion.div
                className="w-10 h-1 rounded-full bg-white/20"
                initial={{ scaleX: 0.4, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 shrink-0">
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <h3 className="font-bold text-base">Alternatives</h3>
                {targetStop && (
                  <p className="text-xs text-text-secondary mt-0.5">
                    Replacing: <span className="text-text-primary font-medium">{targetStop.place.name}</span>
                    {' '}·{' '}
                    <span className="text-text-muted">{formatCurrency(targetStop.place.estimatedCost)}</span>
                  </p>
                )}
              </motion.div>
              <motion.button
                onClick={onClose}
                whileTap={{ scale: 0.85 }}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm active:bg-white/20"
                aria-label="Close alternatives"
              >
                ✕
              </motion.button>
            </div>

            {/* Alternatives list */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
              {alternatives.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  <motion.div
                    variants={popIn}
                    initial="hidden"
                    animate="visible"
                    className="text-3xl mb-2"
                  >
                    🔍
                  </motion.div>
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="inline-block"
                  />
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="text-sm"
                  >
                    No nearby alternatives found
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    transition={{ duration: 0.3, delay: 0.35 }}
                    className="text-xs mt-1"
                  >
                    Try rerolling or building a new route
                  </motion.p>
                </div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-2"
                >
                  {alternatives.map(alt => {
                    const scored = alt as ScoredPlace;
                    const isChain = scored.likelyChain;
                    const vibeFit = scored.vibeFitScore ?? 5;
                    const costDiff = alt.estimatedCost - (targetStop?.place.estimatedCost ?? 0);

                    return (
                      <motion.button
                        key={alt.id}
                        variants={cardReveal}
                        onClick={() => stopIndex !== null && onSelect(stopIndex, alt)}
                        whileTap={{ scale: 0.97 }}
                        className="w-full glass-card-hover p-3.5 text-left flex items-start gap-3"
                      >
                        {/* Emoji */}
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-rally-500/15 to-rally-pink/15 flex items-center justify-center text-lg shrink-0">
                          {categoryEmoji(alt.category)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-semibold text-sm truncate">{alt.name}</div>
                              <div className="text-[11px] text-text-muted mt-0.5">
                                {categoryLabel(alt.category)}
                                {isChain && <span className="ml-1.5 text-amber-400/70">· chain</span>}
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <div className="text-sm font-semibold text-rally-400">
                                {formatCurrency(alt.estimatedCost)}
                              </div>
                              {costDiff !== 0 && (
                                <div className={`text-[10px] font-medium ${costDiff < 0 ? 'text-emerald-400' : 'text-text-muted'}`}>
                                  {costDiff > 0 ? `+${formatCurrency(costDiff)}` : formatCurrency(costDiff)}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Vibe fit */}
                          <div className="mt-1.5">
                            <div className="text-[10px] text-text-muted mb-0.5">Vibe fit</div>
                            <VibeFitBar score={vibeFit} />
                          </div>

                          {/* Tags */}
                          {alt.tags && alt.tags.length > 0 && (
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {alt.tags.slice(0, 3).map(t => (
                                <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-text-muted">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
