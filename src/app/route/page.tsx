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
  wildcard:       'Finding a perfect wildcard stop…',
  cheaper:        'Hunting for budget-friendly options…',
  'more-fun':     'Searching for something more exciting…',
  'more-chill':   'Finding a calmer alternative…',
  'optimize-order': 'Optimizing route order…',
  shorter:        'Trimming the route…',
  'swap-stop':    'Finding a better alternative…',
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
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
          className="text-6xl sm:text-7xl mb-5"
        >🎉</motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="text-2xl sm:text-3xl font-bold mb-2"
        >
          Route Complete!
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-sm sm:text-base text-text-secondary mb-6 sm:mb-8"
        >
          You crushed &ldquo;{route.title}&rdquo; — {completedCount}/{route.stops.length} stops completed.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="space-y-2.5 mb-6"
        >
          <h3 className="text-base font-semibold mb-3 text-left">Rate each stop</h3>
          {route.stops.map((stop, i) => (
            <div key={i} className="glass-card p-3.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-lg shrink-0">{stop.place.name.slice(0, 1)}</span>
                <span className="text-sm font-medium truncate">{stop.place.name}</span>
              </div>
              <div className="flex gap-0.5 shrink-0">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => onRate(i, star)}
                    className={`text-lg p-0.5 transition-colors ${(stop.rating || 0) >= star ? 'text-yellow-400' : 'text-white/20'}`}
                  >★</button>
                ))}
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
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
          <button onClick={() => setShowShareCard(!showShareCard)} className="btn-primary w-full">
            📸 Share This Route
          </button>
          <button onClick={onBuildNew} className="btn-secondary w-full">Build Another Route</button>
          <button onClick={onHistory} className="btn-secondary w-full">View History</button>
        </div>

        <div className="mt-6 glass-card p-4 bg-linear-to-br from-rally-orange/10 to-yellow-500/10 border-rally-orange/10 text-left">
          <p className="font-bold text-sm mb-1">⚡ Challenge a Friend</p>
          <p className="text-xs text-text-secondary mb-3">Think your route is unbeatable? Send it to a friend and dare them to generate a better one.</p>
          <button className="btn-secondary text-sm w-full sm:w-auto">Send Challenge</button>
        </div>

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

  // DnD sensors — 8px activation prevents accidental drags on tap
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

    // Reject if any locked stop would be displaced from its position
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
        <div className="flex flex-col items-center justify-center py-24 px-5 text-center">
          <div className="text-5xl mb-4">🗺️</div>
          <h1 className="text-xl font-bold mb-2">No route generated yet</h1>
          <p className="text-sm text-text-secondary mb-6">Build a route to see it here.</p>
          <button onClick={() => router.push('/build')} className="btn-primary w-full sm:w-auto">
            Build a Route
          </button>
        </div>
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
            <button onClick={handleSave} className="text-2xl transition-transform active:scale-90 shrink-0 p-1" title={route.saved ? 'Saved!' : 'Save route'}>
              {route.saved ? '❤️' : '🤍'}
            </button>
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
          <button
            onClick={() => router.push('/map')}
            className="absolute bottom-3 right-3 btn-secondary text-xs py-2 px-3 backdrop-blur-md bg-surface-primary/80"
          >
            🗺️ Full Map
          </button>
        </div>

        {/* AI loading message */}
        <AnimatePresence>
          {isEditing && loadingMessage && (
            <motion.div
              key="loading-msg"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 glass-card px-4 py-3 mb-4 text-sm text-text-secondary"
            >
              <div className="w-4 h-4 border border-rally-500/50 border-t-rally-500 rounded-full animate-spin shrink-0" />
              <span>{loadingMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit reason banner */}
        <AnimatePresence>
          {editReason && (
            <motion.div
              key="edit-reason"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start justify-between gap-3 glass-card px-4 py-3 mb-4 border-rally-500/15 bg-rally-500/5"
            >
              <p className="text-xs sm:text-sm text-text-secondary flex-1">
                <span className="text-rally-400 font-medium">✦ </span>{editReason}
              </p>
              <button
                onClick={clearEditReason}
                className="text-white/30 hover:text-white/60 transition-colors text-xs shrink-0 mt-0.5"
                aria-label="Dismiss"
              >✕</button>
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
              animate={{ width: `${(completedCount / route.stops.length) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
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
        {allRevealed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
                  <button
                    key={action.intent}
                    onClick={() => handleQuickAction(action.intent)}
                    disabled={isEditing && action.intent !== 'save'}
                    className={[
                      'glass-card-hover p-3 sm:p-3.5 text-center flex flex-col items-center gap-1 transition-all',
                      isActive ? 'ring-1 ring-rally-500/50 bg-rally-500/10' : '',
                      isEditing && !isActive ? 'opacity-40 pointer-events-none' : '',
                    ].join(' ')}
                    title={action.hint}
                  >
                    <div className="text-xl relative">
                      {isActive
                        ? <span className="inline-block animate-spin text-base">⟳</span>
                        : isSaved ? '❤️' : action.emoji}
                    </div>
                    <div className="text-xs font-medium leading-tight">
                      {action.intent === 'save' && route.saved ? 'Saved!' : action.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Undo / Redo bar */}
        {allRevealed && (canUndo || canRedo) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 mb-6"
          >
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-white/5 text-text-secondary disabled:opacity-30 active:bg-white/10 transition-colors min-h-[36px]"
            >
              ↩ Undo
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-white/5 text-text-secondary disabled:opacity-30 active:bg-white/10 transition-colors min-h-[36px]"
            >
              ↪ Redo
            </button>
            <span className="text-xs text-text-muted ml-1">Changes are saved automatically</span>
          </motion.div>
        )}

        {/* Sticky CTA */}
        {allRevealed && (
          <div className="sticky-bottom-cta md:relative md:p-0 md:bg-transparent md:backdrop-blur-none">
            <div className="flex flex-col gap-2.5 mb-[calc(60px+env(safe-area-inset-bottom,0px))] md:mb-0">
              <button onClick={handleFinishClick} className="btn-primary py-3.5 text-base w-full">
                <span>Finish Route</span>
                <span>🏁</span>
              </button>
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
