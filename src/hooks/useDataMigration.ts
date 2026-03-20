'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import {
  getSavedRoutes,
  getRouteHistory,
  getBadges,
  getPreferences,
} from '@/lib/storage';

/**
 * One-time migration hook: reads all localStorage data and imports it into
 * Convex when the user signs in for the first time.
 *
 * Triggered by: user.localDataImported === false
 * Idempotent: each import mutation deduplicates by routeId / badgeId.
 * Non-fatal: if an error occurs, migrationAttempted ref resets so it retries
 * next session. The markLocalDataImported mutation only fires after all
 * imports succeed, so the flag stays false until a clean run completes.
 *
 * localStorage is NOT cleared — it continues to work as session cache and
 * guest fallback.
 */
export function useDataMigration() {
  const { isSignedIn, isLoaded } = useUser();
  const convexUser = useQuery(api.users.getCurrentUser);

  const markImported = useMutation(api.users.markLocalDataImported);
  const importRoutes = useMutation(api.savedRoutes.importLocalRoutes);
  const importHistory = useMutation(api.routeHistory.importLocalHistory);
  const importBadges = useMutation(api.badges.importLocalBadges);
  const updatePrefs = useMutation(api.preferences.updatePreferences);

  const migrationAttempted = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (convexUser === undefined) return; // still loading
    if (!convexUser) return;             // user doc not yet created
    if (convexUser.localDataImported) return;
    if (migrationAttempted.current) return;
    migrationAttempted.current = true;

    async function runMigration() {
      try {
        const savedRoutes = getSavedRoutes();
        const history = getRouteHistory();
        const badges = getBadges();
        const prefs = getPreferences();

        const migrations: Promise<unknown>[] = [];

        if (savedRoutes.length > 0) {
          migrations.push(importRoutes({ routes: savedRoutes }));
        }
        if (history.length > 0) {
          migrations.push(importHistory({ items: history }));
        }
        if (badges.some((b) => b.earned)) {
          migrations.push(importBadges({ badges }));
        }
        if (prefs) {
          migrations.push(
            updatePrefs({
              vibe: prefs.vibe,
              groupType: prefs.groupType,
              budget: prefs.budget,
              timeAvailable: prefs.timeAvailable,
              radius: prefs.radius,
              energy: prefs.energy,
              indoorOutdoor: prefs.indoorOutdoor,
              foodRequired: prefs.foodRequired,
              attractionRequired: prefs.attractionRequired,
            })
          );
        }

        await Promise.all(migrations);
        await markImported({});
      } catch (err) {
        console.warn('[Rally] Data migration failed — will retry next session:', err);
        migrationAttempted.current = false;
      }
    }

    runMigration();
  }, [
    isLoaded,
    isSignedIn,
    convexUser,
    importRoutes,
    importHistory,
    importBadges,
    updatePrefs,
    markImported,
  ]);
}
