'use client';

import { useState } from 'react';
import { getCurrentRoute, getCandidatePool } from '@/lib/storage';
import { useGeolocation } from '@/hooks/useGeolocation';

/**
 * DiagnosticsPanel — Dev-only overlay for debugging location, routing, and AI planning.
 * Shows current location (lat/lng/accuracy/source), candidate pool stats, and route stop IDs.
 * Only visible in development mode (NODE_ENV=development).
 */
export default function DiagnosticsPanel() {
  const { location } = useGeolocation();
  const [isOpen, setIsOpen] = useState(false);
  const route = getCurrentRoute();
  const pool = getCandidatePool();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const stopIds = route?.stops.map(s => s.place.id).join(', ') || 'N/A';
  const poolSize = pool?.places.length ?? 0;
  const poolAge = pool ? Math.round((Date.now() - pool.fetchedAt) / 1000) : -1;
  const poolStale = poolAge > 7200; // 2 hours

  return (
    <div className="fixed bottom-20 md:bottom-6 right-3 z-40 font-mono text-xs">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-lg bg-amber-500/80 backdrop-blur-md border border-amber-400/50 flex items-center justify-center text-white font-bold hover:bg-amber-600/80 transition-colors"
        title="Toggle diagnostics"
      >
        ⚙
      </button>

      {/* Diagnostics panel */}
      {isOpen && (
        <div className="absolute bottom-10 right-0 w-72 bg-gray-950/95 backdrop-blur-md border border-amber-400/30 rounded-lg p-3 space-y-2 text-amber-100 shadow-lg">
          {/* Location section */}
          <div className="border-b border-amber-400/20 pb-2">
            <div className="font-bold text-amber-300">📍 Location</div>
            <div>Lat: <span className="text-amber-200">{location?.lat.toFixed(6) || 'N/A'}</span></div>
            <div>Lng: <span className="text-amber-200">{location?.lng.toFixed(6) || 'N/A'}</span></div>
            <div>Accuracy: <span className="text-amber-200">{location?.accuracy ? `±${location.accuracy}m` : 'N/A'}</span></div>
            <div>
              Source:{' '}
              <span className={`${
                location?.source === 'precise' ? 'text-emerald-400' :
                location?.source === 'cached' ? 'text-orange-400' :
                location?.source === 'manual' ? 'text-blue-400' :
                'text-gray-400'
              }`}>
                {location?.source || 'N/A'}
              </span>
            </div>
            {location?.timestamp && (
              <div className="text-amber-300/70">
                {new Date(location.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Candidate pool section */}
          <div className="border-b border-amber-400/20 pb-2">
            <div className="font-bold text-amber-300">🎲 Candidate Pool</div>
            <div>Size: <span className="text-amber-200">{poolSize}</span></div>
            <div>
              Age:{' '}
              <span className={poolStale ? 'text-orange-400' : 'text-amber-200'}>
                {poolAge >= 0 ? `${poolAge}s` : 'N/A'}
              </span>
              {poolStale && <span className="text-orange-400 ml-1">(stale)</span>}
            </div>
            {pool && (
              <>
                <div>Lat: <span className="text-amber-200">{pool.lat.toFixed(6)}</span></div>
                <div>Lng: <span className="text-amber-200">{pool.lng.toFixed(6)}</span></div>
                <div>Radius: <span className="text-amber-200">{pool.radius}m</span></div>
              </>
            )}
          </div>

          {/* Route section */}
          <div>
            <div className="font-bold text-amber-300">🛣 Route</div>
            {route ? (
              <>
                <div>Title: <span className="text-amber-200">{route.title}</span></div>
                <div>Stops: <span className="text-amber-200">{route.stops.length}</span></div>
                <div>AI Generated: <span className="text-amber-200">{route.aiGenerated ? 'Yes' : 'No'}</span></div>
                <div className="mt-1 pt-1 border-t border-amber-400/20">
                  <div className="text-amber-300/70 mb-1">Stop IDs:</div>
                  <div className="text-amber-200 break-all">{stopIds}</div>
                </div>
              </>
            ) : (
              <div className="text-amber-300/70">No active route</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
