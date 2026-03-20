import { LocationData } from './types';
import { DEMO_LOCATION } from './mock-data';

// Reverse geocode lat/lng to city/neighborhood labels (display only)
async function reverseGeocode(lat: number, lng: number): Promise<{ city: string; neighborhood?: string }> {
  try {
    const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
    if (res.ok) {
      const data = await res.json();
      return {
        city: data.city || 'Your City',
        neighborhood: data.neighborhood,
      };
    }
  } catch {
    // Non-fatal — just use generic label
  }
  return { city: 'Your City' };
}

// High-accuracy location retrieval using watchPosition.
// Accepts as soon as accuracy < 200m is achieved, or after 8s takes best available.
// Returns source: 'precise' on success, source: 'demo' on failure/denial.
export async function getCurrentLocation(): Promise<LocationData> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ ...DEMO_LOCATION, source: 'demo' });
      return;
    }

    let settled = false;
    let bestPosition: GeolocationPosition | null = null;
    let watchId: number = 0;

    async function acceptPosition(position: GeolocationPosition) {
      if (settled) return;
      settled = true;
      navigator.geolocation.clearWatch(watchId);
      clearTimeout(timeoutId);

      const { latitude, longitude, accuracy } = position.coords;
      const geo = await reverseGeocode(latitude, longitude);

      resolve({
        lat: latitude,
        lng: longitude,
        city: geo.city,
        neighborhood: geo.neighborhood,
        isDemo: false,
        accuracy,
        timestamp: position.timestamp,
        source: 'precise',
      });
    }

    // After 8s, accept the best position we got (or fall back to demo)
    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      navigator.geolocation.clearWatch(watchId);

      if (bestPosition) {
        const { latitude, longitude, accuracy } = bestPosition.coords;
        reverseGeocode(latitude, longitude).then((geo) => {
          resolve({
            lat: latitude,
            lng: longitude,
            city: geo.city,
            neighborhood: geo.neighborhood,
            isDemo: false,
            accuracy,
            timestamp: bestPosition!.timestamp,
            source: 'precise',
          });
        });
      } else {
        resolve({ ...DEMO_LOCATION, source: 'demo' });
      }
    }, 8000);

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        bestPosition = position;
        // Accept immediately if accuracy is good enough
        if (position.coords.accuracy <= 200) {
          acceptPosition(position);
        }
      },
      () => {
        // Permission denied or hardware error
        if (!settled) {
          settled = true;
          clearTimeout(timeoutId);
          resolve({ ...DEMO_LOCATION, source: 'demo' });
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

export function checkLocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (typeof navigator === 'undefined' || !navigator.permissions) return Promise.resolve('prompt');
  return navigator.permissions
    .query({ name: 'geolocation' })
    .then(result => result.state as 'granted' | 'denied' | 'prompt')
    .catch(() => 'prompt' as const);
}
