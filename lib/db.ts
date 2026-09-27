/**
 * Central local database.
 *
 * This module imitates a database server: it keeps an in-memory snapshot,
 * persists every mutation to localStorage, and notifies subscribers so the
 * React UI updates immediately. UI code never touches localStorage directly.
 *
 * Replacing this layer with REST calls later means swapping the repository
 * implementations; services and UI keep the same contracts.
 */

import { buildSeedDatabase } from "@/data/seed";
import { readJson, storageRemove, storageWrite, isStorageAvailable } from "@/lib/storage";
import type { DatabaseShape } from "@/types/models";

export const DB_STORAGE_KEY = "hadalink:db:v1";
export const SESSION_STORAGE_KEY = "hadalink:session:v1";
export const COMPARE_STORAGE_KEY = "hadalink:compare:v1";
export const SCHEMA_VERSION = 1;

type Listener = () => void;

const listeners = new Set<Listener>();

let state: DatabaseShape | null = null;
let hydrated = false;
let lastError: string | null = null;
let storagePersistent = true;

function isDatabaseShape(raw: unknown): raw is DatabaseShape {
  if (typeof raw !== "object" || raw === null) return false;
  const candidate = raw as Record<string, unknown>;
  const arrayKeys: (keyof DatabaseShape)[] = [
    "users",
    "farmers",
    "providers",
    "equipment",
    "services",
    "categories",
    "listings",
    "availability",
    "bookings",
    "reviews",
    "transactions",
    "notifications",
    "messages",
    "savedListings",
    "verificationRequests",
  ];
  for (const key of arrayKeys) {
    if (!Array.isArray(candidate[key])) return false;
  }
  const settings = candidate.settings as Record<string, unknown> | undefined;
  if (!settings || typeof settings.commissionRate !== "number") return false;
  return true;
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

function persist(): void {
  if (!state) return;
  const wrote = storageWrite(DB_STORAGE_KEY, JSON.stringify(state));
  storagePersistent = wrote;
}

/** Load the database from localStorage, seeding it on first run. */
export function hydrateDatabase(): DatabaseShape {
  if (state) return state;

  const outcome = readJson<DatabaseShape>(DB_STORAGE_KEY, isDatabaseShape);
  if (outcome.ok && outcome.value) {
    state = outcome.value;
    hydrated = true;
    return state;
  }

  if (outcome.corrupted) {
    lastError = "Stored data looked damaged, so the demo database was restored from seed data.";
  }

  state = buildSeedDatabase();
  persist();
  hydrated = true;
  return state;
}

export function getDatabase(): DatabaseShape {
  if (!state) return hydrateDatabase();
  return state;
}

export function isHydrated(): boolean {
  return hydrated;
}

export function getLastError(): string | null {
  return lastError;
}

export function isStoragePersistent(): boolean {
  return isStorageAvailable() && storagePersistent;
}

/** Run a mutation, persist, and notify subscribers. */
export function mutate<T>(recipe: (draft: DatabaseShape) => T): T {
  const db = getDatabase();
  const result = recipe(db);
  persist();
  notify();
  return result;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Developer/demo reset: restore the seeded database, dropping user changes. */
export function resetDatabase(): DatabaseShape {
  lastError = null;
  storageRemove(DB_STORAGE_KEY);
  state = buildSeedDatabase();
  persist();
  hydrated = true;
  notify();
  return state;
}

/** Force re-read from storage (used after multi-tab style resets). */
export function reloadDatabase(): DatabaseShape {
  state = null;
  hydrated = false;
  return hydrateDatabase();
}
