'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import Navbar from '@/components/layout/Navbar';
import { UserPreferences, Place, LocationData, GeneratedRoute } from '@/lib/types';
import { VIBES, GROUP_TYPES, BUDGETS, TIME_OPTIONS, RADIUS_OPTIONS, ENERGY_OPTIONS, INDOOR_OUTDOOR_OPTIONS, DEFAULT_PREFERENCES } from '@/lib/constants';
import { useGeolocation } from '@/hooks/useGeolocation';
import { generateRoute } from '@/lib/route-engine';
import { prepareCandidates } from '@/lib/candidate-scorer';
import { getMockPlaces } from '@/lib/mock-data';
import { setCurrentRoute, savePreferences, setCandidatePool } from '@/lib/storage';

const STEPS = ['Vibe', 'Details', 'Location', 'Generate'];

const RADIUS_MAP: Record<string, string> = {
  walking: '1500',
  '10-min-drive': '5000',
  '20-min-drive': '10000',
  anywhere: '20000',
};

type PlacesFetchStatus = 'idle' | 'fetching' | 'success' | 'sparse' | 'error';
type GeneratingStage = 'location' | 'places' | 'scoring' | 'building' | null;

const STAGE_LABELS: Record<NonNullable<GeneratingStage>, string> = {
  location: 'Getting your location...',
  places: 'Finding nearby spots...',
  scoring: 'Filtering matches...',
  building: 'Building your route...',
};

const STAGE_ORDER: NonNullable<GeneratingStage>[] = ['location', 'places', 'scoring', 'building'];

function OptionGrid<T extends string>({
  options,
  value,
  onChange,
  columns = 'grid-cols-2 sm:grid-cols-3',
}: {
  options: { value: T; label: string; icon: string; description?: string }[];
  value: T;
  onChange: (v: T) => void;
  columns?: string;
}) {
  return (
    <div className={`grid ${columns} gap-2.5 sm:gap-3`}>
      {options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`option-card ${opt.value === value ? 'active' : ''}`}
        >
          <span className="text-xl sm:text-2xl">{opt.icon}</span>
          <span className="text-xs sm:text-sm font-medium">{opt.label}</span>
          {opt.description && <span className="text-[10px] sm:text-xs text-text-muted hidden sm:block">{opt.description}</span>}
        </button>
      ))}
    </div>
  );
}

