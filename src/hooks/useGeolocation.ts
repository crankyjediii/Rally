'use client';
import { useState, useCallback, useEffect } from 'react';
import { LocationData } from '@/lib/types';
import { getCurrentLocation, checkLocationPermission } from '@/lib/geolocation';
import { DEMO_LOCATION } from '@/lib/mock-data';
import { saveLastLocation, getLastLocation } from '@/lib/storage';

export function useGeolocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  useEffect(() => {
    const cached = getLastLocation();
    if (cached) {
      // Explicitly stamp as 'cached' so UI can label it as stale
      setLocation({ ...cached, source: 'cached' });
    }
    checkLocationPermission().then(setPermissionState);
  }, []);

  const requestLocation = useCallback(async () => {
    setLoading(true);
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
      saveLastLocation(loc);
      if (!loc.isDemo) setPermissionState('granted');
      else setPermissionState('denied');
      return loc;
    } catch {
      const demo: LocationData = { ...DEMO_LOCATION, source: 'demo' };
      setLocation(demo);
      setPermissionState('denied');
      return demo;
    } finally {
      setLoading(false);
    }
  }, []);

  const useDemo = useCallback(() => {
    const demo: LocationData = { ...DEMO_LOCATION, source: 'demo' };
    setLocation(demo);
    saveLastLocation(demo);
    setPermissionState('denied');
  }, []);

  // For future manual city entry support
  const useManualLocation = useCallback((lat: number, lng: number, city: string, neighborhood?: string) => {
    const loc: LocationData = { lat, lng, city, neighborhood, isDemo: false, source: 'manual' };
    setLocation(loc);
    saveLastLocation(loc);
  }, []);

  // True when location came from localStorage cache (may be stale)
  const isStale = location?.source === 'cached';

  return { location, loading, permissionState, requestLocation, useDemo, useManualLocation, isStale };
}
