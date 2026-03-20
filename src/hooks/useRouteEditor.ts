'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { arrayMove } from '@dnd-kit/sortable';
import {
  GeneratedRoute, Place, ScoredPlace, UserPreferences,
  EditIntent, EditRouteResponse,
} from '@/lib/types';
import {
  getCurrentRoute, setCurrentRoute, getCandidatePool,
  saveRoute as saveRouteLocal, addToHistory, getPreferences,
} from '@/lib/storage';
import { getMockPlaces } from '@/lib/mock-data';
import {
  rerollStop, addWildcardStop, makeCheaper, makeMoreFun,
  makeMoreChill, optimizeOrder, deleteStop, recalcDistances,
} from '@/lib/route-engine';
import { getDistanceBetween, formatDistance, estimateWalkTime } from '@/lib/utils';
import { computeRouteQuality } from '@/lib/route-quality';
import { RouteQualityResult } from '@/lib/types';

// ── Types ─────────────────────────────────────────────────────────────

export interface UseRouteEditorReturn {
  route: GeneratedRoute | null;
  lockedStopIds: Set<string>;
  activeStopIndex: number | null;
  isEditing: boolean;
  editingIntent: EditIntent | null;
  editReason: string;
  canUndo: boolean;
  canRedo: boolean;
  alternativesForIndex: number | null;
  quality: RouteQualityResult | null;
  allRevealed: boolean;
  revealed: Set<number>;
  recoveredFromCloud: boolean;
  saveConfirmation: string;

  handleComplete: (index: number) => void;
  handleRate: (index: number, rating: number) => void;
  handleReorder: (oldIndex: number, newIndex: number) => void;
  handleDeleteStop: (index: number) => void;
  handleToggleLock: (index: number) => void;
  handleSetActiveStop: (index: number | null) => void;
  handleShowAlternatives: (index: number | null) => void;
  handleSelectAlternative: (stopIndex: number, place: Place) => void;

  handleRerollAI: (index: number) => Promise<void>;
  handleWildcard: () => Promise<void>;
  handleMakeCheaper: () => Promise<void>;
  handleMakeMoreFun: () => Promise<void>;
  handleMakeShorter: () => Promise<void>;
  handleMakeChill: () => Promise<void>;
  handleOptimizeOrder: () => Promise<void>;

  handleUndo: () => void;
  handleRedo: () => void;
  clearEditReason: () => void;

  handleSave: () => Promise<void>;
  handleFinish: () => Promise<{ completedCount: number }>;
}

// ── Helpers ───────────────────────────────────────────────────────────

function getAvailablePlaces(route: GeneratedRoute): ScoredPlace[] {
  if (route.isDemo) return getMockPlaces() as ScoredPlace[];
  const pool = getCandidatePool();
  if (pool && pool.places.length > 0) {
    const twoHours = 2 * 60 * 60 * 1000;
    if (Date.now() - pool.fetchedAt < twoHours) return pool.places;
  }
  return [];
}

// ── Hook ──────────────────────────────────────────────────────────────

