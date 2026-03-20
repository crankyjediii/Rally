'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';

/**
 * Ensures a Convex user document exists for the current Clerk session.
 * Runs on every sign-in — safe to call multiple times (mutation is idempotent).
 * Must run before useDataMigration so the user doc is present.
 */
export function useEnsureUser() {
  const { isSignedIn, isLoaded, user } = useUser();
  const createOrUpdate = useMutation(api.users.createOrUpdateUser);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    createOrUpdate({
      name: user.fullName ?? user.username ?? 'Rally Explorer',
      email: user.primaryEmailAddress?.emailAddress ?? '',
      imageUrl: user.imageUrl ?? undefined,
    });
  }, [isLoaded, isSignedIn, user, createOrUpdate]);
}
