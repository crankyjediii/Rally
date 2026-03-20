'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import RouteMap from '@/components/route/RouteMap';
import { setCurrentRoute } from '@/lib/storage';
import { GeneratedRoute } from '@/lib/types';
import { categoryEmoji, categoryLabel } from '@/lib/utils';

export default function RouteDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const details = useQuery(api.routes.getRouteDetails, { id });
  const setSaved = useMutation(api.plannedRoutes.setSavedForLater);
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'done'>('idle');

  // Loading state
  if (details === undefined) {
    return (
      <main className="min-h-dvh bg-surface-primary">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-32">
          <div className="space-y-4">
            <div className="h-8 w-48 skeleton rounded-lg" />
            <div className="h-4 w-32 skeleton rounded-lg" />
            <div className="h-64 skeleton rounded-2xl" />
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card p-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 skeleton rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 skeleton rounded" />
                    <div className="h-3 w-1/2 skeleton rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mobile-nav-spacer" />
      </main>
    );
  }

  // Not found
  if (!details) {
    return (
      <main className="min-h-dvh bg-surface-primary">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-center px-5 pt-20">
          <div>
            <div className="text-5xl mb-4">🔍</div>
            <h1 className="text-xl font-bold mb-2">Route not found</h1>
            <p className="text-sm text-text-secondary mb-6">This route may have been deleted or doesn&apos;t exist.</p>
            <button onClick={() => router.push('/build')} className="btn-primary">Build a Route</button>
          </div>
        </div>
        <div className="mobile-nav-spacer" />
      </main>
    );
  }

  const route = details.routeData as GeneratedRoute;
  if (!route || !route.stops) {
    return (
      <main className="min-h-dvh bg-surface-primary">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-center px-5 pt-20">
          <div>
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold mb-2">Invalid route data</h1>
            <p className="text-sm text-text-secondary mb-6">This route&apos;s data appears to be corrupted.</p>
            <button onClick={() => router.back()} className="btn-secondary">Go Back</button>
          </div>
        </div>
        <div className="mobile-nav-spacer" />
      </main>
    );
  }

  const handleOpenInEditor = () => {
    setCurrentRoute(route);
    router.push('/route');
  };

  const handleViewOnMap = () => {
    setCurrentRoute(route);
    router.push('/map');
  };

  const handleToggleSave = async () => {
    if (!route.id) return;
    setSavingState('saving');
    try {
      await setSaved({
        routeId: route.id,
        saved: !details.savedForLater,
      });
      setSavingState('done');
      setTimeout(() => setSavingState('idle'), 1500);
    } catch {
      setSavingState('idle');
    }
  };

  const sourceLabel = details.source === 'history' ? 'Completed' : details.source === 'saved' ? 'Saved' : 'Planned';
  const completedStops = route.stops.filter(s => s.completed).length;

  return (
    <main className="min-h-dvh bg-surface-primary">
      <Navbar />

      {/* Orb decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 sm:pt-6 pb-32">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-4 transition-colors"
        >
          ← Back
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-xl sm:text-2xl font-bold leading-tight">{route.title}</h1>
            <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
              details.source === 'history'
                ? 'bg-emerald-500/15 text-status-success border border-emerald-500/20'
                : details.savedForLater
                  ? 'bg-red-500/15 text-status-error border border-red-500/20'
                  : 'bg-rally-500/15 text-rally-400 border border-rally-500/20'
            }`}>
              {sourceLabel}
            </span>
          </div>

          {route.vibeDescription && (
            <p className="text-sm text-text-secondary italic mb-3">{route.vibeDescription}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
            <span className="px-2 py-0.5 rounded-full bg-rally-500/15 text-rally-300 font-medium">{route.vibe}</span>
            {route.city && <span>{route.city}{route.neighborhood ? ` · ${route.neighborhood}` : ''}</span>}
            <span>·</span>
            <span>{route.stops.length} stops</span>
            <span>·</span>
            <span>~${route.totalCost}</span>
            <span>·</span>
            <span>{route.totalTime}</span>
          </div>

          {completedStops > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                <span>{completedStops}/{route.stops.length} completed</span>
              </div>
              <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${(completedStops / route.stops.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Map */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <RouteMap
            route={route}
            activeStopIndex={null}
            lockedStopIds={new Set()}
            onStopClick={() => {}}
            className="h-[200px] sm:h-[280px] mb-5"
          />
        </motion.div>

        {/* Stop list */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 mb-6"
        >
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Stops</h2>
          {route.stops.map((stop, i) => (
            <div
              key={stop.place.id || i}
              className="glass-card p-4"
            >
              <div className="flex gap-3">
                {/* Number + emoji */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                    stop.completed
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-linear-to-br from-rally-500/20 to-rally-pink/20 text-rally-300'
                  }`}>
                    {i + 1}
                  </div>
                  <span className="text-lg">{categoryEmoji(stop.place.category)}</span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold text-sm leading-tight ${stop.completed ? 'line-through text-text-muted' : ''}`}>
                    {stop.place.name}
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">{categoryLabel(stop.place.category)}</p>
                  {stop.place.address && (
                    <p className="text-xs text-text-muted mt-1 truncate">{stop.place.address}</p>
                  )}

                  {/* Reason */}
                  <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                    {stop.reason}
                  </p>
                  {stop.aiReason && stop.aiReason !== stop.reason && (
                    <p className="text-xs text-rally-400/70 italic mt-1">{stop.aiReason}</p>
                  )}

                  {/* Metadata row */}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-text-muted">
                    <span>~${stop.place.estimatedCost}</span>
                    <span>{stop.place.estimatedMinutes} min</span>
                    {i > 0 && stop.distanceFromPrev && (
                      <span>{stop.distanceFromPrev} away</span>
                    )}
                    {stop.completed && <span className="text-status-success">Done ✓</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* AI info */}
        {route.aiGenerated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-4 mb-6"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-rally-400 text-sm">✦</span>
              <span className="text-xs font-semibold text-rally-400">AI Planned</span>
            </div>
            {route.aiReasonForOrder && (
              <p className="text-xs text-text-secondary">{route.aiReasonForOrder}</p>
            )}
          </motion.div>
        )}

        {/* Metadata */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-xs text-text-muted space-y-1 mb-8"
        >
          {route.createdAt && <p>Created: {new Date(route.createdAt).toLocaleDateString()}</p>}
          {details.completedAt && <p>Completed: {new Date(details.completedAt).toLocaleDateString()}</p>}
          {route.travelMode && <p>Travel mode: {route.travelMode}</p>}
        </motion.div>
      </div>

      {/* Sticky bottom actions */}
      <div className="fixed bottom-[calc(60px+env(safe-area-inset-bottom,0px))] md:bottom-0 left-0 right-0 z-30 bg-surface-primary/80 backdrop-blur-xl border-t border-border-default">
        <div className="max-w-2xl mx-auto px-4 py-3 flex gap-2">
          <button onClick={handleOpenInEditor} className="btn-primary flex-1 text-sm py-2.5">
            Open in Editor
          </button>
          <button
            onClick={handleToggleSave}
            disabled={savingState === 'saving'}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              details.savedForLater
                ? 'bg-red-500/15 text-status-error border-red-500/20'
                : 'bg-surface-elevated text-text-secondary border-border-default hover:border-rally-500/30'
            }`}
          >
            {savingState === 'saving' ? '...' : savingState === 'done' ? '✓' : details.savedForLater ? '❤️' : '🤍'}
          </button>
          <button
            onClick={handleViewOnMap}
            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-text-secondary border border-border-default hover:border-rally-500/30 transition-all"
          >
            🗺️
          </button>
        </div>
      </div>

      <div className="mobile-nav-spacer" />
    </main>
  );
}
