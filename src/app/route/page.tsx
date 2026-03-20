'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import Navbar from '@/components/layout/Navbar';
import RouteMap from '@/components/route/RouteMap';
import StopCard from '@/components/route/StopCard';
import AlternativesSheet from '@/components/route/AlternativesSheet';
import RouteStats from '@/components/route/RouteStats';
import RouteQualityMeter from '@/components/route/RouteQualityMeter';
import { useRouteEditor } from '@/hooks/useRouteEditor';
import { formatCurrency } from '@/lib/utils';
import { EditIntent } from '@/lib/types';
import {
  popIn,
  staggerContainer,
  fadeUp,
  EASE_SPRING_SNAPPY,
  EASE_SPRING_SOFT,
  EASE_OUT_EXPO,
} from '@/lib/motion';

// ── Quick action config ───────────────────────────────────────────────

interface QuickAction {
  intent: EditIntent | 'save';
  emoji: string;
  label: string;
  hint: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { intent: 'wildcard',      emoji: '🎲', label: 'Wildcard',      hint: 'Add a surprise stop' },
  { intent: 'cheaper',       emoji: '💸', label: 'Make Cheaper',  hint: 'Swap for a budget option' },
  { intent: 'more-fun',      emoji: '🎉', label: 'More Fun',      hint: 'Upgrade to something exciting' },
  { intent: 'more-chill',    emoji: '🌿', label: 'More Chill',    hint: 'Swap for a calmer stop' },
  { intent: 'optimize-order',emoji: '🗺️', label: 'Optimize',     hint: 'Reorder for better flow' },
  { intent: 'shorter',       emoji: '✂️', label: 'Shorter',       hint: 'Remove the longest stop' },
  { intent: 'save',          emoji: '❤️', label: 'Save Route',   hint: 'Save to your collection' },
];

// ── AI loading messages ───────────────────────────────────────────────

const LOADING_MESSAGES: Record<string, string> = {
  wildcard:         'Finding a perfect wildcard stop…',
  cheaper:          'Hunting for budget-friendly options…',
  'more-fun':       'Searching for something more exciting…',
  'more-chill':     'Finding a calmer alternative…',
  'optimize-order': 'Optimizing route order…',
  shorter:          'Trimming the route…',
  'swap-stop':      'Finding a better alternative…',
};

// ── Finish screen ─────────────────────────────────────────────────────

