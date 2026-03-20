'use client';

import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RouteStop } from '@/lib/types';
import { categoryEmoji, categoryLabel, formatCurrency } from '@/lib/utils';

interface StopCardProps {
  stop: RouteStop;
  index: number;
  totalStops: number;
  isLocked: boolean;
  isActive: boolean;
  isEditing: boolean;
  isRevealed: boolean;
  onComplete: () => void;
  onRerollAI: () => void;
  onDelete: () => void;
  onToggleLock: () => void;
  onShowAlternatives: () => void;
  onActivate: () => void;
}

export default function StopCard({
  stop,
  index,
  isLocked,
  isActive,
  isEditing,
  isRevealed,
  onComplete,
  onRerollAI,
  onDelete,
  onToggleLock,
  onShowAlternatives,
  onActivate,
}: StopCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: stop.place.id,
    disabled: isLocked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={isRevealed ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.95 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onClick={onActivate}
      className={[
        'glass-card relative overflow-hidden transition-all',
        stop.completed ? 'opacity-60' : '',
        isActive ? 'ring-2 ring-rally-500/60 ring-offset-1 ring-offset-transparent' : '',
        isDragging ? 'shadow-2xl shadow-rally-500/30 scale-[1.02]' : '',
        isEditing ? 'pointer-events-none' : '',
      ].join(' ')}
    >
      {/* Left accent bar — amber for locked, gradient for normal */}
      <div className={`absolute top-0 left-0 w-1 h-full ${
        isLocked
          ? 'bg-amber-400'
          : 'bg-gradient-to-b from-rally-500 to-rally-pink'
      }`} />

      <div className="flex items-stretch gap-0 pl-3 pr-3.5 py-4">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className={`flex items-center pr-2.5 shrink-0 touch-none ${
            isLocked ? 'cursor-not-allowed opacity-20' : 'cursor-grab active:cursor-grabbing'
          }`}
          aria-label="Drag to reorder"
          role="button"
          tabIndex={isLocked ? -1 : 0}
        >
          <svg width="14" height="20" viewBox="0 0 14 20" fill="none" className="text-white/30">
            <circle cx="4" cy="4" r="1.5" fill="currentColor"/>
            <circle cx="4" cy="10" r="1.5" fill="currentColor"/>
            <circle cx="4" cy="16" r="1.5" fill="currentColor"/>
            <circle cx="10" cy="4" r="1.5" fill="currentColor"/>
            <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
            <circle cx="10" cy="16" r="1.5" fill="currentColor"/>
          </svg>
        </div>

        {/* Category emoji */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rally-500/20 to-rally-pink/20 flex items-center justify-center text-lg shrink-0 mt-0.5">
          {categoryEmoji(stop.place.category)}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 pl-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs text-rally-400 font-semibold">STOP {index + 1}</span>
              <h3 className={`text-base sm:text-[17px] font-bold leading-tight ${stop.completed ? 'line-through opacity-60' : ''}`}>
                {stop.place.name}
              </h3>
              <p className="text-[10px] sm:text-xs text-text-muted mt-0.5">
                {categoryLabel(stop.place.category)}
                {stop.place.address ? ` · ${stop.place.address}` : ''}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
              <span className="text-xs sm:text-sm font-semibold text-rally-400">
                {formatCurrency(stop.place.estimatedCost)}
              </span>

              {/* Lock / Unlock button */}
              <button
                onClick={e => { e.stopPropagation(); onToggleLock(); }}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                aria-label={isLocked ? 'Unlock stop' : 'Lock stop'}
                title={isLocked ? 'Unlock this stop' : 'Lock this stop so edits skip it'}
              >
                <span className={`text-sm ${isLocked ? 'text-amber-400' : 'text-white/25 hover:text-white/50'}`}>
                  {isLocked ? '🔒' : '🔓'}
                </span>
              </button>
            </div>
          </div>

          {/* Reason text */}
          <p className="text-xs sm:text-sm text-text-secondary mt-1.5 leading-relaxed">
            {stop.reason}
          </p>
          {stop.aiReason && stop.aiReason !== stop.reason && (
            <p className="text-xs text-rally-300/65 mt-1 italic leading-relaxed">
              ✦ {stop.aiReason}
            </p>
          )}

          {/* Tags */}
          {stop.place.tags && stop.place.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {stop.place.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-text-muted">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Distance / time meta */}
          <div className="flex items-center gap-3 mt-2 text-[10px] sm:text-xs text-text-muted">
            {stop.distanceFromPrev !== 'Start' && (
              <>
                <span>📍 {stop.distanceFromPrev}</span>
                <span>🚶 {stop.travelTimeFromPrev}</span>
              </>
            )}
            <span>⏱️ ~{stop.place.estimatedMinutes} min</span>
            {isLocked && <span className="text-amber-400/70 font-medium">locked</span>}
          </div>

          {/* Action chips — horizontally scrollable on mobile */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar pb-0.5">
            {/* Mark done */}
            <button
              onClick={e => { e.stopPropagation(); onComplete(); }}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap min-h-[34px] shrink-0 ${
                stop.completed
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/5 text-text-secondary active:bg-white/10'
              }`}
            >
              {stop.completed ? '✓ Done' : 'Mark done'}
            </button>

            {/* Reroll (AI swap) */}
            {!isLocked && (
              <button
                onClick={e => { e.stopPropagation(); onRerollAI(); }}
                disabled={isEditing}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-text-secondary active:bg-white/10 transition-colors whitespace-nowrap min-h-[34px] shrink-0 disabled:opacity-40"
              >
                🎲 Swap
              </button>
            )}

            {/* See alternatives */}
            {!isLocked && (
              <button
                onClick={e => { e.stopPropagation(); onShowAlternatives(); }}
                disabled={isEditing}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-text-secondary active:bg-white/10 transition-colors whitespace-nowrap min-h-[34px] shrink-0 disabled:opacity-40"
              >
                ✦ Alternatives
              </button>
            )}

            {/* Directions */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${stop.place.lat},${stop.place.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-text-secondary active:bg-white/10 transition-colors whitespace-nowrap min-h-[34px] shrink-0 inline-flex items-center"
            >
              🧭 Directions
            </a>

            {/* Delete */}
            {!isLocked && (
              <button
                onClick={e => { e.stopPropagation(); onDelete(); }}
                disabled={isEditing}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400/70 hover:bg-red-500/20 hover:text-red-400 active:bg-red-500/25 transition-colors whitespace-nowrap min-h-[34px] shrink-0 disabled:opacity-40"
                aria-label="Delete stop"
                title="Remove this stop"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Editing overlay */}
      {isEditing && (
        <div className="absolute inset-0 bg-surface-primary/30 backdrop-blur-[2px] rounded-xl flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <div className="w-3.5 h-3.5 border border-rally-500/50 border-t-rally-500 rounded-full animate-spin" />
            <span>Updating…</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
