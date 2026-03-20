'use client';

import { Suspense, useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { getCurrentRoute } from '@/lib/storage';
import { GeneratedRoute } from '@/lib/types';
import { categoryLabel } from '@/lib/utils';

const CARTO_DARK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const CARTO_LIGHT = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

function getMapStyle() {
  if (typeof window === 'undefined') return CARTO_LIGHT;
  return document.documentElement.classList.contains('dark') ? CARTO_DARK : CARTO_LIGHT;
}

export default function MapPage() {
  return (
    <Suspense fallback={
      <main className="h-dvh flex items-center justify-center bg-surface-primary">
        <div className="w-8 h-8 border-2 border-rally-500/40 border-t-rally-500 rounded-full animate-spin" />
      </main>
    }>
      <MapPageInner />
    </Suspense>
  );
}

function MapPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markersRef = useRef<Array<{ remove: () => void }>>([]);
  const prevStopIdsRef = useRef<string>('');
  const [route, setRoute] = useState<GeneratedRoute | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  // ── Load route from localStorage (or from query param in future) ──

  useEffect(() => {
    const stored = getCurrentRoute();
    setRoute(stored);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'rally-current-route' || e.key === 'CURRENT_ROUTE') {
        try {
          const updated = e.newValue ? JSON.parse(e.newValue) : null;
          setRoute(updated);
        } catch { /* ignore parse errors */ }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [searchParams]);

  // ── Effect 1: Initialize map ONCE ─────────────────────────────────

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let cancelled = false;

    const loadMap = async () => {
      const { default: maplibregl } = await import('maplibre-gl');
      await import('maplibre-gl/dist/maplibre-gl.css');

      if (cancelled || !mapRef.current || mapInstanceRef.current) return;

      const map = new maplibregl.Map({
        container: mapRef.current,
        style: getMapStyle(),
        zoom: 13,
        center: [0, 0],
      });

      map.addControl(new maplibregl.NavigationControl(), 'top-right');

      map.on('load', () => {
        if (!cancelled) setMapLoaded(true);
      });

      mapInstanceRef.current = map;
    };

    loadMap().catch(console.error);

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
      setMapLoaded(false);
    };
  }, []);

  // ── Effect 2: Update markers + polyline when route changes ────────

  useEffect(() => {
    const map = mapInstanceRef.current as {
      getSource: (id: string) => { setData: (d: unknown) => void } | undefined;
      addSource: (id: string, spec: unknown) => void;
      addLayer: (spec: unknown) => void;
      getLayer: (id: string) => unknown;
      removeLayer: (id: string) => void;
      removeSource: (id: string) => void;
      fitBounds: (bounds: unknown, opts: unknown) => void;
    } | null;

    if (!map || !mapLoaded || !route || route.stops.length === 0) return;

    const applyUpdates = async () => {
      const { default: maplibregl } = await import('maplibre-gl');

      // 1. Clear existing markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      // 2. Update polyline
      const coords = route.stops.map(s => [s.place.lng, s.place.lat]);
      const geoJson = {
        type: 'Feature' as const,
        geometry: { type: 'LineString' as const, coordinates: coords },
        properties: {},
      };

      const existingSource = map.getSource('route-line');
      if (existingSource) {
        existingSource.setData(geoJson);
      } else {
        map.addSource('route-line', { type: 'geojson', data: geoJson });
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route-line',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#a855f7',
            'line-width': 3,
            'line-opacity': 0.7,
          },
        });
      }

      // 3. Add numbered markers
      route.stops.forEach((stop, i) => {
        const el = document.createElement('div');
        el.className = 'flex items-center justify-center text-sm font-bold text-white rounded-full';
        el.style.width = '40px';
        el.style.height = '40px';
        el.style.background = stop.completed
          ? 'linear-gradient(135deg, #10b981, #06b6d4)'
          : 'linear-gradient(135deg, #a855f7, #ec4899)';
        el.style.border = '2px solid rgba(255,255,255,0.3)';
        el.style.boxShadow = '0 2px 10px rgba(168,85,247,0.4)';
        el.style.cursor = 'pointer';
        el.textContent = String(i + 1);

        const popup = new maplibregl.Popup({ offset: 25, closeButton: false })
          .setHTML(`
            <div style="min-width:160px;max-width:220px;font-family:sans-serif">
              <div style="font-size:14px;font-weight:bold;margin-bottom:3px">${stop.place.name}</div>
              <div style="font-size:12px;opacity:0.7">${categoryLabel(stop.place.category)}</div>
              ${stop.place.address ? `<div style="font-size:11px;opacity:0.5;margin-top:3px">${stop.place.address}</div>` : ''}
              <div style="font-size:11px;opacity:0.6;margin-top:4px">~$${stop.place.estimatedCost} · ${stop.place.estimatedMinutes} min</div>
            </div>
          `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([stop.place.lng, stop.place.lat])
          .setPopup(popup)
          .addTo(mapInstanceRef.current as Parameters<typeof marker.addTo>[0]);

        markersRef.current.push(marker);
      });

      // 4. Fit bounds when stop composition changes
      const stopIdKey = route.stops.map(s => s.place.id).join(',');
      if (stopIdKey !== prevStopIdsRef.current) {
        const bounds = new maplibregl.LngLatBounds();
        route.stops.forEach(s => bounds.extend([s.place.lng, s.place.lat]));
        map.fitBounds(bounds, { padding: 60, duration: 600, maxZoom: 16 });
        prevStopIdsRef.current = stopIdKey;
      }
    };

    applyUpdates().catch(console.error);
  }, [route, mapLoaded]);

  // ── Recenter handler ──────────────────────────────────────────────

  const handleRecenter = useCallback(async () => {
    if (!mapInstanceRef.current || !route) return;
    const { default: maplibregl } = await import('maplibre-gl');
    const bounds = new maplibregl.LngLatBounds();
    route.stops.forEach(s => bounds.extend([s.place.lng, s.place.lat]));
    const map = mapInstanceRef.current as { fitBounds: (b: unknown, o: unknown) => void };
    map.fitBounds(bounds, { padding: 60, duration: 600, maxZoom: 16 });
  }, [route]);

  return (
    <main className="h-dvh flex flex-col overflow-hidden">
      {/* Minimal top bar for map — only on desktop */}
      <div className="hidden md:block">
        <Navbar />
      </div>

      {route ? (
        <div className="flex-1 relative">
          {/* Full-bleed map */}
          <div ref={mapRef} className="absolute inset-0" style={{ touchAction: 'pan-x pan-y pinch-zoom' }} />

          {/* Loading overlay */}
          {!mapLoaded && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface-primary">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-rally-500/40 border-t-rally-500 rounded-full animate-spin" />
                <span className="text-sm text-text-muted">Loading map…</span>
              </div>
            </div>
          )}

          {/* Mobile back button */}
          <button
            onClick={() => router.push('/route')}
            className="md:hidden absolute top-3 left-3 z-10 w-10 h-10 rounded-xl bg-surface-primary/80 backdrop-blur-md border border-border-default flex items-center justify-center text-lg active:scale-90 transition-transform"
          >
            ←
          </button>

          {/* Recenter button */}
          <button
            onClick={handleRecenter}
            className="absolute top-3 right-3 z-10 w-10 h-10 rounded-xl bg-surface-primary/80 backdrop-blur-md border border-border-default flex items-center justify-center text-lg active:scale-90 transition-transform md:right-16"
            title="Recenter map"
          >
            ⊙
          </button>

          {/* Route info overlay — collapsible on mobile */}
          <div className={`absolute z-10 transition-transform duration-300 ease-out ${
            showOverlay ? 'translate-y-0' : 'translate-y-[calc(100%-40px)]'
          } bottom-[calc(60px+env(safe-area-inset-bottom,0px))] md:bottom-6 left-3 right-3 md:left-6 md:right-auto md:max-w-sm`}>
            {/* Drag handle — mobile only */}
            <button
              onClick={() => setShowOverlay(!showOverlay)}
              className="md:hidden w-full flex justify-center py-2"
            >
              <div className="w-8 h-1 rounded-full bg-text-muted/30" />
            </button>

            <div className="glass-card p-4 bg-surface-primary/90 backdrop-blur-xl">
              <h2 className="font-bold text-base sm:text-lg mb-1">{route.title}</h2>
              <div className="flex items-center gap-2 text-xs text-text-secondary mb-3">
                <span className="px-2 py-0.5 rounded-full bg-rally-500/15 text-rally-adaptive text-[10px] font-medium">{route.vibe}</span>
                <span>{route.stops.length} stops</span>
                <span>·</span>
                <span>{route.totalTime}</span>
                <span>·</span>
                <span>~${route.totalCost}</span>
              </div>
              <div className="space-y-1.5 max-h-[30vh] overflow-y-auto no-scrollbar">
                {route.stops.map((stop, i) => (
                  <div key={stop.place.id || i} className="flex items-center gap-2.5 text-sm py-0.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      stop.completed ? 'bg-rally-sage/30 text-status-success' : 'bg-rally-500/20 text-rally-adaptive'
                    }`}>{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <span className={`block truncate ${stop.completed ? 'text-text-muted line-through' : 'text-text-secondary'}`}>{stop.place.name}</span>
                      <span className="block text-[10px] text-text-muted truncate">{categoryLabel(stop.place.category)}{stop.place.address ? ` · ${stop.place.address}` : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => router.push('/route')} className="btn-secondary w-full mt-3 text-sm py-2.5">
                Back to Route
              </button>
            </div>
          </div>

          {/* Mobile bottom nav */}
          <div className="md:hidden">
            <Navbar />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center px-5">
          <div>
            <div className="text-5xl mb-4">🗺️</div>
            <h1 className="text-xl sm:text-2xl font-bold mb-2">No active route</h1>
            <p className="text-sm text-text-secondary mb-6">Generate a route to see it on the map.</p>
            <button onClick={() => router.push('/build')} className="btn-primary w-full sm:w-auto">Build a Route</button>
          </div>
          <div className="mobile-nav-spacer" />
        </div>
      )}
    </main>
  );
}