function FinishScreen({
  route,
  completedCount,
  onRate,
  onBuildNew,
  onHistory,
}: {
  route: NonNullable<ReturnType<typeof useRouteEditor>['route']>;
  completedCount: number;
  onRate: (i: number, r: number) => void;
  onBuildNew: () => void;
  onHistory: () => void;
}) {
  const [showShareCard, setShowShareCard] = useState(false);

  return (
    <main className="min-h-dvh">
      <Navbar />
      <div className="max-w-lg mx-auto px-5 py-8 sm:py-12 text-center">

        {/* Trophy with glow */}
        <div className="relative inline-block mb-5">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full bg-rally-500/20 blur-2xl"
          />
          <div className="text-6xl sm:text-7xl animate-bounce-in relative">🎉</div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: EASE_OUT_EXPO }}
          className="text-2xl sm:text-3xl font-bold mb-2"
        >
          Route Complete!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm sm:text-base text-text-secondary mb-6 sm:mb-8"
        >
          You crushed &ldquo;{route.title}&rdquo; — {completedCount}/{route.stops.length} stops completed.
        </motion.p>

        {/* Star ratings */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-2.5 mb-6"
        >
          <motion.h3 variants={fadeUp} custom={0} className="text-base font-semibold mb-3 text-left">
            Rate each stop
          </motion.h3>
          {route.stops.map((stop, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              custom={i + 1}
              className="glass-card p-3.5 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-lg shrink-0">{stop.place.name.slice(0, 1)}</span>
                <span className="text-sm font-medium truncate">{stop.place.name}</span>
              </div>
              <div className="flex gap-0.5 shrink-0">
                {[1, 2, 3, 4, 5].map(star => (
                  <motion.button
                    key={star}
                    onClick={() => onRate(i, star)}
                    whileTap={{ scale: 0.8 }}
                    transition={EASE_SPRING_SNAPPY}
                    className={`text-lg p-0.5 transition-colors ${(stop.rating || 0) >= star ? 'text-yellow-400' : 'text-white/20'}`}
                  >
                    ★
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Share card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="glass-card p-5 mb-6 bg-linear-to-br from-rally-600/20 to-rally-pink/20 border-rally-600/20"
        >
          <div className="text-sm text-rally-400 font-semibold mb-1">RALLY ROUTE</div>
          <h3 className="text-lg font-bold mb-1">{route.title}</h3>
          <p className="text-xs text-text-secondary mb-3">{route.city} · {route.stops.length} stops · {route.vibe}</p>
          <div className="space-y-1.5">
            {route.stops.map((stop, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="w-5 h-5 rounded-full bg-rally-500/30 flex items-center justify-center text-xs font-bold text-rally-300">{i + 1}</span>
                <span className="text-text-secondary truncate">{stop.place.name}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-text-muted">
            <span>rally.app</span>
            <span>Built by Rally ✨</span>
          </div>
        </motion.div>

        <div className="flex flex-col gap-2.5">
          <motion.button
            onClick={() => setShowShareCard(!showShareCard)}
            className="btn-primary w-full"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={EASE_SPRING_SNAPPY}
          >
            📸 Share This Route
          </motion.button>
          <button onClick={onBuildNew} className="btn-secondary w-full">Build Another Route</button>
          <button onClick={onHistory} className="btn-secondary w-full">View History</button>
        </div>

        <motion.div
          whileHover={{ y: -2 }}
          transition={EASE_SPRING_SOFT}
          className="mt-6 glass-card p-4 bg-linear-to-br from-rally-orange/10 to-yellow-500/10 border-rally-orange/10 text-left cursor-default"
        >
          <p className="font-bold text-sm mb-1">⚡ Challenge a Friend</p>
          <p className="text-xs text-text-secondary mb-3">Think your route is unbeatable? Send it to a friend and dare them to generate a better one.</p>
          <button className="btn-secondary text-sm w-full sm:w-auto">Send Challenge</button>
        </motion.div>

        <div className="mobile-nav-spacer" />
      </div>
    </main>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function RoutePage() {
  const router = useRouter();
  const [showFinish, setShowFinish] = useState(false);
  const [finishCount, setFinishCount] = useState(0);
  const [allDoneSparkle, setAllDoneSparkle] = useState(false);

  const editor = useRouteEditor();
  const {
    route, lockedStopIds, activeStopIndex, isEditing, editingIntent, editReason,
    canUndo, canRedo, alternativesForIndex, quality, allRevealed, revealed,
    handleComplete, handleRate, handleReorder, handleDeleteStop, handleToggleLock,
    handleSetActiveStop, handleShowAlternatives, handleSelectAlternative,
    handleRerollAI, handleWildcard, handleMakeCheaper, handleMakeMoreFun,
    handleMakeShorter, handleMakeChill, handleOptimizeOrder,
    handleUndo, handleRedo, clearEditReason,
    handleSave, handleFinish,
  } = editor;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !route) return;

    const oldIndex = route.stops.findIndex(s => s.place.id === active.id);
    const newIndex = route.stops.findIndex(s => s.place.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const preview = arrayMove([...route.stops], oldIndex, newIndex);
    const wouldDisplaceLocked = route.stops.some((stop, i) => {
      if (!lockedStopIds.has(stop.place.id)) return false;
      return preview.findIndex(s => s.place.id === stop.place.id) !== i;
    });

    if (wouldDisplaceLocked) return;
    handleReorder(oldIndex, newIndex);
  }, [route, lockedStopIds, handleReorder]);

  const handleFinishClick = useCallback(async () => {
    const result = await handleFinish();
    setFinishCount(result.completedCount);
    setShowFinish(true);
  }, [handleFinish]);

  const handleQuickAction = useCallback((intent: EditIntent | 'save') => {
    if (intent === 'save') return handleSave();
    const actionMap: Record<EditIntent, () => Promise<void>> = {
      wildcard: handleWildcard,
      cheaper: handleMakeCheaper,
      'more-fun': handleMakeMoreFun,
      'more-chill': handleMakeChill,
      'optimize-order': handleOptimizeOrder,
      shorter: handleMakeShorter,
      'swap-stop': () => Promise.resolve(),
    };
    return actionMap[intent]?.();
  }, [handleSave, handleWildcard, handleMakeCheaper, handleMakeMoreFun, handleMakeChill, handleOptimizeOrder, handleMakeShorter]);

  // ── Empty state ───────────────────────────────────────────────────

  if (!route) {
    return (
      <main className="min-h-dvh">
        <Navbar />
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="flex flex-col items-center justify-center py-24 px-5 text-center"
        >
          <motion.div variants={popIn} className="text-5xl mb-4">🗺️</motion.div>
          <motion.h1 variants={fadeUp} custom={1} className="text-xl font-bold mb-2">
            No route generated yet
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-sm text-text-secondary mb-6">
            Build a route to see it here.
          </motion.p>
          <motion.div variants={fadeUp} custom={3}>
            <motion.button
              onClick={() => router.push('/build')}
              className="btn-primary w-full sm:w-auto"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={EASE_SPRING_SNAPPY}
            >
              Build a Route
            </motion.button>
          </motion.div>
        </motion.div>
        <div className="mobile-nav-spacer" />
      </main>
    );
  }

  // ── Finish screen ─────────────────────────────────────────────────

  if (showFinish) {
    return (
      <FinishScreen
        route={route}
        completedCount={finishCount}
        onRate={handleRate}
        onBuildNew={() => router.push('/build')}
        onHistory={() => router.push('/history')}
      />
    );
  }

  const completedCount = route.stops.filter(s => s.completed).length;
  const loadingMessage = editingIntent ? LOADING_MESSAGES[editingIntent] : '';
  const progressPct = route.stops.length > 0
    ? (completedCount / route.stops.length) * 100
    : 0;

  return (
    <main className="min-h-dvh relative">
      <Navbar />
      <div className="bg-orb w-[400px] h-[400px] bg-rally-600 top-10 -right-20 fixed" />

      <div className="max-w-3xl mx-auto px-4 sm:px-5 py-4 sm:py-6">

        {/* Demo banner */}
        {route.isDemo && (
          <div className="demo-banner mb-4">
            🎭 Demo Mode — Showing sample NYC data. Allow location for real spots near you.
          </div>
        )}

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">{route.title}</h1>
                {route.aiGenerated && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rally-500/20 text-rally-300 border border-rally-500/20 shrink-0">
                    ✦ AI Planned
                  </span>
                )}
              </div>
              <p className="text-text-secondary text-xs sm:text-sm">{route.vibeDescription}</p>
            </div>

            {/* Save/heart button with animation */}
            <motion.button
              onClick={handleSave}
              className="text-2xl shrink-0 p-1 min-w-[40px] flex items-center justify-center"
              title={route.saved ? 'Saved!' : 'Save route'}
              whileTap={{ scale: 0.75 }}
              transition={EASE_SPRING_SNAPPY}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={route.saved ? 'saved' : 'unsaved'}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={EASE_SPRING_SNAPPY}
                >
                  {route.saved ? '❤️' : '🤍'}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="chip active text-xs">{route.vibe}</span>
            <span className="chip text-xs">{formatCurrency(route.totalCost)}</span>
            <span className="chip text-xs">{route.totalTime}</span>
            <span className="chip text-xs">{route.stops.length} stops</span>
          </div>
        </motion.div>

        {/* Quality meter */}
        {quality && (
          <div className="mb-3">
            <RouteQualityMeter quality={quality} />
          </div>
        )}

        {/* Stats bar */}
        <div className="mb-4">
          <RouteStats route={route} />
        </div>

        {/* Map */}
        <div className="relative mb-4">
          <RouteMap
            route={route}
            activeStopIndex={activeStopIndex}
            lockedStopIds={lockedStopIds}
            onStopClick={handleSetActiveStop}
            className="h-[200px] sm:h-[280px] md:h-[320px]"
          />
          <motion.button
            onClick={() => router.push('/map')}
            className="absolute bottom-3 right-3 btn-secondary text-xs py-2 px-3 backdrop-blur-md bg-surface-primary/80"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={EASE_SPRING_SNAPPY}
          >
            🗺️ Full Map
          </motion.button>
        </div>

        {/* AI loading message */}
        <AnimatePresence>
          {isEditing && loadingMessage && (
            <motion.div
              key="loading-msg"
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="overflow-hidden mb-4"
            >
              <div className="flex items-center gap-2.5 glass-card px-4 py-3 text-sm text-text-secondary border-rally-500/15">
                <div className="w-4 h-4 border border-rally-500/50 border-t-rally-500 rounded-full animate-spin shrink-0" />
                <span>{loadingMessage}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit reason banner */}
        <AnimatePresence>
          {editReason && (
            <motion.div
              key="edit-reason"
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="overflow-hidden mb-4"
            >
              <div className="flex items-start justify-between gap-3 glass-card px-4 py-3 border-rally-500/15 bg-rally-500/5">
                <p className="text-xs sm:text-sm text-text-secondary flex-1">
                  <span className="text-rally-400 font-medium">✦ </span>{editReason}
                </p>
                <button
                  onClick={clearEditReason}
                  className="text-white/30 hover:text-white/60 transition-colors text-xs shrink-0 mt-0.5"
                  aria-label="Dismiss"
                >✕</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar */}
        <div className="glass-card p-3.5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Progress</span>
            <span className="text-xs text-text-secondary">{completedCount}/{route.stops.length} done</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-linear-to-r from-rally-500 to-rally-pink rounded-full"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              onAnimationComplete={() => {
                if (progressPct === 100 && route.stops.length > 0) {
                  setAllDoneSparkle(true);
                  setTimeout(() => setAllDoneSparkle(false), 2500);
                }
              }}
            />
          </div>
          {/* All done sparkle */}
          <AnimatePresence>
            {allDoneSparkle && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-xs text-emerald-400 text-center mt-2 font-medium"
              >
                ✨ All stops complete!
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Stop list — wrapped in DnD context */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={route.stops.map(s => s.place.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3 mb-6">
              {route.stops.map((stop, i) => (
                <StopCard
                  key={stop.place.id}
                  stop={stop}
                  index={i}
                  totalStops={route.stops.length}
                  isLocked={lockedStopIds.has(stop.place.id)}
                  isActive={activeStopIndex === i}
                  isEditing={isEditing}
                  isRevealed={revealed.has(i)}
                  onComplete={() => handleComplete(i)}
                  onRerollAI={() => handleRerollAI(i)}
                  onDelete={() => handleDeleteStop(i)}
                  onToggleLock={() => handleToggleLock(i)}
                  onShowAlternatives={() => handleShowAlternatives(i)}
                  onActivate={() => handleSetActiveStop(activeStopIndex === i ? null : i)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Quick actions — show after reveal */}
        <AnimatePresence>
          {allRevealed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
              className="mb-4"
            >
              <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5 px-0.5">
                Smart Edits
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {QUICK_ACTIONS.map(action => {
                  const isActive = editingIntent === action.intent;
                  const isSaved = action.intent === 'save' && route.saved;
                  return (
                    <motion.button
                      key={action.intent}
                      onClick={() => handleQuickAction(action.intent)}
                      disabled={isEditing && action.intent !== 'save'}
                      whileHover={!isEditing ? { scale: 1.04, y: -2 } : {}}
                      whileTap={!isEditing ? { scale: 0.93 } : {}}
                      transition={EASE_SPRING_SNAPPY}
                      className={[
                        'glass-card-hover p-3 sm:p-3.5 text-center flex flex-col items-center gap-1',
                        isActive ? 'ring-1 ring-rally-500/50 bg-rally-500/10' : '',
                        isEditing && !isActive ? 'opacity-40 pointer-events-none' : '',
                      ].join(' ')}
                      title={action.hint}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={isActive ? 'loading' : 'idle'}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="text-xl"
                        >
                          {isActive
                            ? <span className="inline-block animate-spin text-base">⟳</span>
                            : isSaved ? '❤️' : action.emoji}
                        </motion.div>
                      </AnimatePresence>
                      <div className="text-xs font-medium leading-tight">
                        {action.intent === 'save' && route.saved ? 'Saved!' : action.label}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Undo / Redo bar */}
        <AnimatePresence>
          {allRevealed && (canUndo || canRedo) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-6"
            >
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={handleUndo}
                  disabled={!canUndo}
                  whileTap={canUndo ? { scale: 0.93 } : {}}
                  transition={EASE_SPRING_SNAPPY}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-white/5 text-text-secondary disabled:opacity-30 active:bg-white/10 transition-colors min-h-[36px]"
                >
                  ↩ Undo
                </motion.button>
                <motion.button
                  onClick={handleRedo}
                  disabled={!canRedo}
                  whileTap={canRedo ? { scale: 0.93 } : {}}
                  transition={EASE_SPRING_SNAPPY}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-white/5 text-text-secondary disabled:opacity-30 active:bg-white/10 transition-colors min-h-[36px]"
                >
                  ↪ Redo
                </motion.button>
                <span className="text-xs text-text-muted ml-1">Changes are saved automatically</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sticky CTA */}
        {allRevealed && (
          <div className="sticky-bottom-cta md:relative md:p-0 md:bg-transparent md:backdrop-blur-none">
            <div className="flex flex-col gap-2.5 mb-[calc(60px+env(safe-area-inset-bottom,0px))] md:mb-0">
              <motion.button
                onClick={handleFinishClick}
                className="btn-primary py-3.5 text-base w-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={EASE_SPRING_SNAPPY}
              >
                <span>Finish Route</span>
                <span>🏁</span>
              </motion.button>
              <button onClick={() => router.push('/build')} className="btn-secondary py-3 w-full">
                Generate New Route
              </button>
            </div>
          </div>
        )}

        {!allRevealed && <div className="mobile-nav-spacer" />}
      </div>

      {/* Alternatives bottom sheet */}
      <AlternativesSheet
        stopIndex={alternativesForIndex}
        route={route}
        onSelect={handleSelectAlternative}
        onClose={() => handleShowAlternatives(null)}
      />
    </main>
  );
}
