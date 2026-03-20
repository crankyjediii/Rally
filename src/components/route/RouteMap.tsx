'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GeneratedRoute } from '@/lib/types';
import { categoryLabel } from '@/lib/utils';

interface RouteMapProps {
  route: GeneratedRoute;
  activeStopIndex: number | null;
  lockedStopIds: Set<string>;
  onStopClick: (index: number) => void;
  className?: string;
}

const CARTO_DARK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

function createMarkerElement(
  index: number,
  opts: { completed: boolean; active: boolean; locked: boolean },
): HTMLDivElement {
  const el = document.createElement('div');
  el.style.position = 'relative';
  el.style.width = opts.active ? '44px' : '36px';
  el.style.height = opts.active ? '44px' : '36px';
  el.style.borderRadius = '50%';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.fontSize = '13px';
  el.style.fontWeight = 'bold';
  el.style.color = 'white';
  el.style.cursor = 'pointer';
  el.style.transition = 'all 0.2s ease';
  el.style.border = opts.active
    ? '3px solid rgba(255,255,255,0.9)'
    : '2px solid rgba(255,255,255,0.3)';
  el.style.boxShadow = opts.active
    ? '0 0 0 3px rgba(168,85,247,0.4), 0 4px 16px rgba(168,85,247,0.5)'
    : '0 2px 10px rgba(168,85,247,0.35)';

  if (opts.completed) {
    el.style.background = 'linear-gradient(135deg, #10b981, #06b6d4)';
  } else {
    el.style.background = 'linear-gradient(135deg, #a855f7, #ec4899)';
  }

  el.textContent = String(index + 1);

  if (opts.locked) {
    const lock = document.createElement('div');
    lock.style.position = 'absolute';
    lock.style.bottom = '-2px';
    lock.style.right = '-2px';
    lock.style.width = '14px';
    lock.style.height = '14px';
    lock.style.borderRadius = '50%';
    lock.style.background = '#f59e0b';
    lock.style.fontSize = '8px';
    lock.style.display = 'flex';
    lock.style.alignItems = 'center';
    lock.style.justifyContent = 'center';
    lock.textContent = '🔒';
    el.appendChild(lock);
  }

  return el;
}

export default function RouteMap({
  route,
  activeStopIndex,
  lockedStopIds,
  onStopClick,
  className = '',
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);
  const prevStopIdsRef = useRef<string>('');
  const [mapLoaded, setMapLoaded] = useState(false);

  // ── Effect 1: Initialize map ONCE ───────────────────────────────

  useEffect(() => {
    if (!containerRef.current || mapInstanceRef.current) return;

    let cancelled = false;

    const loadMap = async () => {
      const { default: maplibregl } = await import('maplibre-gl');
      await import('maplibre-gl/dist/maplibre-gl.css');

      if (cancelled || !containerRef.current || mapInstanceRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: CARTO_DARK,
        zoom: 13,
        center: [route.stops[0]?.place.lng ?? 0, route.stops[0]?.place.lat ?? 0],
      });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Effect 2: Update markers + polyline when route/active/locked changes ──

  const onStopClickStable = useCallback(onStopClick, [onStopClick]);

  useEffect(() => {
    const map = mapInstanceRef.current as {
      getSource: (id: string) => unknown;
      addSource: (id: string, spec: unknown) => void;
      addLayer: (spec: unknown) => void;
      fitBounds: (bounds: unknown, opts: unknown) => void;
      loaded: () => boolean;
    } | null;

    if (!map || !mapLoaded || !route || route.stops.length === 0) return;

    // Dynamically import maplibregl for class references
    const applyUpdates = async () => {
      const { default: maplibregl } = await import('maplibre-gl');

      // 1. Clear existing markers
      (markersRef.current as Array<{ remove: () => void }>).forEach(m => m.remove());
      markersRef.current = [];

      // 2. Update polyline
      const coords = route.stops.map(s => [s.place.lng, s.place.lat]);
      const geoJson = {
        type: 'Feature' as const,
        geometry: { type: 'LineString' as const, coordinates: coords },
        properties: {},
      };

      if (map.getSource('route-line')) {
        (map.getSource('route-line') as { setData: (d: unknown) => void }).setData(geoJson);
      } else {
        map.addSource('route-line', { type: 'geojson', data: geoJson });
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route-line',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#a855f7',
            'line-width': 2,
            'line-opacity': 0.55,
            'line-dasharray': [3, 2],
          },
        });
      }

      // 3. Add new markers
      route.stops.forEach((stop, i) => {
        const el = createMarkerElement(i, {
          completed: stop.completed,
          active: i === activeStopIndex,
          locked: lockedStopIds.has(stop.place.id),
        });
        el.addEventListener('click', () => onStopClickStable(i));

        const popup = new maplibregl.Popup({ offset: 22, closeButton: false })
          .setHTML(`
            <div style="min-width:140px;max-width:200px;font-family:sans-serif">
              <div style="font-size:13px;font-weight:bold;margin-bottom:2px">${stop.place.name}</div>
              <div style="font-size:11px;opacity:0.65">${categoryLabel(stop.place.category)}</div>
              ${stop.place.address ? `<div style="font-size:10px;opacity:0.5;margin-top:2px">${stop.place.address}</div>` : ''}
            </div>
          `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([stop.place.lng, stop.place.lat])
          .setPopup(popup)
          .addTo(mapInstanceRef.current as Parameters<typeof marker.addTo>[0]);

        markersRef.current.push(marker);
      });

      // 4. Fit bounds only when stop composition changes (not just active highlight)
      const stopIdKey = route.stops.map(s => s.place.id).join(',');
      if (stopIdKey !== prevStopIdsRef.current) {
        const bounds = new maplibregl.LngLatBounds();
        route.stops.forEach(s => bounds.extend([s.place.lng, s.place.lat]));
        map.fitBounds(bounds, { padding: 55, duration: 600, maxZoom: 16 });
        prevStopIdsRef.current = stopIdKey;
      }
    };

    applyUpdates().catch(console.error);
  }, [route, activeStopIndex, lockedStopIds, mapLoaded, onStopClickStable]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`relative ${className}`}
    >
      <div
        ref={containerRef}
        className="w-full h-full rounded-2xl overflow-hidden bg-surface-card border border-border-default"
        style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
      />
      {!mapLoaded && (
        <div className="absolute inset-0 rounded-2xl overflow-hidden bg-surface-card border border-border-default">
          {/* Skeleton grid lines */}
          <div className="absolute inset-0 opacity-[0.07]">
            {/* Horizontal lines */}
            {[20, 35, 50, 65, 80].map(pct => (
              <div key={pct} className="absolute left-0 right-0 h-px bg-white" style={{ top: `${pct}%` }} />
            ))}
            {/* Vertical lines */}
            {[15, 30, 45, 60, 75, 90].map(pct => (
              <div key={pct} className="absolute top-0 bottom-0 w-px bg-white" style={{ left: `${pct}%` }} />
            ))}
          </div>
          {/* Shimmer sweep */}
          <div className="skeleton absolute inset-0" />
          {/* Loading indicator */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-text-muted">
            <div className="w-6 h-6 border-2 border-rally-500/40 border-t-rally-500 rounded-full animate-spin" />
            <span className="text-xs">Loading map…</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
