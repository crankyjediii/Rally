'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { getCurrentRoute } from '@/lib/storage';
import { GeneratedRoute } from '@/lib/types';
import { categoryLabel } from '@/lib/utils';

export default function MapPage() {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const boundsRef = useRef<unknown>(null);
  const [route, setRoute] = useState<GeneratedRoute | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    const stored = getCurrentRoute();
    setRoute(stored);
  }, []);

  useEffect(() => {
    if (!route || !mapRef.current) return;

    const loadMap = async () => {
      const maplibregl = await import('maplibre-gl');
      await import('maplibre-gl/dist/maplibre-gl.css');

      const bounds = new maplibregl.LngLatBounds();
      route.stops.forEach(stop => {
        bounds.extend([stop.place.lng, stop.place.lat]);
      });

      boundsRef.current = bounds;

      const map = new maplibregl.Map({
        container: mapRef.current!,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        bounds: bounds,
        fitBoundsOptions: { padding: 60 },
      });

      mapInstanceRef.current = map;
      map.addControl(new maplibregl.NavigationControl(), 'top-right');

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

        new maplibregl.Marker({ element: el })
          .setLngLat([stop.place.lng, stop.place.lat])
          .setPopup(
            new maplibregl.Popup({ offset: 25 })
              .setHTML(`
                <div style="min-width:150px">
                  <strong style="font-size:14px">${stop.place.name}</strong><br/>
                  <span style="opacity:0.7;font-size:12px">${categoryLabel(stop.place.category)}</span><br/>
                  <span style="opacity:0.5;font-size:11px">${stop.place.address}</span>
                </div>
              `)
          )
          .addTo(map);
      });
    };

    loadMap();
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

          {/* Mobile back button */}
          <button
            onClick={() => router.push('/route')}
            className="md:hidden absolute top-3 left-3 z-10 w-10 h-10 rounded-xl bg-surface-primary/80 backdrop-blur-md border border-border-default flex items-center justify-center text-lg active:scale-90 transition-transform"
          >
            ←
          </button>

          {/* Recenter button — desktop only */}
          <button
            onClick={() => {
              if (mapInstanceRef.current && boundsRef.current) {
                const map = mapInstanceRef.current as unknown as { fitBounds: (b: unknown, o: unknown) => void };
                const bounds = boundsRef.current as unknown as object;
                map.fitBounds(bounds, { padding: 60 });
              }
            }}
            className="hidden md:flex absolute top-3 right-3 z-10 w-10 h-10 rounded-xl bg-surface-primary/80 backdrop-blur-md border border-border-default items-center justify-center text-lg active:scale-90 transition-transform"
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
              <div className="w-8 h-1 rounded-full bg-white/30" />
            </button>

            <div className="glass-card p-4 bg-surface-primary/90 backdrop-blur-xl">
              <h2 className="font-bold text-base sm:text-lg mb-1">{route.title}</h2>
              <p className="text-xs sm:text-sm text-text-secondary mb-3">{route.stops.length} stops · {route.totalTime} · {route.travelMode}</p>
              <div className="space-y-1.5 max-h-[30vh] overflow-y-auto no-scrollbar">
                {route.stops.map((stop, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm py-0.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      stop.completed ? 'bg-emerald-500/30 text-emerald-300' : 'bg-rally-500/30 text-rally-300'
                    }`}>{i + 1}</span>
                    <span className={`truncate ${stop.completed ? 'text-text-muted line-through' : 'text-text-secondary'}`}>{stop.place.name}</span>
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