export function useRouteEditor(): UseRouteEditorReturn {
  const { isSignedIn } = useUser();
  const saveRouteMutation = useMutation(api.savedRoutes.saveRoute);
  const addHistoryMutation = useMutation(api.routeHistory.addHistoryEntry);
  const createOrUpdatePlanned = useMutation(api.plannedRoutes.createOrUpdate);
  const setSavedForLater = useMutation(api.plannedRoutes.setSavedForLater);
  const markPlannedCompleted = useMutation(api.plannedRoutes.markCompleted);

  // Route recovery from Convex for signed-in users
  const activeConvexRoute = useQuery(
    api.plannedRoutes.getActive,
    isSignedIn ? {} : 'skip',
  );

  const [route, setRouteState] = useState<GeneratedRoute | null>(null);
  const [undoStack, setUndoStack] = useState<GeneratedRoute[]>([]);
  const [redoStack, setRedoStack] = useState<GeneratedRoute[]>([]);
  const [lockedStopIds, setLockedStopIds] = useState<Set<string>>(new Set());
  const [activeStopIndex, setActiveStopIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingIntent, setEditingIntent] = useState<EditIntent | null>(null);
  const [editReason, setEditReason] = useState('');
  const [alternativesForIndex, setAlternativesForIndex] = useState<number | null>(null);
  const [allRevealed, setAllRevealed] = useState(false);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [recoveredFromCloud, setRecoveredFromCloud] = useState(false);
  const [saveConfirmation, setSaveConfirmation] = useState('');

  // Debounce timer for Convex sync
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);

  // ── Load route on mount ─────────────────────────────────────────

  useEffect(() => {
    const stored = getCurrentRoute();
    if (stored) {
      setRouteState(stored);
      stored.stops.forEach((_, i) => {
        setTimeout(() => {
          setRevealed(prev => new Set([...prev, i]));
          if (i === stored.stops.length - 1) {
            setTimeout(() => setAllRevealed(true), 400);
          }
        }, 600 + i * 500);
      });
      mountedRef.current = true;
    }
  }, []);

  // ── Route recovery from Convex if localStorage is empty ─────────

  useEffect(() => {
    if (mountedRef.current) return; // already loaded from localStorage
    if (!isSignedIn || activeConvexRoute === undefined) return; // still loading
    if (!activeConvexRoute) return; // no active route on server

    const routeData = activeConvexRoute.routeData as GeneratedRoute;
    if (!routeData || !routeData.stops) return;

    // Only recover if localStorage is truly empty
    const stored = getCurrentRoute();
    if (stored) {
      mountedRef.current = true;
      return;
    }

    setCurrentRoute(routeData);
    setRouteState(routeData);
    setRecoveredFromCloud(true);
    mountedRef.current = true;

    // Animate reveal
    routeData.stops.forEach((_, i) => {
      setTimeout(() => {
        setRevealed(prev => new Set([...prev, i]));
        if (i === routeData.stops.length - 1) {
          setTimeout(() => setAllRevealed(true), 400);
        }
      }, 300 + i * 300);
    });
  }, [isSignedIn, activeConvexRoute]);

  const prefs = route ? getPreferences() : null;
  const quality = route && prefs ? computeRouteQuality(route, prefs) : null;

  // ── Debounced Convex sync ───────────────────────────────────────

  const syncToConvex = useCallback((newRoute: GeneratedRoute) => {
    if (!isSignedIn) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      createOrUpdatePlanned({
        routeId: newRoute.id,
        title: newRoute.title,
        vibe: newRoute.vibe,
        city: newRoute.city ?? '',
        routeData: newRoute,
        isActive: true,
      }).catch(console.error);
    }, 2000);
  }, [isSignedIn, createOrUpdatePlanned]);

  // ── Core mutation applier ──────────────────────────────────────────

  const applyMutation = useCallback((newRoute: GeneratedRoute, reason = '') => {
    setRouteState(prev => {
      if (prev) {
        setUndoStack(stack => [...stack.slice(-19), prev]);
        setRedoStack([]);
      }
      return newRoute;
    });
    setCurrentRoute(newRoute);
    syncToConvex(newRoute);
    if (reason) setEditReason(reason);
  }, [syncToConvex]);

  // ── Synchronous actions ───────────────────────────────────────────

  const handleComplete = useCallback((index: number) => {
    if (!route) return;
    const newStops = [...route.stops];
    newStops[index] = { ...newStops[index], completed: !newStops[index].completed };
    applyMutation({ ...route, stops: newStops });
  }, [route, applyMutation]);

  const handleRate = useCallback((index: number, rating: number) => {
    if (!route) return;
    const newStops = [...route.stops];
    newStops[index] = { ...newStops[index], rating };
    applyMutation({ ...route, stops: newStops });
  }, [route, applyMutation]);

  const handleReorder = useCallback((oldIndex: number, newIndex: number) => {
    if (!route) return;
    const reordered = arrayMove([...route.stops], oldIndex, newIndex);
    const newStops = recalcDistances(reordered);
    const totalCost = newStops.reduce((sum, s) => sum + s.place.estimatedCost, 0);
    const totalMinutes = newStops.reduce((sum, s) => sum + s.place.estimatedMinutes, 0) + (newStops.length - 1) * 8;
    applyMutation({
      ...route,
      stops: newStops,
      totalCost,
      totalTime: `~${Math.round(totalMinutes / 5) * 5} min`,
    });
  }, [route, applyMutation]);

  const handleDeleteStop = useCallback((index: number) => {
    if (!route) return;
    applyMutation(deleteStop(route, index));
  }, [route, applyMutation]);

  const handleToggleLock = useCallback((index: number) => {
    if (!route) return;
    const placeId = route.stops[index]?.place.id;
    if (!placeId) return;
    setLockedStopIds(prev => {
      const next = new Set(prev);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      return next;
    });
  }, [route]);

  const handleSetActiveStop = useCallback((index: number | null) => {
    setActiveStopIndex(index);
  }, []);

  const handleShowAlternatives = useCallback((index: number | null) => {
    setAlternativesForIndex(index);
  }, []);

  const handleSelectAlternative = useCallback((stopIndex: number, place: Place) => {
    if (!route) return;
    const oldStop = route.stops[stopIndex];
    const prevStop = stopIndex > 0 ? route.stops[stopIndex - 1] : null;
    const newStops = [...route.stops];

    const dist = prevStop
      ? getDistanceBetween(prevStop.place.lat, prevStop.place.lng, place.lat, place.lng)
      : 0;

    newStops[stopIndex] = {
      ...oldStop,
      place,
      reason: `A great alternative for this stop.`,
      aiReason: undefined,
      distanceFromPrev: stopIndex === 0 ? 'Start' : formatDistance(dist),
      travelTimeFromPrev: stopIndex === 0 ? '' : estimateWalkTime(dist),
    };

    const totalCost = newStops.reduce((sum, s) => sum + s.place.estimatedCost, 0);
    applyMutation({ ...route, stops: newStops, totalCost }, `Swapped in ${place.name}.`);
    setAlternativesForIndex(null);
  }, [route, applyMutation]);

  const clearEditReason = useCallback(() => setEditReason(''), []);

  // ── Undo / Redo ───────────────────────────────────────────────────

  const handleUndo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev;
      const previous = prev[prev.length - 1];
      setRouteState(current => {
        if (current) setRedoStack(redo => [...redo, current]);
        setCurrentRoute(previous);
        syncToConvex(previous);
        return previous;
      });
      return prev.slice(0, -1);
    });
    setEditReason('');
  }, [syncToConvex]);

  const handleRedo = useCallback(() => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev;
      const future = prev[prev.length - 1];
      setRouteState(current => {
        if (current) setUndoStack(undo => [...undo, current]);
        setCurrentRoute(future);
        syncToConvex(future);
        return future;
      });
      return prev.slice(0, -1);
    });
    setEditReason('');
  }, [syncToConvex]);

  // ── AI action dispatcher ──────────────────────────────────────────

  const callEditRoute = useCallback(async (
    intent: EditIntent,
    targetStopIndex?: number,
  ): Promise<void> => {
    if (!route || isEditing) return;
    setIsEditing(true);
    setEditingIntent(intent);

    try {
      const editPrefs: UserPreferences = getPreferences();
      const pool = getCandidatePool();
      const candidatePool = pool?.places ?? [];

      const res = await fetch('/api/edit-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route,
          intent,
          targetStopIndex,
          lockedStopIds: [...lockedStopIds],
          preferences: editPrefs,
          candidatePool,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: EditRouteResponse = await res.json();

      if (data.route.stops.length > route.stops.length) {
        const newIdx = data.route.stops.length - 1;
        setRevealed(prev => new Set([...prev, newIdx]));
      }

      applyMutation(data.route, data.reason);
    } catch (err) {
      console.error('[useRouteEditor] AI edit failed, falling back:', err);
      const available = getAvailablePlaces(route);
      const fb = getPreferences();
      let fallback: GeneratedRoute = route;

      if (intent === 'wildcard' && available.length > 0) {
        fallback = addWildcardStop(route, available, fb);
        if (fallback.stops.length > route.stops.length) {
          setRevealed(prev => new Set([...prev, fallback.stops.length - 1]));
        }
      } else if (intent === 'cheaper' && available.length > 0) {
        fallback = makeCheaper(route, available, fb);
      } else if (intent === 'more-fun' && available.length > 0) {
        fallback = makeMoreFun(route, available, fb);
      } else if (intent === 'shorter') {
        fallback = deleteStop(route, route.stops.length - 1);
      } else if (intent === 'more-chill' && available.length > 0) {
        fallback = makeMoreChill(route, available, fb, lockedStopIds);
      } else if (intent === 'optimize-order') {
        fallback = optimizeOrder(route, lockedStopIds);
      } else if (intent === 'swap-stop' && targetStopIndex !== undefined && available.length > 0) {
        fallback = rerollStop(route, targetStopIndex, available, fb);
      }

      if (fallback !== route) applyMutation(fallback);
    } finally {
      setIsEditing(false);
      setEditingIntent(null);
    }
  }, [route, isEditing, lockedStopIds, applyMutation]);

  const handleWildcard      = useCallback(() => callEditRoute('wildcard'), [callEditRoute]);
  const handleMakeCheaper   = useCallback(() => callEditRoute('cheaper'), [callEditRoute]);
  const handleMakeMoreFun   = useCallback(() => callEditRoute('more-fun'), [callEditRoute]);
  const handleMakeShorter   = useCallback(() => callEditRoute('shorter'), [callEditRoute]);
  const handleMakeChill     = useCallback(() => callEditRoute('more-chill'), [callEditRoute]);
  const handleOptimizeOrder = useCallback(() => callEditRoute('optimize-order'), [callEditRoute]);
  const handleRerollAI      = useCallback((index: number) => callEditRoute('swap-stop', index), [callEditRoute]);

  // ── Persist ───────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!route) return;
    saveRouteLocal(route);
    const saved = { ...route, saved: true };
    applyMutation(saved);

    if (isSignedIn) {
      // Mark as saved-for-later in planned routes
      setSavedForLater({ routeId: route.id, saved: true }).catch(console.error);

      // Also save to legacy savedRoutes table for backward compat
      await saveRouteMutation({
        routeId: route.id,
        title: route.title,
        vibe: route.vibe,
        city: route.city ?? '',
        totalCost: route.totalCost,
        totalTime: route.totalTime,
        stopCount: route.stops.length,
        savedAt: new Date().toISOString(),
        routeData: { ...saved, savedAt: new Date().toISOString() },
      });

      setSaveConfirmation('Route saved! Find it in your Saved routes.');
      setTimeout(() => setSaveConfirmation(''), 3000);
    }
  }, [route, isSignedIn, saveRouteMutation, applyMutation, setSavedForLater]);

  const handleFinish = useCallback(async () => {
    if (!route) return { completedCount: 0 };
    const completedCount = route.stops.filter(s => s.completed).length;
    addToHistory(route, completedCount);

    if (isSignedIn) {
      // Mark as completed in planned routes
      markPlannedCompleted({ routeId: route.id }).catch(console.error);

      await addHistoryMutation({
        routeId: route.id,
        title: route.title,
        vibe: route.vibe,
        city: route.city ?? '',
        completedStops: completedCount,
        totalStops: route.stops.length,
        finishedAt: new Date().toISOString(),
        routeData: route,
      });
    }

    return { completedCount };
  }, [route, isSignedIn, addHistoryMutation, markPlannedCompleted]);

  return {
    route,
    lockedStopIds,
    activeStopIndex,
    isEditing,
    editingIntent,
    editReason,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    alternativesForIndex,
    quality,
    allRevealed,
    revealed,
    recoveredFromCloud,
    saveConfirmation,

    handleComplete,
    handleRate,
    handleReorder,
    handleDeleteStop,
    handleToggleLock,
    handleSetActiveStop,
    handleShowAlternatives,
    handleSelectAlternative,

    handleRerollAI,
    handleWildcard,
    handleMakeCheaper,
    handleMakeMoreFun,
    handleMakeShorter,
    handleMakeChill,
    handleOptimizeOrder,

    handleUndo,
    handleRedo,
    clearEditReason,

    handleSave,
    handleFinish,
  };
}
