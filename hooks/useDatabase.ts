"use client";

import { useCallback, useSyncExternalStore } from "react";
import { getDatabase, hydrateDatabase, subscribe } from "@/lib/db";

/**
 * React bindings for the local database.
 * Components subscribe to the store and re-render on every mutation,
 * which is how the UI updates immediately after each action.
 */

function subscribeToStore(callback: () => void): () => void {
  hydrateDatabase();
  return subscribe(callback);
}

function getDatabaseVersionToken(): string {
  const db = getDatabase();
  return JSON.stringify([
    db.users.length,
    db.listings.length,
    db.bookings.length,
    db.reviews.length,
    db.transactions.length,
    db.notifications.length,
    db.messages.length,
    db.savedListings.length,
    db.availability.length,
    db.categories.length,
    db.verificationRequests.length,
    db.settings,
  ]);
}

function getSnapshot(): string {
  return getDatabaseVersionToken();
}

function getServerSnapshot(): string {
  return "server";
}

/** Re-renders whenever any local database record changes. */
export function useDatabase() {
  useSyncExternalStore(subscribeToStore, getSnapshot, getServerSnapshot);
  return getDatabase();
}

const emptySubscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

/** True after client mount (useful for hydration-safe gating). */
export function useMounted(): boolean {
  return useSyncExternalStore(emptySubscribe, clientSnapshot, serverSnapshot);
}

export function useHydration(): boolean {
  const mounted = useMounted();
  if (mounted) hydrateDatabase();
  return mounted;
}

/** Force re-render after a service mutation (all mutations notify anyway). */
export function useStoreRefresh(): () => void {
  return useCallback(() => {
    hydrateDatabase();
  }, []);
}