export default function BuildPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const updatePrefsMutation = useMutation(api.preferences.updatePreferences);
  const { location, loading: geoLoading, requestLocation, useDemo, isStale } = useGeolocation();
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [generating, setGenerating] = useState(false);
  const [generatingStage, setGeneratingStage] = useState<GeneratingStage>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [fetchedPlaces, setFetchedPlaces] = useState(false);
  const [placesFetchStatus, setPlacesFetchStatus] = useState<PlacesFetchStatus>('idle');

  const update = <K extends keyof UserPreferences>(key: K, val: UserPreferences[K]) => {
    setPrefs(p => ({ ...p, [key]: val }));
  };

  // Fetch real nearby places — does NOT silently fall back to NYC mock data
  const fetchPlaces = useCallback(async (loc: LocationData): Promise<Place[]> => {
    if (loc.isDemo) {
      // Demo mode: explicitly use mock data
      const mock = getMockPlaces();
      setPlaces(mock);
      setFetchedPlaces(true);
      setPlacesFetchStatus('success');
      return mock;
    }

    setPlacesFetchStatus('fetching');
    try {
      const radius = RADIUS_MAP[prefs.radius] || '5000';
      const res = await fetch(`/api/places?lat=${loc.lat}&lng=${loc.lng}&radius=${radius}`);
      const data = await res.json();
      if (data.places && data.places.length > 0) {
        setPlaces(data.places);
        setFetchedPlaces(true);
        setPlacesFetchStatus('success');
        return data.places;
      } else {
        // Sparse area — be honest about it
        setFetchedPlaces(true);
        setPlacesFetchStatus('sparse');
        // Use mock data but the route will be marked isDemo
        const mock = getMockPlaces();
        setPlaces(mock);
        return mock;
      }
    } catch {
      setFetchedPlaces(true);
      setPlacesFetchStatus('error');
      return [];
    }
  }, [prefs.radius]);

  const handleLocationRequest = useCallback(async () => {
    const loc = await requestLocation();
    await fetchPlaces(loc);
  }, [requestLocation, fetchPlaces]);

  const handleDemo = useCallback(() => {
    useDemo();
    const mock = getMockPlaces();
    setPlaces(mock);
    setFetchedPlaces(true);
    setPlacesFetchStatus('success');
  }, [useDemo]);

  const handleGenerate = useCallback(async () => {
    // Guard: require location — never silently use hardcoded NYC
    if (!location) return;

    setGenerating(true);
    savePreferences(prefs);

    // Fire-and-forget sync to Convex
    if (isSignedIn) {
      updatePrefsMutation({
        vibe: prefs.vibe,
        groupType: prefs.groupType,
        budget: prefs.budget,
        timeAvailable: prefs.timeAvailable,
        radius: prefs.radius,
        energy: prefs.energy,
        indoorOutdoor: prefs.indoorOutdoor,
        foodRequired: prefs.foodRequired,
        attractionRequired: prefs.attractionRequired,
      }).catch(() => {/* non-fatal */});
    }

    const loc = location;
    const isDemo = loc.isDemo || placesFetchStatus === 'sparse';

    setGeneratingStage('location');
    await new Promise(r => setTimeout(r, 350));

    // Get places if not already fetched
    let usePlaces = places;
    if (usePlaces.length === 0) {
      setGeneratingStage('places');
      usePlaces = await fetchPlaces(loc);
    }

    // If still empty after fetch and not demo, can't generate
    if (usePlaces.length === 0 && !isDemo) {
      setGenerating(false);
      setGeneratingStage(null);
      return;
    }
    if (usePlaces.length === 0) {
      usePlaces = getMockPlaces();
    }

    setGeneratingStage('scoring');
    await new Promise(r => setTimeout(r, 300));

    // Score and filter candidates
    const scored = prepareCandidates(usePlaces, prefs.vibe);
    const candidatePlaces = scored.length >= 2
      ? scored
      : usePlaces.map(p => ({ ...p, outingSuitabilityScore: 8, vibeFitScore: 5, likelyChain: false }));

    // Store candidate pool for reroll/wildcard/cheaper/fun actions
    setCandidatePool({
      places: candidatePlaces,
      fetchedAt: Date.now(),
      lat: loc.lat,
      lng: loc.lng,
      radius: RADIUS_MAP[prefs.radius] || '5000',
    });

    setGeneratingStage('building');
    await new Promise(r => setTimeout(r, 300));

    let route: GeneratedRoute;

    // Use AI planning if enabled and not demo
    if (process.env.NEXT_PUBLIC_USE_AI_PLANNING === 'true' && !isDemo) {
      try {
        const res = await fetch('/api/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: loc.lat,
            lng: loc.lng,
            radius: Number(RADIUS_MAP[prefs.radius] || '5000'),
            vibe: prefs.vibe,
            preferences: prefs,
            city: loc.city,
            neighborhood: loc.neighborhood,
          }),
        });
        if (res.ok) {
          route = await res.json();
        } else {
          // AI endpoint failed — fall back to deterministic
          route = generateRoute(candidatePlaces, prefs, loc.city, loc.neighborhood, isDemo);
        }
      } catch {
        // Network error — fall back to deterministic
        route = generateRoute(candidatePlaces, prefs, loc.city, loc.neighborhood, isDemo);
      }
    } else {
      // Deterministic planning (always works, AI key optional)
      route = generateRoute(candidatePlaces, prefs, loc.city, loc.neighborhood, isDemo);
    }

    setCurrentRoute(route);
    setGeneratingStage(null);
    setGenerating(false);
    router.push('/route');
  }, [prefs, location, places, placesFetchStatus, router, isSignedIn, updatePrefsMutation, fetchPlaces]);

  useEffect(() => {
    if (step === 2 && !fetchedPlaces && location) {
      fetchPlaces(location);
    }
  }, [step, fetchedPlaces, location, fetchPlaces]);

  const canProceed = step < 3;

  // Location status display helpers
  const locationModeLabel = location
    ? location.isDemo
      ? { icon: '🎭', text: 'Demo mode — showing sample NYC data', color: 'text-amber-400' }
      : isStale
      ? { icon: '📍', text: 'Using your last known location — tap Allow to refresh', color: 'text-text-muted' }
      : { icon: '✅', text: 'Live location confirmed', color: 'text-emerald-400' }
    : null;

  return (
    <main className="min-h-dvh relative flex flex-col">
      <Navbar />
      <div className="bg-orb w-[400px] h-[400px] bg-rally-600 -top-20 -right-20 fixed" />

      <div className="flex-1 max-w-2xl mx-auto w-full px-5 pt-4 sm:pt-8 pb-4">
        {/* Progress bar */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex-1">
                <div className={`h-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-rally-500' : 'bg-white/10'}`} />
              </div>
            ))}
          </div>
          <div className="flex justify-between px-0.5">
            {STEPS.map((s, i) => (
              <span key={s} className={`text-[10px] sm:text-xs font-medium transition-colors ${i <= step ? 'text-rally-400' : 'text-text-muted'}`}>
                {s}
              </span>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* ── Step 0: Vibe ──── */}
          {step === 0 && (
            <motion.div key="vibe" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1.5">What&apos;s the vibe?</h1>
              <p className="text-sm sm:text-base text-text-secondary mb-6">Pick the energy for your outing.</p>
              <OptionGrid options={VIBES} value={prefs.vibe} onChange={v => update('vibe', v)} columns="grid-cols-3 sm:grid-cols-3 lg:grid-cols-5" />
            </motion.div>
          )}

          {/* ── Step 1: Details ──── */}
          {step === 1 && (
            <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-lg sm:text-xl font-bold mb-3">Who&apos;s going?</h2>
                <OptionGrid options={GROUP_TYPES} value={prefs.groupType} onChange={v => update('groupType', v)} columns="grid-cols-2 sm:grid-cols-4" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold mb-3">Budget</h2>
                <OptionGrid options={BUDGETS} value={prefs.budget} onChange={v => update('budget', v)} columns="grid-cols-2 sm:grid-cols-4" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold mb-3">Time available</h2>
                <OptionGrid options={TIME_OPTIONS} value={prefs.timeAvailable} onChange={v => update('timeAvailable', v)} columns="grid-cols-2 sm:grid-cols-4" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold mb-3">How far?</h2>
                <OptionGrid options={RADIUS_OPTIONS} value={prefs.radius} onChange={v => update('radius', v)} columns="grid-cols-2 sm:grid-cols-4" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold mb-3">Energy level</h2>
                <OptionGrid options={ENERGY_OPTIONS} value={prefs.energy} onChange={v => update('energy', v)} columns="grid-cols-3" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold mb-3">Indoor / Outdoor</h2>
                <OptionGrid options={INDOOR_OUTDOOR_OPTIONS} value={prefs.indoorOutdoor} onChange={v => update('indoorOutdoor', v)} columns="grid-cols-3" />
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => update('foodRequired', !prefs.foodRequired)}
                  className="flex items-center justify-between glass-card p-4 cursor-pointer w-full text-left"
                >
                  <span className="font-medium text-sm sm:text-base">🍕 Must include food</span>
                  <div className={`w-12 h-7 rounded-full flex items-center p-1 transition-colors shrink-0 ${prefs.foodRequired ? 'bg-rally-500' : 'bg-white/10'}`}>
                    <motion.div layout className={`w-5 h-5 rounded-full bg-white ${prefs.foodRequired ? 'ml-auto' : ''}`} />
                  </div>
                </button>
                <button
                  onClick={() => update('attractionRequired', !prefs.attractionRequired)}
                  className="flex items-center justify-between glass-card p-4 cursor-pointer w-full text-left"
                >
                  <span className="font-medium text-sm sm:text-base">🎡 Must include attraction</span>
                  <div className={`w-12 h-7 rounded-full flex items-center p-1 transition-colors shrink-0 ${prefs.attractionRequired ? 'bg-rally-500' : 'bg-white/10'}`}>
                    <motion.div layout className={`w-5 h-5 rounded-full bg-white ${prefs.attractionRequired ? 'ml-auto' : ''}`} />
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Location ──── */}
          {step === 2 && (
            <motion.div key="location" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="text-4xl sm:text-5xl mb-4 sm:mb-6">📍</div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">Where are you?</h1>
              <p className="text-sm sm:text-base text-text-secondary mb-6 sm:mb-8 max-w-md mx-auto">
                Rally uses your location to find real nearby spots. Your data stays on your device.
              </p>

              {location ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-5 sm:p-6 max-w-sm mx-auto mb-6">
                  <div className="text-2xl mb-2">{locationModeLabel?.icon}</div>
                  <p className="font-bold text-lg">{location.city}</p>
                  {location.neighborhood && <p className="text-sm text-text-secondary">{location.neighborhood}</p>}
                  {location.accuracy && !location.isDemo && (
                    <p className="text-xs text-text-muted mt-1">±{Math.round(location.accuracy)}m accuracy</p>
                  )}
                  <p className={`text-xs mt-3 ${locationModeLabel?.color}`}>{locationModeLabel?.text}</p>

                  {placesFetchStatus === 'sparse' && (
                    <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <p className="text-xs text-amber-400">Limited spots found nearby — expanding search with demo data for this route.</p>
                    </div>
                  )}
                  {placesFetchStatus === 'error' && (
                    <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <p className="text-xs text-red-400">Couldn&apos;t fetch nearby spots. Check your connection and try again.</p>
                    </div>
                  )}
                  {placesFetchStatus === 'success' && !location.isDemo && (
                    <p className="text-xs text-emerald-400/70 mt-2">
                      {places.length} spots found nearby
                    </p>
                  )}

                  {/* Option to re-request fresher location */}
                  {isStale && (
                    <button onClick={handleLocationRequest} disabled={geoLoading}
                      className="mt-4 text-xs text-rally-400 underline underline-offset-2"
                    >
                      {geoLoading ? 'Refreshing...' : 'Refresh my location'}
                    </button>
                  )}
                </motion.div>
              ) : (
                <div className="flex flex-col gap-3 max-w-sm mx-auto">
                  <button onClick={handleLocationRequest} disabled={geoLoading} className="btn-primary py-4">
                    {geoLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Getting your precise location...
                      </span>
                    ) : (
                      <span>📍 Allow Location</span>
                    )}
                  </button>
                  <button onClick={handleDemo} className="btn-secondary py-3">
                    Skip — use demo data
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Step 3: Generate ──── */}
          {step === 3 && (
            <motion.div key="generate" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
              className="text-center"
            >
              {generating ? (
                <div className="py-12 sm:py-16">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-6 rounded-2xl bg-linear-to-br from-rally-500 to-rally-pink flex items-center justify-center text-xl sm:text-2xl"
                  >
                    🗺️
                  </motion.div>

                  {/* Stage-by-stage progress */}
                  <div className="max-w-xs mx-auto space-y-3 text-left">
                    {STAGE_ORDER.map(stage => {
                      const stageIdx = STAGE_ORDER.indexOf(stage);
                      const currentIdx = generatingStage ? STAGE_ORDER.indexOf(generatingStage) : -1;
                      const isDone = generatingStage !== null && stageIdx < currentIdx;
                      const isCurrent = stage === generatingStage;
                      return (
                        <motion.div
                          key={stage}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: isCurrent || isDone ? 1 : 0.3, x: 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-center gap-3"
                        >
                          <span className="w-5 h-5 flex items-center justify-center text-sm shrink-0">
                            {isDone ? (
                              <span className="text-emerald-400">✓</span>
                            ) : isCurrent ? (
                              <span className="w-4 h-4 border-2 border-rally-400/30 border-t-rally-400 rounded-full animate-spin block" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-white/20 block mx-auto" />
                            )}
                          </span>
                          <span className={`text-sm ${isDone ? 'text-emerald-400' : isCurrent ? 'text-white font-medium' : 'text-text-muted'}`}>
                            {STAGE_LABELS[stage]}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-4xl sm:text-5xl mb-4 sm:mb-6">🚀</div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">Ready to Rally?</h1>
                  <p className="text-sm sm:text-base text-text-secondary mb-4 max-w-md mx-auto">
                    Your {prefs.vibe} outing for {prefs.groupType === 'solo' ? 'one' : prefs.groupType} is about to be crafted.
                  </p>

                  {!location && (
                    <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 max-w-sm mx-auto">
                      <p className="text-xs text-amber-400">Set your location first — go back to step 3.</p>
                    </div>
                  )}

                  <div className="glass-card p-4 sm:p-5 max-w-sm mx-auto mb-6 sm:mb-8 text-left">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-text-muted">Vibe</span><span>{prefs.vibe}</span></div>
                      <div className="flex justify-between"><span className="text-text-muted">Group</span><span>{prefs.groupType}</span></div>
                      <div className="flex justify-between"><span className="text-text-muted">Budget</span><span>{prefs.budget.replace('-', ' ')}</span></div>
                      <div className="flex justify-between"><span className="text-text-muted">Time</span><span>{prefs.timeAvailable.replace('-', ' ')}</span></div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Location</span>
                        <span className="flex items-center gap-1">
                          {location?.city || '—'}
                          {location?.isDemo && <span className="text-[10px] text-amber-400 ml-1">demo</span>}
                          {location && !location.isDemo && isStale && <span className="text-[10px] text-text-muted ml-1">cached</span>}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={!location}
                    className="btn-primary text-base sm:text-lg px-8 sm:px-10 py-4 w-full sm:w-auto disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>Generate My Route</span>
                    <span>✨</span>
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Sticky bottom navigation ──── */}
      {!generating && (
        <div className="sticky-bottom-cta md:relative md:max-w-2xl md:mx-auto md:w-full md:px-5 md:pb-8">
          <div className="flex gap-3 mb-[calc(60px+env(safe-area-inset-bottom,0px))] md:mb-0">
            <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
              className="btn-secondary flex-1 sm:flex-none disabled:opacity-30 disabled:cursor-not-allowed py-3"
            >
              ← Back
            </button>
            {canProceed ? (
              <button onClick={() => {
                // Auto-enter demo if skipping past location step without setting location
                if (step === 2 && !location) {
                  handleDemo();
                }
                setStep(s => s + 1);
              }}
                className="btn-primary flex-1 sm:flex-none py-3"
              >
                <span>Next</span>
                <span>→</span>
              </button>
            ) : (
              <button onClick={handleGenerate} disabled={!location} className="btn-primary flex-1 sm:flex-none py-3 disabled:opacity-40 disabled:cursor-not-allowed">
                <span>Generate</span>
                <span>✨</span>
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
